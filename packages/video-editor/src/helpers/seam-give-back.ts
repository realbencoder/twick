/**
 * EXTEND A CLIP AFTER A CUT — "give-back drag" (design: docs/EXTEND-AFTER-CUT-DESIGN.md).
 *
 * Founder: "once you've silenced something you can't drag that clip longer again… I know we don't
 * want them to drag it so long they get the same thing twice."
 *
 * The end-handle clamp is against the NEIGHBOUR'S TIMELINE START, never the clip's own source
 * window, and a ripple leaves the main track exactly contiguous — so `nextStart === own end` and the
 * handle has zero rightward travel. This module computes how much travel it should have, and the
 * exact multi-element patch that commits it.
 *
 * THE CAP IS FREE. Both numbers already serialize, so nothing new is stored:
 *
 *     rate(X)     = X.props.playbackRate || 1
 *     inPoint(X)  = X.props.time ?? 0                      // source seconds
 *     outPoint(X) = inPoint(X) + (X.end - X.start) * rate  // source seconds
 *     seamBudget  = inPoint(next) - outPoint(clip)         // exactly what the ripple removed
 *
 * A 60s recording with a 1.0s silence cut at source t=20 leaves A{s0,e20,time0} (outPoint 20) and
 * B{s20,e59,time21} (inPoint 21) — budget 1.0s. Cap A's growth there and B still begins at source
 * 21, so **A can never reveal a frame B also shows**. The founder's duplication trap is closed by
 * arithmetic, not by a rule. DO NOT add a "how much we removed" field: it is redundant with this
 * number and would have to survive split, reorder, undo and reload for zero benefit.
 *
 * Nothing here mutates. `planSeamGiveBack` projects the whole edit onto plain numbers, verifies the
 * projection, and only then hands back a patch — the clone-and-verify discipline `rippleDeleteRanges`
 * and `reorderMainTrackElement` get from deep-cloning their tracks, which the `updateElements` batch
 * (which mutates live state) does not provide on its own.
 */

/**
 * Structural shapes — duck-typed on purpose so this stays pure and testable without the engine.
 * `getProps` is deliberately `any`: the engine's declared props interfaces have no index signature,
 * so a `Record<string, unknown>` return here would make every real TrackElement un-assignable.
 */
export interface SeamElementLike {
  getId(): string;
  getStart(): number;
  getEnd(): number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProps?(): any;
  getMediaDuration?(): number;
}

export interface SeamTrackLike {
  getName?(): string;
  /** `readonly` matches Track.getElements()' real signature — the engine hands out a frozen view. */
  getElements(): readonly SeamElementLike[];
}

export interface SeamGiveBackPlan {
  /** Timeline time of the A|B seam BEFORE the give-back (i.e. the clip's current end). */
  seam: number;
  /** Timeline seconds actually reclaimed (already capped by the budget). */
  delta: number;
  /** The clip's new end — `seam + delta`. */
  clampedEnd: number;
  /** One `editor.updateElements` batch: every follower shifted, then the clip grown. */
  updates: Array<{ elementId: string; updates: { s: number; e: number } }>;
  /** How many elements slid right (excludes the growing clip). Diagnostics only. */
  followerCount: number;
}

/** The magnetic main track is resolved by NAME, never getType() — that also matches B-roll tracks. */
export const MAIN_TRACK_NAME = "Video";

/** Source-seconds tolerance. Below this a "budget" is float noise, not reclaimable footage. */
const SRC_EPS = 1e-4;

/**
 * Timeline-seconds tolerance for "starts at or after the seam" and for overlap checks.
 * Matches `Track.isElementColliding`'s EPSILON so this module and the engine agree on touching.
 */
const SEAM_EPS = 1e-3;

/**
 * How many seconds of SOURCE this element has, or 0 when unknown.
 *
 * Two places carry it and neither covers every clip. `props.fileDuration` is written by the app for
 * the main recording and SURVIVES a project reload (props serialize). `mediaDuration` is set by
 * updateVideoMeta() when any video/audio element is added and covers stock B-roll and music; it is a
 * class field, so it is present for the rest of the session and gone after a reload. Reading both
 * means a clip is clamped whenever we know its length, and falls back to unclamped when we genuinely
 * don't (never a wrong clamp).
 */
