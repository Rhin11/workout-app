// ─────────────────────────────────────────────────────────────────────────────
// ExerciseDB service — the SINGLE place that talks to the external exercise API.
//
// All calls to the hosted ExerciseDB v1 API (https://oss.exercisedb.dev) live
// here, normalized into one internal `DbExercise` shape the UI consumes. To swap
// the data source later, only this module changes — same isolation pattern as
// getAnalysis() in utils/barbellAnalysis.ts.
//
// Contract confirmed against the live API (https://oss.exercisedb.dev/docs):
//   GET /exercises?name={query}&limit=                 → { success, meta, data }
//   GET /exercises?equipments={eq}&name={query}&limit= → { success, meta, data }
//   GET /exercises?targetMuscles={name}&limit=         → { success, meta, data }
//   GET /exercises/{exerciseId}                        → { success, data }
//   GET /exercises/search                              → often 503; do NOT use
//   exercise fields: exerciseId, name, gifUrl, targetMuscles[], bodyParts[],
//                    equipments[], secondaryMuscles[], instructions[]
// No API key is required for the free oss.exercisedb.dev host.
// ─────────────────────────────────────────────────────────────────────────────

/** Normalized exercise shape used by the whole UI. */
export interface DbExercise {
  id: string;
  name: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  gifUrl: string;
  instructions: string[];
}

const EXERCISEDB_BASE =
  import.meta.env.VITE_EXERCISEDB_BASE ?? 'https://oss.exercisedb.dev/api/v1';

// Not required for v1; supported only so a future keyed source is a config change.
const EXERCISEDB_KEY = import.meta.env.VITE_EXERCISEDB_KEY as string | undefined;

const PAGE_LIMIT = 25; // API caps page size at 25.

/**
 * Map the app's muscle-diagram labels → the API's `targetMuscles` vocabulary
 * (confirmed via GET /muscles). This is what `getExercisesByMuscle` queries.
 */
const APP_LABEL_TO_API_MUSCLE: Record<string, string> = {
  Chest: 'pectorals',
  Back: 'lats',
  Shoulders: 'delts',
  Biceps: 'biceps',
  Triceps: 'triceps',
  Quads: 'quads',
  Hamstrings: 'hamstrings',
  Glutes: 'glutes',
  Calves: 'calves',
  Core: 'abs',
  Traps: 'traps',
  Forearms: 'forearms',
  Abductors: 'abductors',
  Adductors: 'adductors',
};

/**
 * Reverse map: the API's muscle names → the app diagram's labels, so an
 * exercise's target/secondary muscles can highlight the existing muscle map.
 * Many API names collapse onto one diagram label.
 */
const API_MUSCLE_TO_APP_LABEL: Record<string, string> = {
  pectorals: 'Chest',
  chest: 'Chest',
  'upper chest': 'Chest',
  'serratus anterior': 'Core',
  lats: 'Back',
  'latissimus dorsi': 'Back',
  'upper back': 'Back',
  'lower back': 'Back',
  back: 'Back',
  rhomboids: 'Back',
  spine: 'Back',
  traps: 'Traps',
  trapezius: 'Traps',
  'levator scapulae': 'Traps',
  delts: 'Shoulders',
  deltoids: 'Shoulders',
  shoulders: 'Shoulders',
  'rear deltoids': 'Shoulders',
  'rotator cuff': 'Shoulders',
  biceps: 'Biceps',
  brachialis: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  'wrist flexors': 'Forearms',
  'wrist extensors': 'Forearms',
  'grip muscles': 'Forearms',
  wrists: 'Forearms',
  hands: 'Forearms',
  abs: 'Core',
  abdominals: 'Core',
  'lower abs': 'Core',
  core: 'Core',
  obliques: 'Core',
  glutes: 'Glutes',
  quads: 'Quads',
  quadriceps: 'Quads',
  'hip flexors': 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  soleus: 'Calves',
  shins: 'Calves',
  'ankle stabilizers': 'Calves',
  ankles: 'Calves',
  feet: 'Calves',
  adductors: 'Adductors',
  'inner thighs': 'Adductors',
  groin: 'Adductors',
  abductors: 'Abductors',
};

/** Convert API muscle names to the app's diagram labels (deduped, known only). */
export function apiMusclesToAppLabels(names: string[]): string[] {
  const labels = new Set<string>();
  for (const name of names) {
    const label = API_MUSCLE_TO_APP_LABEL[name.toLowerCase()];
    if (label) labels.add(label);
  }
  return [...labels];
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

const REQUEST_TIMEOUT_MS = 12_000;

export type ExerciseDbErrorCode = 'network' | 'timeout' | 'http';

export class ExerciseDbRequestError extends Error {
  readonly code: ExerciseDbErrorCode;
  readonly status?: number;

  constructor(message: string, code: ExerciseDbErrorCode, status?: number) {
    super(message);
    this.name = 'ExerciseDbRequestError';
    this.code = code;
    this.status = status;
  }
}

async function apiGet(path: string): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (EXERCISEDB_KEY) headers['x-api-key'] = EXERCISEDB_KEY;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${EXERCISEDB_BASE}${path}`, { headers, signal: controller.signal });
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === 'AbortError'
        ? `ExerciseDB request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : 'ExerciseDB unreachable (network/CORS error)';
    console.error('[ExerciseDB]', message, { path, err });
    throw new ExerciseDbRequestError(message, err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { message?: string; detail?: string };
      detail = body.message ?? body.detail ?? '';
    } catch {
      try {
        detail = (await res.text()).slice(0, 200);
      } catch {
        /* ignore */
      }
    }
    const message = detail
      ? `ExerciseDB HTTP ${res.status}: ${detail}`
      : `ExerciseDB HTTP ${res.status}`;
    console.error('[ExerciseDB]', message, { path });
    throw new ExerciseDbRequestError(message, 'http', res.status);
  }

  return res.json();
}

