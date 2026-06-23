// ─────────────────────────────────────────────────────────────────────────────
// Exercise Demo route — server-side proxy to ExerciseDB for the info popup's
// "Demo" view. ExerciseDB (Cloudflare-fronted oss.exercisedb.dev) blocks direct
// browser calls (CORS), so the browser hits THIS endpoint and we call ExerciseDB
// from Node, where it works. Same proxy pattern as the Lift Coach route.
//
// GET /api/exercise-demo?name=<exerciseName>
//   → 200 { found: true, exercise: { id, name, gifUrl, instructions,
//                                    targetMuscles, secondaryMuscles,
//                                    bodyParts, equipment } }
//   → 200 { found: false }                 (no reasonable match)
//   → 400 { error }                        (missing name)
//   → 502 { error }                        (ExerciseDB upstream failure)
//
// Contract confirmed against the live API (https://oss.exercisedb.dev/docs):
//   GET /exercises?name={q}&limit=                  → { success, meta, data }
//   GET /exercises?equipments={eq}&name={q}&limit=  → { success, meta, data }
//   exercise fields: exerciseId, name, gifUrl, targetMuscles[], bodyParts[],
//                    equipments[], secondaryMuscles[], instructions[]
// No API key is required for the free oss.exercisedb.dev host; EXERCISEDB_KEY is
// supported so a future keyed source is a config change only.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from 'express';

const router = Router();

const EXERCISEDB_BASE =
  process.env.EXERCISEDB_BASE || 'https://oss.exercisedb.dev/api/v1';
const EXERCISEDB_KEY = process.env.EXERCISEDB_KEY; // optional
const PAGE_LIMIT = 25; // API caps page size at 25.
const REQUEST_TIMEOUT_MS = 12_000;
const UNAVAILABLE_MESSAGE = 'Exercise demos are unavailable right now — try again in a moment.';

/** Normalized exercise shape returned to the frontend (matches its DbExercise). */
interface DbExercise {
  id: string;
  name: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  gifUrl: string;
  instructions: string[];
}

interface RawExercise {
  exerciseId?: string;
  id?: string;
  name?: string;
  gifUrl?: string;
  imageUrl?: string;
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  equipment?: string[];
  instructions?: string[];
}

function normalize(raw: RawExercise): DbExercise {
  return {
    id: raw.exerciseId ?? raw.id ?? '',
    name: raw.name ?? 'Unknown exercise',
    targetMuscles: raw.targetMuscles ?? [],
    secondaryMuscles: raw.secondaryMuscles ?? [],
    bodyParts: raw.bodyParts ?? [],
    equipment: raw.equipments ?? raw.equipment ?? [],
    gifUrl: raw.gifUrl ?? raw.imageUrl ?? '',
    instructions: raw.instructions ?? [],
  };
}

class ExerciseDbError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ExerciseDbError';
    this.status = status;
  }
}

