import { MIN_SPLIT_PIECE_SECONDS } from "@twick/timeline";

/**
 * Where the Subtitles panel's "Add subtitle" puts a subtitle (founder call, 2026-10-29).
 *
 * It used to add one for 1 s after the LAST subtitle, which on a subtitled video is the very end.
 * Now it acts at the playhead:
 *
 * - In a gap: a new subtitle starts at the playhead and ends at the earliest of 1 s later, the
 *   next subtitle's start and the video's end, so it never overlaps one and never runs past the
 *   end (the caption adder clamps neither). Under 0.2 s of room, nothing is added.
 * - On a subtitle (`s <= playhead < e`, so on a boundary it is the one STARTING there): that
 *   subtitle splits in two at the word break nearest the playhead. After Remove Silences subtitles
 *   run nearly back to back, so this is the common case.
 *
 * Pure, so the app's unit suite can execute it against the shipped dist (the fork has no runner).
 */
export type AddSubtitlePlan =
  | { kind: "add"; start: number; end: number }
  | { kind: "split"; elementId: string; at: number }
  | { kind: "refuse"; reason: "no-room" | "one-word" | "cannot-split" };

export type AddSubtitleCaption = {
  id: string;
  s: number;
  e: number;
  text: string;
  /** Word starts, absolute timeline time: ms, or seconds on legacy projects. */
  wordsMs?: number[] | null;
};

/** How long a subtitle added in a gap is, at most. */
export const ADD_SUBTITLE_SECONDS = 1;
/** Less room than this at the playhead and nothing is added. */
export const MIN_ADD_SUBTITLE_SECONDS = 0.2;

/**
 * Keeps a split time clamped to a caption's one-frame margin inside it after float rounding:
 * `(s + 1/30) - s` can come out a hair under 1/30, and canSplitElement would then refuse it.
 */
const EDGE_INSET_SECONDS = 1e-6;

/**
 * A word start in ms as a split time in seconds that the splitter puts on the RIGHT.
 *
 * ElementSplitter.visitCaptionElement keeps a word in the first half when `w < splitTime * 1000`.
 * For about 1 in 150 whole-ms values `w / 1000 * 1000` comes back one ulp ABOVE `w` (2007, 2011,
 * ...), which would put the chosen word in the FIRST half. Step down until it does not.
 */
function msWordStartToSplitSeconds(w: number): number {
  let at = w / 1000;
  let step = Number.EPSILON * Math.max(1, Math.abs(at));
  while (at * 1000 > w) {
    at -= step;
    step *= 2;
  }
  return at;
}

export function planAddSubtitle(
  captions: AddSubtitleCaption[],
  playhead: number,
  videoEnd: number
): AddSubtitlePlan {
  if (!Number.isFinite(playhead)) return { kind: "refuse", reason: "no-room" };

  // On a caption. Should two ever overlap, act on the latest-starting one, the same rule that
  // picks the subtitle starting at a shared boundary.
  let on: AddSubtitleCaption | null = null;
  for (const c of captions) {
    if (c.s <= playhead && playhead < c.e && (!on || c.s > on.s)) on = c;
  }
  if (on) return planSplit(on, playhead);

  if (playhead >= videoEnd) return { kind: "refuse", reason: "no-room" };
  let nextStart = Infinity;
  for (const c of captions) {
    if (c.s > playhead && c.s < nextStart) nextStart = c.s;
  }
  const end = Math.min(playhead + ADD_SUBTITLE_SECONDS, nextStart, videoEnd);
  if (end - playhead < MIN_ADD_SUBTITLE_SECONDS) {
    return { kind: "refuse", reason: "no-room" };
  }
  return { kind: "add", start: playhead, end };
}

function planSplit(c: AddSubtitleCaption, playhead: number): AddSubtitlePlan {
  // The splitter's own tokenising (split on single spaces), so "aligned" means what it means there.
  const tokens = (c.text ?? "").split(" ");
  const wordCount = tokens.filter((w) => w.trim().length > 0).length;
  if (wordCount < 2) return { kind: "refuse", reason: "one-word" };

  const words =
    Array.isArray(c.wordsMs) && c.wordsMs.length === tokens.length ? c.wordsMs : null;

  if (words) {
    // The splitter's unit test: seconds when every value sits under twice the caption's end.
    const max = Math.max(...words);
    const isSeconds = max > 0 && max < c.e * 2;
    let best: number | null = null;
    // Index 0 is the first word's own start: splitting there leaves the first half empty.
    for (let i = 1; i < words.length; i++) {
      const at = isSeconds ? words[i] : msWordStartToSplitSeconds(words[i]);
      // Strictly inside the one-frame margin, in canSplitElement's own arithmetic.
      if (!(at - c.s > MIN_SPLIT_PIECE_SECONDS && c.e - at > MIN_SPLIT_PIECE_SECONDS)) continue;
      if (best === null || Math.abs(at - playhead) < Math.abs(best - playhead)) best = at;
    }
    if (best === null) return { kind: "refuse", reason: "cannot-split" };
    return { kind: "split", elementId: c.id, at: best };
  }

  // No word times that line up with the words: split at the playhead, kept a frame inside, and
  // let the splitter divide the text by position.
  const lo = c.s + MIN_SPLIT_PIECE_SECONDS + EDGE_INSET_SECONDS;
  const hi = c.e - MIN_SPLIT_PIECE_SECONDS - EDGE_INSET_SECONDS;
  if (lo > hi) return { kind: "refuse", reason: "cannot-split" };
  return { kind: "split", elementId: c.id, at: Math.min(hi, Math.max(lo, playhead)) };
}