export const resolveSourceDuration = (element: SeamElementLike): number => {
  const fromProps = Number(element.getProps?.()?.fileDuration);
  if (Number.isFinite(fromProps) && fromProps > 0) return fromProps;
  const fromMeta = Number(element.getMediaDuration?.());
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
  return 0;
};

/**
 * Compare sources by ORIGIN + PATH, discarding the query string.
 *
 * Every main-track clip reads the same master file, but a project reload re-presigns it — and a
 * presigned S3 URL differs only in its `X-Amz-*` query. A raw string compare would therefore report
 * "different source" for two halves of the same recording and silently kill the feature after every
 * reload, with no error anywhere.
 */
export const normalizeSrc = (src: unknown): string => {
  if (typeof src !== "string" || src.length === 0) return "";
  try {
    const u = new URL(src);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return src;
  }
};

const srcOf = (el: SeamElementLike): string => normalizeSrc(el.getProps?.()?.src);

const rateOf = (el: SeamElementLike): number => {
  const r = Number(el.getProps?.()?.playbackRate);
  return Number.isFinite(r) && r > 0 ? r : 1;
};

/** Source in-point. `getStartAt()` IS `props.time || 0` on video/audio (video.element.ts:56). */
export const inPointOf = (el: SeamElementLike): number => {
  const p = el.getProps?.();
  const t = Number(p?.time ?? p?.startAt ?? 0);
  return Number.isFinite(t) ? t : 0;
};

/** Source out-point: where this clip stops reading the file. */
export const outPointOf = (el: SeamElementLike): number =>
  inPointOf(el) + Math.max(0, el.getEnd() - el.getStart()) * rateOf(el);

/**
 * SOURCE seconds this clip may reclaim at its right-hand seam. 0 means "the handle stays put".
 *
 * The seam budget is the whole story on an untouched cut track. The loop is the guard the design
 * calls out for REORDER: after a reorder the seam is an arbitrary source discontinuity, so a clip
 * could otherwise grow into source that some OTHER clip on the track already shows. Growing `clip`
 * by `g` reveals source `[out, out + g]`, which must miss every other same-source clip's window —
 * so for any C ending later in the source, `g <= inPoint(C) - out`. `next` satisfies that condition
 * on a normal track, so it needs no special case; a reorder that put an EARLIER source segment after
 * `clip` yields a negative term and the budget floors at 0, exactly as intended.
 */
export function seamSourceBudget(
  clip: SeamElementLike,
  next: SeamElementLike | undefined,
  siblings: readonly SeamElementLike[]
): number {
  // The LAST clip already extends correctly today (nextStart === null, capped by source duration in
  // use-timeline-manager). Returning 0 here keeps it on that proven path — never swallow it.
  if (!next) return 0;

  const src = srcOf(clip);
  // No shared source means nothing was ever removed BETWEEN these two clips (a stitch reaction's
  // inserted clip against the camera, a dropped-in B-roll). Comparing their source coordinates would
  // be meaningless arithmetic on two different files.
  if (!src || src !== srcOf(next)) return 0;

  const out = outPointOf(clip);
  let budget = Infinity;

  for (const c of siblings) {
    if (c.getId() === clip.getId()) continue;
    if (srcOf(c) !== src) continue;
    if (outPointOf(c) <= out + SRC_EPS) continue; // shows only source we already passed
    const room = inPointOf(c) - out;
    if (room < budget) budget = room;
  }

  if (!Number.isFinite(budget)) return 0;
  if (budget <= SRC_EPS) return 0; // pure split seam: nothing was removed, so nothing to give back

  // Never read past the end of the file.
  const srcDur = resolveSourceDuration(clip);
  if (srcDur > 0) budget = Math.min(budget, srcDur - out);

  return budget > SRC_EPS ? budget : 0;
}

const sortedByStart = (els: readonly SeamElementLike[]): SeamElementLike[] =>
  [...els].sort((a, b) => a.getStart() - b.getStart());

/**
 * TIMELINE seconds the given main-track clip may reclaim to its right. 0 when it can't (last clip,
 * different-source neighbour, pure split seam, reordered into a full source window).
 *
 * This is the number the view clamps to AND the number the tooltip shows — one computation, so the
 * affordance can never advertise headroom the commit refuses.
 */
