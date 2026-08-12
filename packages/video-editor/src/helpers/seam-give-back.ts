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
  /**
   * Lowercased element type. Optional so the pure tests can stay duck-typed, but the SEAM
   * classification below needs it: the ripple treats `video`/`audio` (source-backed) differently
   * from text/image (no source) and differently again from captions (word arrays), so the inverse
   * has to make the same three-way distinction. Absent ⇒ treated as sourceless.
   */
  getType?(): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMetadata?(): any;
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
  /** One `editor.updateElements` batch: every follower shifted/healed, then the clip grown. */
  updates: Array<{ elementId: string; updates: { s: number; e: number } }>;
  /**
   * SECOND `editor.updateElements` batch, props only, applied inside the SAME `batchHistory`.
   *
   * Straddling captions need a PIECEWISE word shift (words before the seam stay, words at/after it
   * move by `delta`), which `adjustCaptionWordsForTimeChange` cannot express — it shifts or SCALES
   * every word into the new window, so patching geometry alone would smear the whole caption.
   * A props-only patch is the seam that lets us write the right numbers: `updateElements` applies
   * `patch.props` and only then calls the adjuster, which on an unchanged duration degrades to a
   * translate by zero. So these must be committed AFTER `updates`, never merged into it.
   */
  propUpdates: Array<{ elementId: string; props: Record<string, unknown> }>;
  /** How many elements slid right (excludes the growing clip). Diagnostics only. */
  followerCount: number;
  /** How many seam-straddling elements were lengthened to stay over their content. Diagnostics. */
  healedCount: number;
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
 * PURE SOURCE ARITHMETIC — it knows nothing about where these clips sit on the TIMELINE. The
 * contiguity requirement (a give-back only applies to a seam a ripple left touching) lives one level
 * up in `reclaimMapForTrack`, which is the only caller the view and the commit both go through.
 * `tests/unit/seam-give-back.test.ts` pins that the two agree on a contiguous track so the split
 * cannot drift.
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
  return budgetFromCoords(
    coordsOf(clip),
    next ? coordsOf(next) : undefined,
    siblings.map(coordsOf)
  );
}

/**
 * Source coordinates resolved ONCE. `src` is the expensive one (a `new URL()` parse), which is why
 * the per-track map precomputes these instead of re-deriving them per (clip, sibling) pair.
 */
interface SeamCoords {
  id: string;
  start: number;
  end: number;
  src: string;
  inPoint: number;
  outPoint: number;
  rate: number;
  srcDur: number;
}

const coordsOf = (el: SeamElementLike): SeamCoords => ({
  id: el.getId(),
  start: el.getStart(),
  end: el.getEnd(),
  src: srcOf(el),
  inPoint: inPointOf(el),
  outPoint: outPointOf(el),
  rate: rateOf(el),
  srcDur: resolveSourceDuration(el),
});

/**
 * THE budget arithmetic — one implementation, two entry points (`seamSourceBudget` for a single
 * pair, `reclaimMapForTrack` for a whole track in one pass). Keeping two copies would have been a
 * drift risk AND a mutation-testing hole: a mutation applied to one copy would survive because the
 * live path ran the other.
 */
function budgetFromCoords(
  clip: SeamCoords,
  next: SeamCoords | undefined,
  siblings: readonly SeamCoords[]
): number {
  // The LAST clip already extends correctly today (nextStart === null, capped by source duration in
  // use-timeline-manager). Returning 0 here keeps it on that proven path — never swallow it.
  if (!next) return 0;

  // No shared source means nothing was ever removed BETWEEN these two clips (a stitch reaction's
  // inserted clip against the camera, a dropped-in B-roll). Comparing their source coordinates would
  // be meaningless arithmetic on two different files.
  if (!clip.src || clip.src !== next.src) return 0;

  const out = clip.outPoint;
  let budget = Infinity;

  for (const c of siblings) {
    if (c.id === clip.id) continue;
    if (c.src !== clip.src) continue;
    if (c.outPoint <= out + SRC_EPS) continue; // shows only source we already passed
    const room = c.inPoint - out;
    if (room < budget) budget = room;
  }

  if (!Number.isFinite(budget)) return 0;
  if (budget <= SRC_EPS) return 0; // pure split seam: nothing was removed, so nothing to give back

  // Never read past the end of the file.
  if (clip.srcDur > 0) budget = Math.min(budget, clip.srcDur - out);

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
  return reclaimMapForTrack(track).get(elementId) ?? 0;
}

