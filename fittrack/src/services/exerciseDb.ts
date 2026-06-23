// ─────────────────────────────────────────────────────────────────────────────
// ExerciseDB service — thin client for the exercise-info popup's "Demo" view.
//
// ExerciseDB (Cloudflare-fronted oss.exercisedb.dev) blocks direct browser calls
// (CORS), so this no longer talks to ExerciseDB directly. Instead it calls OUR
// Node backend at GET /api/exercise-demo?name=..., which proxies ExerciseDB
// server-side and does the name→best-match scoring. The backend returns the
// normalized `DbExercise` shape this module exposes, so the UI is unchanged.
// (Same backend-proxy pattern as the Lift Coach feature.)
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { api } from './api';

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

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface DemoResponse {
  found?: boolean;
  exercise?: DbExercise;
  status?: number;
}

// Cache by normalized name so reopening a popup is instant.
const nameCache = new Map<string, DbExercise | null>();

/**
 * Find the ExerciseDB exercise that best matches an app exercise name (e.g.
 * "Back Squat") via our backend proxy. Returns `null` when nothing reasonable
 * matches. Used to fetch a demo GIF + instructions for the exercise-info popup.
 */
export async function getExerciseByName(name: string): Promise<DbExercise | null> {
  const key = normalizeName(name);
  if (!key) return null;
  if (nameCache.has(key)) return nameCache.get(key) ?? null;

  try {
    const res = await api.get<DemoResponse>('/api/exercise-demo', { params: { name } });
    const result = res.data?.found ? (res.data.exercise ?? null) : null;
    nameCache.set(key, result);
    return result;
  } catch (err) {
    // Re-throw as ExerciseDbRequestError so the popup keeps its status-aware
    // error UX (429 rate limit / 503 unavailable / message).
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? (err.response?.data as DemoResponse | undefined)?.status;
      const code: ExerciseDbErrorCode = err.code === 'ECONNABORTED' ? 'timeout' : err.response ? 'http' : 'network';
      const backendHint = ` (${api.defaults.baseURL ?? 'http://localhost:3000'})`;
      const detail =
        code === 'network'
          ? `Cannot reach the backend${backendHint} — start it with: cd backend && npm run dev`
          : ((err.response?.data as { error?: string } | undefined)?.error ?? err.message);
      console.error('[ExerciseDemo] request failed:', { name, code, status, detail, baseURL: api.defaults.baseURL });
      throw new ExerciseDbRequestError(detail, code, status);
    }
    throw err;
  }
}