function buildExercisesPath(params: Record<string, string>): string {
  const qs = new URLSearchParams({ limit: String(PAGE_LIMIT), ...params });
  return `/exercises?${qs}`;
}

async function fetchExerciseList(params: Record<string, string>): Promise<DbExercise[]> {
  const payload = await apiGet(buildExercisesPath(params));
  return unwrapList(payload).map(normalize);
}

/** Unwrap the `{ success, meta, data }` envelope into the raw array. */
function unwrapList(payload: unknown): RawExercise[] {
  if (Array.isArray(payload)) return payload as RawExercise[];
  const data = (payload as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as RawExercise[]) : [];
}

// Tiny in-memory caches so re-selecting a muscle / reopening detail is instant.
const muscleCache = new Map<string, DbExercise[]>();
const idCache = new Map<string, DbExercise>();

/** Exercises that target the given app muscle label (e.g. "Chest"). */
export async function getExercisesByMuscle(muscle: string): Promise<DbExercise[]> {
  const apiMuscle = APP_LABEL_TO_API_MUSCLE[muscle] ?? muscle.toLowerCase();
  const cached = muscleCache.get(apiMuscle);
  if (cached) return cached;

  const payload = await apiGet(
    buildExercisesPath({ targetMuscles: apiMuscle }),
  );
  const exercises = unwrapList(payload).map(normalize);
  muscleCache.set(apiMuscle, exercises);
  exercises.forEach((e) => idCache.set(e.id, e));
  return exercises;
}

/** A single exercise by its ExerciseDB id. */
export async function getExerciseById(id: string): Promise<DbExercise> {
  const cached = idCache.get(id);
  if (cached) return cached;

  const payload = await apiGet(`/exercises/${encodeURIComponent(id)}`);
  const data = (payload as { data?: RawExercise })?.data ?? (payload as RawExercise);
  const exercise = normalize(data);
  idCache.set(id, exercise);
  return exercise;
}

/** Free-text exercise search by name (uses the `name` filter — not /search). */
export async function searchExercises(query: string): Promise<DbExercise[]> {
  const q = query.trim();
  if (!q) return [];
  return fetchExerciseList({ name: q });
}

/** Name search scoped to barbell equipment — better for this app's lifts. */
async function searchBarbellExercises(query: string): Promise<DbExercise[]> {
  const q = query.trim();
  if (!q) return [];
  return fetchExerciseList({ name: q, equipments: 'barbell' });
}

// ── Best-match-by-name lookup (for the exercise-info popup's "Demo" view) ──────

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
function matchScore(queryNorm: string, queryTokens: string[], mainToken: string, candName: string): number {
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

async function collectCandidates(
  queries: string[],
): Promise<{ candidates: DbExercise[]; lastError: ExerciseDbRequestError | null }> {
  const seen = new Set<string>();
  const out: DbExercise[] = [];
  let lastError: ExerciseDbRequestError | null = null;

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
      add(await searchExercises(q));
    } catch (err) {
      if (err instanceof ExerciseDbRequestError) lastError = err;
      console.warn('[ExerciseDB] name search failed:', q, err);
    }
    try {
      add(await searchBarbellExercises(q));
    } catch (err) {
      if (err instanceof ExerciseDbRequestError) lastError = err;
      console.warn('[ExerciseDB] barbell search failed:', q, err);
    }
  }

  return { candidates: out, lastError };
}

const nameCache = new Map<string, DbExercise | null>();

/**
 * Find the ExerciseDB exercise that best matches an app exercise name (e.g.
 * "Back Squat"). Returns `null` when nothing reasonable matches. Used to fetch a
 * demo GIF + instructions for the exercise-info popup.
 */
export async function getExerciseByName(name: string): Promise<DbExercise | null> {
  const key = normalizeName(name);
  if (!key) return null;
  if (nameCache.has(key)) return nameCache.get(key) ?? null;

  const tokens = key.split(' ');
  const mainToken = tokens[tokens.length - 1];
  const stripped = tokens.filter((t) => !GENERIC_TOKENS.has(t)).join(' ');

  const queries = [
    key,
    stripped,
    stripped && !stripped.includes('barbell') ? `barbell ${stripped}` : '',
    mainToken,
  ].filter(Boolean);

  const { candidates, lastError } = await collectCandidates(queries);
  if (!candidates.length) {
    if (lastError) throw lastError;
    nameCache.set(key, null);
    return null;
  }

  let best: DbExercise | null = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = matchScore(key, tokens, mainToken, candidate.name);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  const result = bestScore >= 0 ? best : null;
  nameCache.set(key, result);
  return result;
}
