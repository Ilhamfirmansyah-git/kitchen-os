/**
 * Pure geometry for D-pad spatial navigation.
 * Kept DOM-free so it can be unit tested.
 */

export type Direction = "up" | "down" | "left" | "right";

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const cx = (b: Box) => (b.left + b.right) / 2;
const cy = (b: Box) => (b.top + b.bottom) / 2;

/** Gap between two 1-D ranges (0 when they overlap). */
function rangeGap(a1: number, a2: number, b1: number, b2: number): number {
  if (b2 < a1) return a1 - b2;
  if (b1 > a2) return b1 - a2;
  return 0;
}

/**
 * Score a candidate relative to the origin for a direction.
 * Returns null when the candidate is not in that direction.
 *
 * Lower is better. Candidates that overlap the origin on the perpendicular
 * axis (i.e. are "in line") are strongly preferred, which produces the
 * predictable row/column behaviour users expect from TV interfaces.
 */
export function scoreCandidate(from: Box, to: Box, dir: Direction): number | null {
  const EPS = 1;
  let major: number;
  let minor: number;
  let align: number;

  switch (dir) {
    case "right":
      if (cx(to) <= cx(from) + EPS || to.right <= from.right + EPS) return null;
      major = Math.max(0, to.left - from.right);
      minor = rangeGap(from.top, from.bottom, to.top, to.bottom);
      align = Math.abs(cy(to) - cy(from));
      break;
    case "left":
      if (cx(to) >= cx(from) - EPS || to.left >= from.left - EPS) return null;
      major = Math.max(0, from.left - to.right);
      minor = rangeGap(from.top, from.bottom, to.top, to.bottom);
      align = Math.abs(cy(to) - cy(from));
      break;
    case "down":
      if (cy(to) <= cy(from) + EPS || to.bottom <= from.bottom + EPS) return null;
      major = Math.max(0, to.top - from.bottom);
      minor = rangeGap(from.left, from.right, to.left, to.right);
      align = Math.abs(cx(to) - cx(from));
      break;
    case "up":
      if (cy(to) >= cy(from) - EPS || to.top >= from.top - EPS) return null;
      major = Math.max(0, from.top - to.bottom);
      minor = rangeGap(from.left, from.right, to.left, to.right);
      align = Math.abs(cx(to) - cx(from));
      break;
  }

  // Not-in-line candidates get a large penalty so rows/columns win.
  const inLine = minor === 0 ? 0 : 1;
  return inLine * 100000 + major * 1 + minor * 4 + align * 0.15;
}

/** Index of the best candidate in a direction, or -1. */
export function pickCandidate(from: Box, candidates: Box[], dir: Direction): number {
  let best = -1;
  let bestScore = Infinity;
  candidates.forEach((c, i) => {
    const s = scoreCandidate(from, c, dir);
    if (s !== null && s < bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return best;
}

/** Index of the candidate closest to a point (used for focus recovery). */
export function pickNearest(from: Box, candidates: Box[]): number {
  let best = -1;
  let bestD = Infinity;
  candidates.forEach((c, i) => {
    const d = Math.hypot(cx(c) - cx(from), cy(c) - cy(from));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