export function reclaimableSeconds(track: SeamTrackLike, elementId: string): number {
  const els = sortedByStart(track.getElements() ?? []);
  const i = els.findIndex((e) => e.getId() === elementId);
  if (i === -1 || i === els.length - 1) return 0;
  const clip = els[i];
  const budget = seamSourceBudget(clip, els[i + 1], els);
  if (budget <= SRC_EPS) return 0;
  return budget / rateOf(clip);
}

/** Timeline time the END handle may not pass — the neighbour's start, widened by the budget. */
export function endHandleLimit(
  nextStart: number | null,
  reclaimSeconds: number
): number | null {
  if (nextStart === null || !Number.isFinite(nextStart)) return null;
  return nextStart + Math.max(0, reclaimSeconds || 0);
}

/**
 * THE SNAP WOULD EAT THE FEATURE (must-fix #1 of the design).
 *
 * `getSnapTargets` collects every non-caption clip edge, which on a contiguous main track means the
 * NEIGHBOUR'S START — i.e. exactly this seam. Left in, the end handle snaps straight back to where
 * it already sits; and when the whole budget is smaller than the capture radius (a 0.3s reclaim at
 * low zoom, where 10px is seconds), it can NEVER show any travel at all. That alone would ship a
 * "fixed" dead handle whose founder gesture still does nothing.
 *
 * Dropped ASYMMETRICALLY — only while growing PAST the seam — so SHORTENING keeps its magnetic pull
 * back to the neighbour, which is the behaviour the magnetic main track already has.
 */
export function endHandleSnapTargets(
  targets: readonly number[],
  rawEnd: number,
  nextStart: number | null,
  reclaimSeconds: number
): number[] {
  const list = targets ?? [];
  if (!(reclaimSeconds > SEAM_EPS) || nextStart === null || rawEnd <= nextStart) {
    return [...list];
  }
  return list.filter((t) => Math.abs(t - nextStart) > SEAM_EPS);
}

/** What the reclaim affordance draws. See `reclaimAffordance`. */
export interface ReclaimAffordance {
  /** True when this clip has removed footage to take back — drives the handle's own colour. */
  canReclaim: boolean;
  /** Timeline seconds still available, measured against the LIVE drag position. */
  remaining: number;
  /** Band width as a % of the clip's own width (the band's containing block). 0 hides it. */
  bandPct: number;
  /** Tooltip carrying the real number, or undefined when there is nothing to say. */
  label?: string;
}

const formatReclaim = (s: number): string =>
  s < 1 ? `${Math.round(s * 1000)}ms` : `${s.toFixed(1)}s`;

/**
 * THE AFFORDANCE IS NOT OPTIONAL (must-fix #2 of the design). A handle that silently moves at some
 * seams and not others — manual split, different-source neighbour, reordered track, ~0 headroom —
 * with zero visual difference is the same bug in a new costume.
 *
 * Derived from the SAME `reclaimSeconds` the clamp uses, so the tooltip can never advertise
 * headroom the commit refuses. The band measures what is STILL available against the live drag
 * position, so it drains to nothing exactly as the budget is consumed.
 */
export function reclaimAffordance(args: {
  reclaimSeconds: number;
  nextStart: number | null;
  start: number;
  end: number;
}): ReclaimAffordance {
  const { reclaimSeconds, nextStart, start, end } = args;
  const limit = endHandleLimit(nextStart, reclaimSeconds);
  const canReclaim = reclaimSeconds > SEAM_EPS && limit !== null;
  if (!canReclaim) return { canReclaim: false, remaining: 0, bandPct: 0 };
  const remaining = Math.max(0, (limit as number) - end);
  const width = end - start;
  return {
    canReclaim: true,
    remaining,
    bandPct: width > 0 ? (remaining / width) * 100 : 0,
    label: `Drag right to take back up to ${formatReclaim(
      reclaimSeconds
    )} of removed footage (everything after slides right)`,
  };
}

