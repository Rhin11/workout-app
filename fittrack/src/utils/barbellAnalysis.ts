// ─────────────────────────────────────────────────────────────────────────────
// Barbell path analysis.
//
// This module is the single isolation layer between the UI and the real
// video-analysis backend. `getAnalysis()` POSTs the lift video to the standalone
// CV service (cv-service/, port 8000) and returns its result; the `Analysis`
// shape below is the contract the results UI renders from. `generateMockAnalysis`
// is retained as a dev/offline reference and is not on the live path.
// ─────────────────────────────────────────────────────────────────────────────

export interface PathPoint {
  x: number;
  y: number;
  frame: number;
  time_ms: number;
}

export interface StickingPoint {
  frame: number;
  time_ms: number;
  position_pct: number;
}

export interface Analysis {
  path: PathPoint[];
  sticking_points: StickingPoint[];
  rep_count: number;
  avg_speed: number;
  peak_speed: number;
  time_under_tension_s: number;
  /**
   * Native video pixel dimensions. Present for real CV results (path is in pixel
   * coordinates); absent for legacy Stage-1 mock sessions (normalized 0–100 space).
   */
  video_width?: number;
  video_height?: number;
}

/** Base URL of the standalone CV service (see cv-service/README.md). */
const CV_SERVICE_URL = 'http://localhost:8000';

export interface SeedPoint {
  x: number;
  y: number;
}

/**
 * THE SINGLE DATA SOURCE.
 *
 * POSTs the lift video (and an optional seed point, in video pixels) to the CV
 * service and returns the parsed analysis. The return shape is identical to the
 * Stage-1 mock, so the results UI renders unchanged.
 */
export async function getAnalysis(video: Blob, seed?: SeedPoint | null): Promise<Analysis> {
  const form = new FormData();
  form.append('video', video, 'lift.webm');
  if (seed) {
    form.append('seed_x', String(Math.round(seed.x)));
    form.append('seed_y', String(Math.round(seed.y)));
  }

  let res: Response;
  try {
    res = await fetch(`${CV_SERVICE_URL}/analyze`, { method: 'POST', body: form });
  } catch {
    throw new Error(
      "Analysis service isn't running — start the cv-service (see cv-service/README.md).",
    );
  }

  if (!res.ok) {
    let message = 'Analysis failed. Please try again.';
    try {
      const data = await res.json();
      if (typeof data?.detail === 'string') message = data.detail;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message);
  }

  return (await res.json()) as Analysis;
}

// ── Mock generation ──────────────────────────────────────────────────────────

const MOCK_FPS = 30;

/**
 * Build a believable vertical bar path: the bar descends (eccentric) then
 * ascends (concentric) with slight horizontal drift, repeated `repCount` times.
 * One or two sticking points are placed in the slow part of the ascent so the
 * overlay markers line up with visibly slow segments.
 *
 * Coordinate space is normalized 0–100 (x = horizontal, y = vertical with 0 at
 * the TOP of the frame), matching the SVG overlay's `viewBox="0 0 100 100"`.
 */
export function generateMockAnalysis(): Analysis {
  const repCount = Math.random() < 0.5 ? 1 : 2;
  const pointsPerRep = 40;

  // Vertical travel: bar racked high (small y) at lockout, low (large y) at the
  // bottom of the rep. We sweep top → bottom → top per rep.
  const topY = 22; // lockout height
  const bottomY = 78; // bottom of the rep
  const centerX = 50;

  const path: PathPoint[] = [];
  const stickingPoints: StickingPoint[] = [];

  let frame = 0;

  for (let rep = 0; rep < repCount; rep += 1) {
    // A sticking point this rep, expressed as a fraction (0..1) up the ascent.
    const stickFrac = 0.4 + Math.random() * 0.4; // mid-to-upper ascent
    const stickWidth = 0.12;

    // Track the ascent sample nearest stickFrac so every rep yields exactly one
    // sticking point (regardless of sampling granularity).
    let best: { frame: number; time_ms: number; position_pct: number; dist: number } | null = null;

    for (let i = 0; i < pointsPerRep; i += 1) {
      const t = i / (pointsPerRep - 1); // 0..1 across this rep

      // Smooth descent for the first half, ascent for the second half.
      let y: number;
      let ascentProgress = -1; // 0 at bottom, 1 at lockout — <0 means not on ascent
      if (t < 0.5) {
        // Eccentric: top → bottom (ease in/out).
        const e = easeInOut(t / 0.5);
        y = topY + (bottomY - topY) * e;
      } else {
        // Concentric: bottom → top, slowed near the sticking point.
        const raw = (t - 0.5) / 0.5; // 0..1 up the ascent
        ascentProgress = raw;
        const slowed = applySticking(raw, stickFrac, stickWidth);
        y = bottomY + (topY - bottomY) * slowed;
      }

      // Slight horizontal drift: bar loops forward then back over the rep.
      const drift = Math.sin(t * Math.PI * 2) * 2.5 + (Math.random() - 0.5) * 0.8;
      const x = centerX + drift;

      const time_ms = Math.round((frame / MOCK_FPS) * 1000);
      path.push({ x: round1(x), y: round1(y), frame, time_ms });

      // Keep the ascent sample closest to this rep's sticking fraction.
      if (ascentProgress >= 0) {
        const dist = Math.abs(ascentProgress - stickFrac);
        if (!best || dist < best.dist) {
          best = {
            frame,
            time_ms,
            // position_pct: where in the rep (0 = bottom, 100 = lockout).
            position_pct: Math.round(ascentProgress * 100),
            dist,
          };
        }
      }

      frame += 1;
    }

    if (best) {
      stickingPoints.push({
        frame: best.frame,
        time_ms: best.time_ms,
        position_pct: best.position_pct,
      });
    }
  }

  const speeds = segmentSpeeds(path);
  const peak_speed = speeds.length ? Math.max(...speeds) : 0;
  const avg_speed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const time_under_tension_s = path.length
    ? (path[path.length - 1].time_ms - path[0].time_ms) / 1000
    : 0;

  return {
    path,
    sticking_points: stickingPoints,
    rep_count: repCount,
    avg_speed: round2(avg_speed),
    peak_speed: round2(peak_speed),
    time_under_tension_s: round1(time_under_tension_s),
  };
}