/**
 * Every clip's reclaimable TIMELINE seconds on this track, in ONE pass.
 *
 * `reclaimableSeconds` used to be called once per clip from inside `TrackBase`'s element map, and
 * each call re-sorted the track and re-parsed one URL per sibling — O(n²) `new URL()` on exactly the
 * track Remove Silences turns into 10-150 clips, re-run on every render (TrackBase's memo does not
 * hold: `onElementDrag` is re-created per render and TimelineManager re-renders on every
 * `currentTime` tick). Measured on the shipped dist: 7.2-10.2ms per pass at 150 clips, 27-42ms at
 * 300 — landing on the same drag-scrub hot path #93 exists to keep decode-free, and the same shape
 * as #119's filmstrip cascade. Source coordinates are resolved ONCE per element here, so the
 * remaining sibling scan is plain arithmetic.
 */
export function reclaimMapForTrack(track: SeamTrackLike): Map<string, number> {
  const out = new Map<string, number>();
  const els = sortedByStart(track?.getElements?.() ?? []);
  if (els.length < 2) return out;

  // One URL parse + one props read per element, not per (element, sibling) pair.
  const coords = els.map(coordsOf);

  for (let i = 0; i < coords.length - 1; i++) {
    const clip = coords[i];
    const next = coords[i + 1];

    // CONTIGUITY GATE. The give-back is defined as the inverse of a ripple, and a ripple leaves the
    // main track exactly contiguous. On a GAPPED seam the clamp (based on the neighbour's start) and
    // the commit (based on this clip's own end) measure from different places, so the band advertised
    // headroom the commit refused — 6.0s of dashed "reclaimable footage" over a 1.0s budget — and a
    // plain trim into the gap got hijacked into a ripple that dragged unrelated overlays with it.
    // Refusing on a gap collapses all of that: the handle keeps today's clamp, no band is drawn, and
    // the magnetic close makes the track contiguous again anyway.
    if (next.start - clip.end > SEAM_EPS) continue;

    const budget = budgetFromCoords(clip, next, coords);
    if (budget <= SRC_EPS) continue;

    out.set(clip.id, budget / clip.rate);
  }

  return out;
}

/**
 * Timeline start of the main-track clip immediately right of `elementId`, or null when there is
 * none. This is TODAY'S end-handle clamp, and the commit path needs it by name: when
 * `planSeamGiveBack` declines, `clampedEnd` still carries the view's WIDENED value and nothing else
 * on that path clamps against the neighbour (the source clamp is against the file; the
 * totalDuration clamp is gated on `!isMainVideo`), so the fallback would write an end past the
 * neighbour onto a track whose `updateElement` deliberately does not collision-guard.
 */
