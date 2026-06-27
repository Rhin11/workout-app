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
  /** Which rep (1-based) this sticking point occurred in. */
  rep?: number;
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
  /** Native video frame rate — used to sync replay overlay to frames. */
  fps?: number;
}

/** Base URL of the standalone CV service (see cv-service/README.md). */
const CV_SERVICE_URL = 'http://localhost:8000';

export interface SeedPoint {
  x: number;
  y: number;
}

/** Optional inputs for analysis: where the bar is, and which segment to analyze. */
export interface AnalyzeOptions {
  /** Tapped bar location (video pixels) seeding the tracker. */
  seed?: SeedPoint | null;
  /** Seconds into the video where the bar was tapped. */
  seedTime?: number | null;
  /** Trim: start of the working set (ms into the video). Defaults to seed time. */
  startMs?: number | null;
  /** Trim: end of the working set (ms into the video). Defaults to the clip end. */
  endMs?: number | null;
}

/**
 * THE SINGLE DATA SOURCE.
 *
 * POSTs the lift video (plus an optional seed tap and start/end trim, in video
 * pixels / ms) to the CV service and returns the parsed analysis. The tracker
 * follows the bar across the WHOLE selected segment, so every rep is captured.
 * The return shape is unchanged, so the results UI (Path + Replay) renders as-is.
 */
export async function getAnalysis(
  video: Blob,
  opts?: AnalyzeOptions | null,
): Promise<Analysis> {
  const form = new FormData();
  form.append('video', video, 'lift.webm');
  if (opts?.seed) {
    form.append('seed_x', String(Math.round(opts.seed.x)));
    form.append('seed_y', String(Math.round(opts.seed.y)));
  }
  // Default the analysis start to the moment the bar was tapped, so the tracker
  // seeds on the bar exactly where the user marked it.
  const startMs =
    opts?.startMs != null
      ? opts.startMs
      : opts?.seedTime != null
        ? Math.round(opts.seedTime * 1000)
        : null;
  if (startMs != null) form.append('start_ms', String(Math.max(0, Math.round(startMs))));
  if (opts?.endMs != null) form.append('end_ms', String(Math.round(opts.endMs)));

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

const ZONE_TIP: Record<StickingZone, string> = {
  bottom: 'Sticking near the bottom — focus on staying tight and driving out of the hole.',
  mid: 'Mid-range sticking point — often weak glutes/hips or loss of tension.',
  lockout: 'Sticking near lockout — often a triceps (press) or upper-back/lockout weakness.',
};

/** Auto-generated coaching tip based on where in the rep the sticking occurs. */
export function tipForPosition(positionPct: number): string {
  return ZONE_TIP[stickingZone(positionPct)];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