/** Ease-in-out curve for natural-looking acceleration. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Warp ascent progress so the bar dwells (slows) around `center`, producing a
 * believable sticking point. Returns a remapped 0..1 progress.
 */
function applySticking(progress: number, center: number, width: number): number {
  const dwell = 0.18 * Math.exp(-Math.pow((progress - center) / width, 2));
  // Subtract the dwell bump then renormalize so endpoints stay 0 and 1.
  const warped = progress - dwell * Math.sin(progress * Math.PI);
  return Math.max(0, Math.min(1, warped));
}

// ── Shared speed helpers (used by the overlay too) ───────────────────────────

/**
 * Bar speed (m/s) for each path segment, scaled from normalized units. Assumes
 * the frame's vertical extent maps to roughly 1 meter of real travel — fine for
 * mock visuals and consistent stats.
 */
export function segmentSpeeds(path: PathPoint[]): number[] {
  const METERS_PER_UNIT = 1 / 100; // 100 normalized units ≈ 1 m of travel
  const speeds: number[] = [];
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y) * METERS_PER_UNIT;
    const dt = (b.time_ms - a.time_ms) / 1000;
    speeds.push(dt > 0 ? dist / dt : 0);
  }
  return speeds;
}

/**
 * Map a normalized speed (0 = slowest, 1 = fastest) to a color on a
 * red → yellow → green ramp. Slow = red, fast = green.
 */
export function speedColor(normalized: number): string {
  const t = Math.max(0, Math.min(1, normalized));
  // red (0) → yellow (0.5) → green (1)
  let r: number;
  let g: number;
  if (t < 0.5) {
    // red → yellow
    r = 255;
    g = Math.round(255 * (t / 0.5));
  } else {
    // yellow → green
    r = Math.round(255 * (1 - (t - 0.5) / 0.5));
    g = 200;
  }
  return `rgb(${r}, ${g}, 70)`;
}

export type StickingZone = 'bottom' | 'mid' | 'lockout';

/** Which zone of the rep a sticking position falls in. Shared by tips + trends. */
export function stickingZone(positionPct: number): StickingZone {
  if (positionPct < 30) return 'bottom';
  if (positionPct < 60) return 'mid';
  return 'lockout';
}

/** Short human label for a zone, e.g. for the recurring-sticking insight. */
export const ZONE_LABEL: Record<StickingZone, string> = {
  bottom: 'near the bottom',
  mid: 'mid-range',
  lockout: 'near lockout',
};

/** Lift families that get tailored sticking-point advice. */
export type LiftCategory = 'bench' | 'squat' | 'deadlift' | 'ohp' | 'unknown';

/**
 * Classify a tagged exercise name into a lift family. Order matters: "bench
 * press" and "overhead press" both contain "press", so the more specific names
 * are checked first.
 */
export function liftCategory(exerciseName: string | null | undefined): LiftCategory {
  const n = (exerciseName ?? '').toLowerCase();
  if (!n) return 'unknown';
  if (n.includes('bench')) return 'bench'; // bench press, incline bench, etc.
  if (n.includes('deadlift')) return 'deadlift'; // conventional / Romanian / sumo
  if (n.includes('squat')) return 'squat'; // back / front squat
  if (
    n.includes('overhead press') ||
    n.includes('push press') ||
    n.includes('military press') ||
    n.includes('shoulder press') ||
    n.includes('ohp')
  ) {
    return 'ohp';
  }
  return 'unknown';
}

