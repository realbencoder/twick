import { Track, TRACK_TYPES } from "@twick/timeline";

/**
 * Collects snap target times for the timeline.
 * Includes: playhead, clip edges (excluding the dragging element), 0, and duration.
 *
 * CAPTION tracks are skipped: a 2-minute video carries ~50-100 caption elements whose edges are
 * word-onset times, giving a snap target every ~1-2.5s. At low zoom the capture radius exceeds the
 * spacing, so trims teleported word-boundary to word-boundary instead of moving continuously — and
 * a "snapped" cut landed exactly where speech BEGINS (audit 2026-08-03, T2). Clip-to-clip,
 * playhead, 0 and duration magnetism stay.
 */
export function getSnapTargets(
  tracks: Track[],
  currentTime: number,
  duration: number,
  excludeElementId?: string
): number[] {
  const targets = new Set<number>();

  targets.add(0);
  targets.add(duration);
  targets.add(currentTime);

  for (const track of tracks) {
    if (track.getType() === TRACK_TYPES.CAPTION) continue;
    for (const el of track.getElements()) {
      if (excludeElementId && el.getId() === excludeElementId) continue;
      targets.add(el.getStart());
      targets.add(el.getEnd());
    }
  }

  return [...targets];
}
