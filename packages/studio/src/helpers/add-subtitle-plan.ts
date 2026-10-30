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
 *   run nearly back to back, so this is the common case. Without word times that line up with the
 *   words (a subtitle added here, or an old one), the breaks are the splitter's own positional
 *   ones, `s + dur * i / n`: never the raw playhead, which a second press, or a press after a card
 *   click (it seeks to the subtitle's start), leaves on the subtitle's first frame, where the split
 *   would ship a one-frame sliver.
 * - On an UNTOUCHED "New subtitle" placeholder (founder call, 2026-10-30): a repeat press leaves
 *   the playhead on the placeholder it just added, so instead of splitting it the next subtitle
 *   goes right after it, by the same gap rules, or the press refuses no-room. A third press at
 *   the same playhead is still on the FIRST placeholder, whose end now meets the second, so it
 *   refuses: no chaining. Untouched = trimmed text exactly NEW_SUBTITLE_TEXT and no word times
 *   that line up with its words; an edited placeholder, or one with word times, splits as above.
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

/** The placeholder text a new subtitle gets. The hook adds it; the planner recognises it. */
export const NEW_SUBTITLE_TEXT = "New subtitle";

/** How long a subtitle added in a gap is, at most. */
export const ADD_SUBTITLE_SECONDS = 1;
/** Less room than this at the playhead and nothing is added. */
export const MIN_ADD_SUBTITLE_SECONDS = 0.2;

/**
 * Slack on the 0.2 s room test, so exactly 0.2 s before the video's end (10 - 9.8 =
 * 0.19999999999999929) and exactly 0.2 s before a subtitle (5 - 4.8 = 0.20000000000000018) both
 * count as room.
 */
const ROOM_EPSILON_SECONDS = 1e-6;

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

/**
 * The split time that makes ElementSplitter's positional fallback cut before token `i` of `n`.
 *
 * Without aligned word times the splitter cuts at `floor(n * (splitTime - s) / (e - s))`. The
 * exact proportional time `s + dur * i / n` often lands on `i - 1` in floating point (1 to 2 with
 * five words: 1.4 gives index 1), so step it up until the splitter's own arithmetic says `i`.
 * Null when it cannot (a caption too short for the step to settle).
 */
function positionalSplitSeconds(c: AddSubtitleCaption, i: number, n: number): number | null {
  const dur = c.e - c.s;
  const indexAt = (t: number) => Math.floor(n * ((t - c.s) / dur));
  let at = c.s + (dur * i) / n;
  let step = Number.EPSILON * Math.max(1, Math.abs(at));
  for (let k = 0; k < 64 && indexAt(at) < i; k++) {
    at += step;
    step *= 2;
  }
  return indexAt(at) === i ? at : null;
}

/** canSplitElement's test, made strict and in its own arithmetic: both pieces over one frame. */
function clearsFrameMargin(c: AddSubtitleCaption, at: number): boolean {
  return at - c.s > MIN_SPLIT_PIECE_SECONDS && c.e - at > MIN_SPLIT_PIECE_SECONDS;
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
  if (on) {
    // A repeat press: the next subtitle goes right after an untouched placeholder (no split).
    if (isUntouchedPlaceholder(on)) return planGapAt(captions, on.e, videoEnd);
    return planSplit(on, playhead);
  }
  return planGapAt(captions, playhead, videoEnd);
}

/** The caption the hook just added, as it added it: text exactly NEW_SUBTITLE_TEXT (trimmed), and
 *  no word times that line up with its words (the hook adds it with none). */
function isUntouchedPlaceholder(c: AddSubtitleCaption): boolean {
  if ((c.text ?? "").trim() !== NEW_SUBTITLE_TEXT) return false;
  const tokens = (c.text ?? "").split(" ");
  const aligned =
    Array.isArray(c.wordsMs) && c.wordsMs.length > 0 && c.wordsMs.length === tokens.length;
  return !aligned;
}

/** A new subtitle starting at `start`: up to 1 s, stopping at the next subtitle and the video's
 *  end; no-room when a subtitle already covers `start` or under 0.2 s is left. */
function planGapAt(
  captions: AddSubtitleCaption[],
  start: number,
  videoEnd: number
): AddSubtitlePlan {
  if (start >= videoEnd) return { kind: "refuse", reason: "no-room" };
  let nextStart = Infinity;
  for (const c of captions) {
    // Covered (a subtitle starting exactly here, or one overlapping it): no room. The playhead
    // path never gets here when on a caption, but the after-a-placeholder path can.
    if (c.s <= start && start < c.e) return { kind: "refuse", reason: "no-room" };
    if (c.s > start && c.s < nextStart) nextStart = c.s;
  }
  const end = Math.min(start + ADD_SUBTITLE_SECONDS, nextStart, videoEnd);
  if (end - start < MIN_ADD_SUBTITLE_SECONDS - ROOM_EPSILON_SECONDS) {
    return { kind: "refuse", reason: "no-room" };
  }
  return { kind: "add", start, end };
}

function planSplit(c: AddSubtitleCaption, playhead: number): AddSubtitlePlan {
  // The splitter's own tokenising (split on single spaces), so "aligned" and "index i" mean what
  // they mean there.
  const tokens = (c.text ?? "").split(" ");
  const isWord = (w: string | undefined) => w !== undefined && w.trim().length > 0;
  const wordCount = tokens.filter(isWord).length;
  if (wordCount < 2) return { kind: "refuse", reason: "one-word" };

  const words =
    Array.isArray(c.wordsMs) && c.wordsMs.length === tokens.length ? c.wordsMs : null;
  // The splitter's unit test: seconds when every value sits under twice the caption's end.
  const max = words ? Math.max(...words) : 0;
  const isSeconds = max > 0 && max < c.e * 2;

  let best: number | null = null;
  // Break i cuts before token i. Index 0 would leave the first half empty.
  for (let i = 1; i < tokens.length; i++) {
    let at: number | null;
    if (words) {
      // The word's own start: the splitter keeps a word left only when it starts strictly
      // before the split time, so this word opens the right half.
      at = isSeconds ? words[i] : msWordStartToSplitSeconds(words[i]);
    } else {
      // No word times that line up: the splitter divides by position, so only its positional
      // breaks, and only those with a real word on both sides (no empty or blank half).
      if (!isWord(tokens[i - 1]) || !isWord(tokens[i])) continue;
      at = positionalSplitSeconds(c, i, tokens.length);
    }
    if (at === null || !clearsFrameMargin(c, at)) continue;
    if (best === null || Math.abs(at - playhead) < Math.abs(best - playhead)) best = at;
  }
  if (best === null) return { kind: "refuse", reason: "cannot-split" };
  return { kind: "split", elementId: c.id, at: best };
}