type ConcentricZone = 'bottom' | 'mid' | 'top';

/** Bottom (0–33%), mid (33–66%), top (66–100%) of the concentric/upward phase. */
function concentricZone(positionPct: number): ConcentricZone {
  if (positionPct <= 33) return 'bottom';
  if (positionPct <= 66) return 'mid';
  return 'top';
}

const LIFT_TIPS: Record<Exclude<LiftCategory, 'unknown'>, Record<ConcentricZone, string>> = {
  bench: {
    bottom: 'Sticking off the chest — often weak chest/pecs or a loss of tightness at the bottom.',
    mid: 'Mid-range sticking point — commonly a chest-to-triceps transition weakness.',
    top: 'Sticking near lockout — often weak triceps.',
  },
  squat: {
    bottom: 'Sticking out of the hole — often weak quads or loss of tightness at the bottom.',
    mid: 'Mid-range sticking point — commonly weak glutes/hips or loss of tension.',
    top: 'Sticking near the top — often a grind issue; usually not a strength limiter.',
  },
  deadlift: {
    bottom: 'Sticking off the floor — often weak quads/leg drive or back not set.',
    mid: 'Sticking at the knees — commonly weak hamstrings or upper-back rounding.',
    top: 'Sticking at lockout — often weak glutes or lats not engaged.',
  },
  ohp: {
    bottom: 'Sticking off the shoulders — often weak front delts.',
    mid: 'Mid-range sticking point — commonly a delt-to-triceps transition weakness.',
    top: 'Sticking near lockout — often weak triceps or upper-back stability.',
  },
};

/**
 * Lift-aware coaching tip for a sticking point: the muscle/cause explanation is
 * specific to the tagged exercise, while the zone (bottom/mid/top) comes from
 * where in the concentric phase it occurred. Untagged or unrecognized lifts get
 * a neutral, lift-agnostic message (never squat/glute advice by default).
 */
export function tipForLift(exerciseName: string | null | undefined, positionPct: number): string {
  const cat = liftCategory(exerciseName);
  if (cat === 'unknown') {
    return `Sticking point at ${Math.round(
      positionPct,
    )}% of the rep — a slowdown here suggests a weak point in this range.`;
  }
  return LIFT_TIPS[cat][concentricZone(positionPct)];
}

// Detected points within this rep-position range AND time gap belong to the same
// stall zone and are merged into one for display.
const STICK_MERGE_POSITION_PCT = 12;
const STICK_MERGE_TIME_MS = 1000;

/**
 * Collapse clustered sticking points into one per stall zone for display only.
 *
 * Consecutive points close in BOTH rep position (~12%) and time (~1s) are merged
 * into a single representative point at the cluster's average position (keeping a
 * real member's frame/time for the marker + timestamp). Genuinely separate stalls
 * (e.g. off the chest vs. near lockout) stay distinct. Does not touch tracking,
 * the path, or how positions are computed.
 */
export function consolidateStickingPoints(points: StickingPoint[]): StickingPoint[] {
  if (points.length <= 1) return [...points];

  const sorted = [...points].sort((a, b) => a.time_ms - b.time_ms);
  const clusters: StickingPoint[][] = [];
  let current: StickingPoint[] = [sorted[0]];
  let meanPos = sorted[0].position_pct;

  for (let i = 1; i < sorted.length; i += 1) {
    const p = sorted[i];
    const prev = current[current.length - 1];
    const closePos = Math.abs(p.position_pct - meanPos) <= STICK_MERGE_POSITION_PCT;
    const closeTime = p.time_ms - prev.time_ms <= STICK_MERGE_TIME_MS;
    if (closePos && closeTime) {
      current.push(p);
      meanPos = current.reduce((s, q) => s + q.position_pct, 0) / current.length;
    } else {
      clusters.push(current);
      current = [p];
      meanPos = p.position_pct;
    }
  }
  clusters.push(current);

  return clusters.map((cluster) => {
    if (cluster.length === 1) return cluster[0];
    const avg = cluster.reduce((s, q) => s + q.position_pct, 0) / cluster.length;
    // Representative member = the one nearest the cluster's average position, so
    // its frame/time (and any extra fields) stay real; report at the avg position.
    const rep = cluster.reduce((best, q) =>
      Math.abs(q.position_pct - avg) < Math.abs(best.position_pct - avg) ? q : best,
    );
    return { ...rep, position_pct: Math.round(avg) };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