/**
 * Project the whole give-back and verify it before handing back a patch.
 *
 * `tracks` is the LIVE track list (read-only here). `requestedEnd` is the clip's desired new end,
 * already clamped by the caller's own source bound. Returns null whenever the give-back does not
 * apply — the caller then takes today's ordinary trim path, so a refusal degrades to current
 * behaviour rather than to a broken edit.
 *
 * FOLLOWERS: every element on EVERY track whose start sits at or after the seam slides right by the
 * reclaimed amount (founder decision 2026-08-11) — the exact inverse of the ripple cut that created
 * the budget, so B-roll and text stay over the words they were placed on and caption word timings
 * travel with them (`updateElements` runs `adjustCaptionWordsForTimeChange` on every patched
 * element, a pure translation when the duration is unchanged).
 *
 * Elements that STRADDLE the seam are deliberately untouched: they are anchored before it, and
 * lengthening a straddling video overlay to match would push it past its own source and bake the
 * frozen tail R2-23 fixed. Their window stays; only what starts after the seam moves.
 */
export function planSeamGiveBack(
  tracks: readonly SeamTrackLike[],
  elementId: string,
  requestedEnd: number,
  mainTrackName: string = MAIN_TRACK_NAME
): SeamGiveBackPlan | null {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  if (!Number.isFinite(requestedEnd)) return null;

  const main = tracks.find((t) => t.getName?.() === mainTrackName);
  if (!main) return null;

  const mainEls = sortedByStart(main.getElements() ?? []);
  const i = mainEls.findIndex((e) => e.getId() === elementId);
  if (i === -1) return null; // not a main-track clip — ordinary trim
  if (i === mainEls.length - 1) return null; // LAST clip: today's source-capped path already works

  const clip = mainEls[i];
  const seam = clip.getEnd();
  const reclaim = reclaimableSeconds(main, elementId);
  if (reclaim <= SEAM_EPS) return null;

  const delta = Math.min(requestedEnd, seam + reclaim) - seam;
  if (delta <= SEAM_EPS) return null; // shortening, or a sub-millisecond nudge

  const clampedEnd = seam + delta;

  // Followers first (farthest-first), the clip last. `Track.updateElement` deliberately does NOT
  // collision-guard, so ordering cannot reject a patch — but committing the growth only after the
  // room exists keeps every intermediate state legal for anything that reads mid-batch.
  const followers: Array<{ el: SeamElementLike; s: number; e: number }> = [];
  for (const track of tracks) {
    for (const el of track.getElements() ?? []) {
      if (el.getId() === elementId) continue;
      if (el.getStart() >= seam - SEAM_EPS) {
        followers.push({ el, s: el.getStart() + delta, e: el.getEnd() + delta });
      }
    }
  }
  followers.sort((a, b) => b.s - a.s);

  // ── Clone-and-verify: project every touched position onto plain numbers and check the result is a
  // legal timeline BEFORE anything mutates. A failed projection returns null (ordinary trim), never
  // a half-applied edit.
  const projected = new Map<string, { s: number; e: number }>();
  for (const f of followers) projected.set(f.el.getId(), { s: f.s, e: f.e });
  projected.set(elementId, { s: clip.getStart(), e: clampedEnd });

  const posOf = (el: SeamElementLike) =>
    projected.get(el.getId()) ?? { s: el.getStart(), e: el.getEnd() };

  // 1. Nothing may end up with a non-positive duration.
  for (const track of tracks) {
    for (const el of track.getElements() ?? []) {
      const p = posOf(el);
      if (!(p.e > p.s)) return null;
    }
  }

  // 2. The main track keeps its ORDER and gains no overlap. (A pre-existing gap stays a gap — the
  //    caller's magnetic close handles those exactly as it does today.)
  for (let k = 0; k < mainEls.length - 1; k++) {
    const a = posOf(mainEls[k]);
    const b = posOf(mainEls[k + 1]);
    if (b.s < a.e - SEAM_EPS) return null;
  }

  // 3. The clip may not read past the end of its own file.
  const srcDur = resolveSourceDuration(clip);
  if (srcDur > 0) {
    const projectedOut = inPointOf(clip) + (clampedEnd - clip.getStart()) * rateOf(clip);
    if (projectedOut > srcDur + SRC_EPS) return null;
  }

  return {
    seam,
    delta,
    clampedEnd,
    updates: [
      ...followers.map((f) => ({ elementId: f.el.getId(), updates: { s: f.s, e: f.e } })),
      { elementId, updates: { s: clip.getStart(), e: clampedEnd } },
    ],
    followerCount: followers.length,
  };
}
