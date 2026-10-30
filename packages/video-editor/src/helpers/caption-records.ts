import { TRACK_TYPES, type Track, type TrackElement } from "@twick/timeline";

/**
 * What the creator did to subtitles BY HAND, recorded where the host's restore planner reads it
 * (PR #870 audit, C1 + I1). A restore rebuilds subtitles from the STORED transcript grouping, and
 * these records are how it knows which ones the creator changed or removed, so it never puts the
 * stored words back over theirs.
 *
 * - `props.textEdited === true` on a caption: the creator committed a text edit to it. It rides
 *   a split (the cloner copies props) and a cut (applyCutToCaption keeps props).
 * - `editedSourceIds: string[]` on the caption TRACK's props: the ids of the captions the creator
 *   edited. It outlives a cut that removes the caption whole, which the element's flag cannot.
 * - `removedSourceIds: string[]` on the caption TRACK's props: the ids of the captions the creator
 *   removed (the Subtitles panel's Remove, the timeline's Delete, the canvas's Delete). A CUT's
 *   removal is never recorded, and neither is Remove all: restoring cut footage is exactly what
 *   should bring its subtitle back.
 *
 * Every write is a NEW props object holding a NEW array, never an in-place push: Track.serialize
 * hands the undo history its props object by reference, and undo's Track.fromJSON adopts the
 * snapshot's object, so a mutation in place would rewrite history. Nothing here commits: callers
 * write inside the same batchHistory as the edit or removal, so one undo takes back both.
 */
export const CAPTION_TEXT_EDITED_PROP = "textEdited";
export const CAPTION_EDITED_IDS_PROP = "editedSourceIds";
export const CAPTION_REMOVED_IDS_PROP = "removedSourceIds";

const CAPTION_RECORD_KEYS = [CAPTION_EDITED_IDS_PROP, CAPTION_REMOVED_IDS_PROP] as const;
export type CaptionRecordKey = (typeof CAPTION_RECORD_KEYS)[number];

/** The string ids in a record, the same defensive read the host does (anything else is no id). */
function idsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Adds `id` to the track's `key` record, once. Returns whether the record changed. No commit. */
export function recordCaptionTrackId(track: Track, key: CaptionRecordKey, id: string): boolean {
  const props = (track.getProps() ?? {}) as Record<string, unknown>;
  const ids = idsOf(props[key]);
  if (ids.includes(id)) return false;
  track.setProps({ ...props, [key]: [...ids, id] });
  return true;
}

/** Stamps the creator's text edit on a caption: `props.textEdited = true`. No commit. */
export function markCaptionTextEdited(element: TrackElement): void {
  const props = (element.getProps() ?? {}) as Record<string, unknown>;
  if (props[CAPTION_TEXT_EDITED_PROP] === true) return;
  element.setProps({ ...props, [CAPTION_TEXT_EDITED_PROP]: true });
}

/**
 * Records that the creator removed `element`, when it is on a caption track (`track` is its own
 * track as it stands now). Any other element records nothing. No commit.
 */
export function recordCaptionRemoval(track: Track | null | undefined, element: TrackElement): boolean {
  if (!track || track.getType() !== TRACK_TYPES.CAPTION) return false;
  return recordCaptionTrackId(track, CAPTION_REMOVED_IDS_PROP, element.getId());
}

/**
 * `next` with the creator's records taken from `live`, never from `next`. A wholesale props write
 * built from props read EARLIER (the canvas's caption drag replays the props it was last drawn
 * with) would otherwise drop a record written since, or bring back one Regenerate cleared.
 */
export function carryCaptionRecords(
  next: Record<string, unknown>,
  live: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...next };
  for (const key of CAPTION_RECORD_KEYS) {
    if (live && Object.prototype.hasOwnProperty.call(live, key)) out[key] = live[key];
    else delete out[key];
  }
  return out;
}