export function mainSeamNeighbourStart(
  tracks: readonly SeamTrackLike[],
  elementId: string,
  mainTrackName: string = MAIN_TRACK_NAME
): number | null {
  if (!Array.isArray(tracks)) return null;
  const main = tracks.find((t) => t.getName?.() === mainTrackName);
  if (!main) return null;
  const els = sortedByStart(main.getElements() ?? []);
  const i = els.findIndex((e) => e.getId() === elementId);
  if (i === -1 || i === els.length - 1) return null;
  return els[i + 1].getStart();
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

const typeOf = (el: SeamElementLike): string => {
  const t = el.getType?.();
  return typeof t === "string" ? t.toLowerCase() : "";
};

/** Mirrors `applyRippleToTracks`'s own `isTimedMedia` test, so cut and give-back classify alike. */
const isTimedMedia = (el: SeamElementLike): boolean => {
  const t = typeOf(el);
  return t === "video" || t === "audio";
};

const isCaption = (el: SeamElementLike): boolean => typeOf(el) === "caption";

/** The app writes `props.wordsMs`; `props.w` is the legacy alias it maps on load. */
const CAPTION_WORD_KEYS = ["wordsMs", "w"] as const;

/** Identity sentinel: this caption carries word timings we cannot correct — refuse the plan. */
const UNFIXABLE_CAPTION = Object.freeze({}) as Record<string, unknown>;

/**
 * Was this left-of-seam element produced by the ripple SPLITTING one clip in two?
 *
 * The signature is exact: timed media, a neighbour starting where this one ends, the same source,
 * and real source distance between them (the removed window). A user-drawn overlay that merely ends
 * at the cut point matches none of it, so it is left alone.
 */
function hasSplitSignature(
  el: SeamElementLike,
  next: SeamElementLike | undefined,
  siblings: readonly SeamElementLike[]
): boolean {
  if (!next || !isTimedMedia(el)) return false;
  if (Math.abs(next.getStart() - el.getEnd()) > SEAM_EPS) return false;
  const src = srcOf(el);
  if (!src || src !== srcOf(next)) return false;
  return seamSourceBudget(el, next, siblings) > SRC_EPS;
}

/**
 * TIMELINE seconds this straddler may grow at its right edge before it would duplicate a same-source
 * sibling or read past its own file. `Infinity` for anything with no source window (text, image,
 * caption) — there is nothing to overrun. The caller still caps by `delta`, which is what bounds
 * this to at most the window the element held before the cut.
 */
function healRoomSeconds(
  el: SeamElementLike,
  trackEls: readonly SeamElementLike[]
): number {
  if (!isTimedMedia(el)) return Infinity;
  const src = srcOf(el);
  const out = outPointOf(el);
  let room = Infinity;
  if (src) {
    for (const c of trackEls) {
      if (c.getId() === el.getId()) continue;
      if (srcOf(c) !== src) continue;
      if (outPointOf(c) <= out + SRC_EPS) continue;
      room = Math.min(room, inPointOf(c) - out);
    }
  }
  const srcDur = resolveSourceDuration(el);
  if (srcDur > 0) room = Math.min(room, srcDur - out);
  if (!Number.isFinite(room)) return Infinity;
  return Math.max(0, room) / rateOf(el);
}

/**
 * The piecewise inverse of `applyCutToCaption`'s word transform: words BEFORE the seam stay exactly
 * where they are, words at or after it move right by the reclaimed amount.
 *
 * Returns the FULL props object (`setProps` replaces wholesale), `null` when there are no word
 * timings to fix, or `UNFIXABLE_CAPTION` when timings exist somewhere we cannot patch.
 *
 * Words the cut DELETED are gone from both the array and the text and do not come back — so the
 * reclaimed span may play with no subtitle over it. That is the honest outcome (founder call
 * 2026-08-12): every word still shown lands on the frame where it is actually spoken.
 */
function shiftCaptionWordsAcrossSeam(
  el: SeamElementLike,
  seam: number,
  grow: number
): Record<string, unknown> | null {
  const props = (el.getProps?.() ?? {}) as Record<string, unknown>;
  const key = CAPTION_WORD_KEYS.find(
    (k) => Array.isArray(props[k]) && (props[k] as unknown[]).length > 0
  );

  if (!key) {
    const meta = (el.getMetadata?.() ?? {}) as Record<string, unknown>;
    for (const k of CAPTION_WORD_KEYS) {
      if (Array.isArray(meta[k]) && (meta[k] as unknown[]).length > 0) return UNFIXABLE_CAPTION;
    }
    return null; // no per-word timings — extending the window is the whole fix
  }

  const raw = props[key] as unknown[];
  if (!raw.every((n) => typeof n === "number" && Number.isFinite(n))) return UNFIXABLE_CAPTION;
  const vals = raw as number[];

  // Same seconds-vs-ms detection the engine uses in applyCutToCaption and
  // adjustCaptionWordsForTimeChange, so a legacy seconds array is never double-converted.
  const maxVal = Math.max(...vals);
  const isSeconds = maxVal > 0 && maxVal < el.getEnd() * 2;
  const toUnit = (sec: number) => (isSeconds ? sec : sec * 1000);
  const seamU = toUnit(seam);
  const growU = toUnit(grow);

  return { ...props, [key]: vals.map((v) => (v >= seamU ? v + growU : v)) };
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
 * STRADDLERS ARE HEALED, NOT SKIPPED (2026-08-12). Leaving them alone was wrong, because the ripple
 * does not merely MOVE things at a cut — it DAMAGES whatever spans one, in three different ways, and
 * the inverse has to undo each:
 *
 *   starts after the cut          → shifted left        → shift right by `delta`      (follower)
 *   video/audio spanning the cut  → SPLIT in two        → re-lengthen the left piece  (heal)
 *   text/image spanning the cut   → window shortened    → re-lengthen it              (heal)
 *   caption spanning the cut      → interior words cut, → extend + PIECEWISE word shift
 *                                   later words pulled left
 *
 * Skipping them opened a `delta`-long silent hole in any music bed (`applyRippleToTracks` splits
 * every `video`/`audio` element spanning a cut, so a 50-cut Remove Silences run splits the music into
 * 51 pieces — the give-back moved only the right piece), and left a straddling caption's post-seam
 * words playing `delta` early, measured at 1.28s on a real fixture — ~28x the 45ms lip-sync
 * threshold, and baked into the MP4 because the re-render reads these windows from `project_data`.
 *
 * THE FROZEN TAIL (R2-23) CANNOT RECUR HERE, and that is why healing is safe: `delta` is capped by
 * the MAIN track's seam budget, which IS the amount the ripple removed at this seam. A straddler was
 * shortened by exactly that amount, so re-lengthening by at most `delta` can only ever restore a
 * window the element already legally had before the cut. Same-source siblings and the file duration
 * still cap it, so a reordered or hand-built track cannot be talked into duplication either.
 *
 * An element merely ABUTTING the seam from the left is healed only when it carries the split
 * signature (timed media + a same-source element starting at the seam with real source room between
 * them). Without that test, a text overlay a user deliberately ended at the cut point would silently
 * grow — the ripple never shortened it, so there is nothing to give back.
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
  const healed: Array<{ el: SeamElementLike; s: number; e: number }> = [];
  const propUpdates: Array<{ elementId: string; props: Record<string, unknown> }> = [];

  for (const track of tracks) {
    const trackEls = sortedByStart(track.getElements() ?? []);
    for (let k = 0; k < trackEls.length; k++) {
      const el = trackEls[k];
      if (el.getId() === elementId) continue;
      const s = el.getStart();
      const e = el.getEnd();

      // 1. Starts at or after the seam — a pure follower, the inverse of the ripple's left shift.
      if (s >= seam - SEAM_EPS) {
        followers.push({ el, s: s + delta, e: e + delta });
        continue;
      }
      // 2. Ends before the seam — the cut never touched it.
      if (e <= seam - SEAM_EPS) continue;

      // 3. Anchored before the seam and reaching it: damaged by the cut, so heal it.
      const abutsOnly = Math.abs(e - seam) <= SEAM_EPS;
      if (abutsOnly && !hasSplitSignature(el, trackEls[k + 1], trackEls)) continue;

      const room = healRoomSeconds(el, trackEls);
      const grow = Math.min(delta, room);
      if (!(grow > SEAM_EPS)) continue;

      if (isCaption(el)) {
        // A caption's words do not scale with its window — the ones before the seam must stay put
        // while the ones after it move. `adjustCaptionWordsForTimeChange` cannot express that, so the
        // corrected array rides the props-only second batch (see SeamGiveBackPlan.propUpdates).
        const props = shiftCaptionWordsAcrossSeam(el, seam, grow);
        // `null` means it carries word timings we cannot correct through `updateElements` (a legacy
        // metadata-only array). Refuse the whole give-back rather than commit a caption whose words
        // we knowingly left `delta` out of sync — silence is the failure mode this feature exists to
        // remove, not one to introduce.
        if (props === UNFIXABLE_CAPTION) return null;
        if (props) propUpdates.push({ elementId: el.getId(), props });
      }

      healed.push({ el, s, e: e + grow });
    }
  }
  followers.sort((a, b) => b.s - a.s);

  // ── Clone-and-verify: project every touched position onto plain numbers and check the result is a
  // legal timeline BEFORE anything mutates. A failed projection returns null (ordinary trim), never
  // a half-applied edit.
  const projected = new Map<string, { s: number; e: number }>();
  for (const f of followers) projected.set(f.el.getId(), { s: f.s, e: f.e });
  for (const h of healed) projected.set(h.el.getId(), { s: h.s, e: h.e });
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
    // Followers first (farthest-first) so the room exists before anything grows into it, then the
    // healed straddlers, then the clip. Every intermediate state stays legal for a mid-batch read.
    updates: [
      ...followers.map((f) => ({ elementId: f.el.getId(), updates: { s: f.s, e: f.e } })),
      ...healed.map((h) => ({ elementId: h.el.getId(), updates: { s: h.s, e: h.e } })),
      { elementId, updates: { s: clip.getStart(), e: clampedEnd } },
    ],
    propUpdates,
    followerCount: followers.length,
    healedCount: healed.length,
  };
}