/** Single GET to ExerciseDB with a timeout; throws ExerciseDbError on failure. */
async function apiGet(path: string): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (EXERCISEDB_KEY) headers['x-api-key'] = EXERCISEDB_KEY;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: globalThis.Response;
  try {
    res = await fetch(`${EXERCISEDB_BASE}${path}`, { headers, signal: controller.signal });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    const message = aborted
      ? `ExerciseDB request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
      : 'ExerciseDB unreachable (network error)';
    console.error('[ExerciseDB]', message, { path, err });
    throw new ExerciseDbError(message);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[ExerciseDB] HTTP', res.status, { path, body: body.slice(0, 300) });
    throw new ExerciseDbError(`ExerciseDB HTTP ${res.status}`, res.status);
  }

  return res.json();
}

/** Unwrap the `{ success, meta, data }` envelope into the raw array. */
function unwrapList(payload: unknown): RawExercise[] {
  if (Array.isArray(payload)) return payload as RawExercise[];
  const data = (payload as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as RawExercise[]) : [];
}

function buildExercisesPath(params: Record<string, string>): string {
  const qs = new URLSearchParams({ limit: String(PAGE_LIMIT), ...params });
  return `/exercises?${qs}`;
}

// ── Name matching (ported verbatim from the frontend's old direct-call logic) ──

const GENERIC_TOKENS = new Set([
  'barbell', 'dumbbell', 'cable', 'machine', 'smith', 'band', 'lever', 'weighted',
  'sled', 'bodyweight', 'kettlebell', 'ez', 'bar', 'the', 'with', 'a', 'and', 'of',
]);

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Score how well an ExerciseDB candidate matches the requested app exercise name. */
function matchScore(
  queryNorm: string,
  queryTokens: string[],
  mainToken: string,
  candName: string,
): number {
  const candNorm = normalizeName(candName);
  const candTokens = candNorm.split(' ');
  // Must share the primary movement word (e.g. "squat", "press", "deadlift").
  if (!candTokens.includes(mainToken)) return -1;

  let score = 0;
  if (candNorm.includes(queryNorm)) score += 100; // exact phrase contained
  const overlap = queryTokens.filter((t) => candTokens.includes(t)).length;
  score += overlap * 10;
  // Penalize extra descriptive words so the plainest movement wins.
  const extra = candTokens.filter((t) => !queryTokens.includes(t) && !GENERIC_TOKENS.has(t)).length;
  score -= extra * 3;
  // Strong preference for the barbell variant — this is a barbell-centric app and
  // most logged lifts are the barbell version of a movement.
  if (candTokens[0] === 'barbell') score += 5;
  if (queryTokens.includes('back') && queryTokens.includes('squat')) {
    if (candNorm.includes('low bar') || candNorm.includes('back pov')) score += 8;
  }
  if (queryNorm.includes('romanian') && candNorm.includes('romanian')) score += 12;
  if (queryNorm.includes('bench') && candNorm.includes('bench press')) score += 8;
  score -= candTokens.length * 0.2;
  return score;
}

/** Fetch + dedupe candidates across name and barbell-scoped name searches. */
async function collectCandidates(queries: string[]): Promise<DbExercise[]> {
  const seen = new Set<string>();
  const out: DbExercise[] = [];

  const add = (list: DbExercise[]) => {
    for (const e of list) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        out.push(e);
      }
    }
  };

  for (const q of queries) {
    if (!q) continue;
    try {
      add(unwrapList(await apiGet(buildExercisesPath({ name: q }))).map(normalize));
    } catch (err) {
      console.warn('[ExerciseDB] name search failed:', q, err);
    }
    try {
      add(
        unwrapList(await apiGet(buildExercisesPath({ name: q, equipments: 'barbell' }))).map(normalize),
      );
    } catch (err) {
      console.warn('[ExerciseDB] barbell search failed:', q, err);
    }
  }

  if (!out.length) {
    throw new ExerciseDbError(UNAVAILABLE_MESSAGE);
  }

  return out;
}

router.get('/', async (req: Request, res: Response) => {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const key = normalizeName(name);
  if (!key) {
    res.json({ found: false });
    return;
  }

  const tokens = key.split(' ');
  const mainToken = tokens[tokens.length - 1];
  const stripped = tokens.filter((t) => !GENERIC_TOKENS.has(t)).join(' ');

  // Dedupe so e.g. "squat" (where key/stripped/mainToken all collapse) doesn't
  // fire the same upstream query three times and trip ExerciseDB's rate limit.
  const queries = [
    ...new Set(
      [
        key,
        stripped,
        stripped && !stripped.includes('barbell') ? `barbell ${stripped}` : '',
        mainToken,
      ].filter(Boolean),
    ),
  ];

  try {
    const candidates = await collectCandidates(queries);

    let best: DbExercise | null = null;
    let bestScore = -1;
    for (const candidate of candidates) {
      const score = matchScore(key, tokens, mainToken, candidate.name);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best && bestScore >= 0 && best.gifUrl) {
      res.json({ found: true, exercise: best });
    } else {
      res.json({ found: false });
    }
  } catch (err) {
    if (err instanceof ExerciseDbError) {
      res.status(502).json({ error: UNAVAILABLE_MESSAGE, status: err.status });
      return;
    }
    console.error('Exercise demo error', err);
    res.status(500).json({ error: UNAVAILABLE_MESSAGE });
  }
});

export default router;
