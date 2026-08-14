import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { PLAYER_STATE } from "../helpers/constants";

/**
 * Type definition for the Live Player context.
 * Contains all the state and functions needed to control a live player instance.
 *
 * NOTE: `currentTime` deliberately does NOT live here — read it with `useLivePlayerTime()`.
 * See the LivePlayerProvider docblock for why.
 *
 * @example
 * ```js
 * const {
 *   playerState,
 *   seekTime,
 *   playerVolume,
 *   getCurrentTime,
 *   setSeekTime,
 *   setPlayerState,
 *   setCurrentTime,
 *   setPlayerVolume
 * } = useLivePlayerContext();
 *
 * // the ticking value is a separate subscription:
 * const currentTime = useLivePlayerTime();
 * ```
 */
type LivePlayerContextType = {
  /** Current state of the player (playing, paused, refresh) */
  playerState: string;
  /** Time to seek to when player state changes */
  seekTime: number;
  /** Current volume level (0-1) */
  playerVolume: number;
  /** Read the latest playback time WITHOUT subscribing to it (reads a ref) */
  getCurrentTime: () => number;
  /** Function to set the seek time */
  setSeekTime: (time: number) => void;
  /** Function to set the player state */
  setPlayerState: (state: string) => void;
  /** Function to set the current time */
  setCurrentTime: (time: number) => void;
  /** Function to set the player volume */
  setPlayerVolume: (volume: number) => void;
};

const LivePlayerContext = createContext<LivePlayerContextType | undefined>(undefined);

/**
 * The ticking playback time, on its OWN context so that a 20-30Hz update does not
 * re-render every consumer of the stable player controls.
 */
const LivePlayerTimeContext = createContext<number | undefined>(undefined);

/**
 * Provider component for the Live Player context.
 *
 * WHY THIS IS SPLIT INTO TWO CONTEXTS (measured 2026-08-14, real prod videos, real Chrome):
 *
 * The player pushes `setCurrentTime` every 50ms during playback. React re-renders EVERY
 * consumer of a context whenever that context's VALUE changes — regardless of which field
 * the consumer destructured. The value used to be an inline object literal (rebuilt on every
 * render, with `getCurrentTime` and `setPlayerState` as fresh closures inside it), so all 12
 * consumers re-rendered 20-30x/sec while a video played, along with everything beneath them.
 *
 * Measured cost of that, playing the same 24-minute video:
 *   - 155.2 MB/sec of garbage allocated (vs 6.5 MB/sec on a 47-second video)
 *   - 28.1% of the profile in Minor GC; ~63% of all allocation was React + @use-gesture
 *     rebuilding component trees and gesture configs that had not changed
 *   - the render loop managed 29 fps where a short video hit 118 fps on the same machine
 *
 * It scales with the number of timeline elements (41 vs 1,572 => 38x the elements, 24x the
 * allocation), which is why long videos felt worse: it is O(duration), not a flat cost.
 *
 * The fix has two halves and BOTH are required:
 *   1. `currentTime` moves to its own context, so the 20-30Hz tick reaches only the handful
 *      of components that actually render a playhead.
 *   2. The remaining value is memoized and its callbacks are stable. Memoizing ALONE would
 *      have done nothing while `currentTime` was still a field of the same object — the
 *      object would be new on every tick regardless. That is the trap; do not "simplify"
 *      this back into one context and a useMemo.
 *
 * `currentTime` is also mirrored into a ref so `getCurrentTime()` and the pause branch of
 * `setPlayerState` can read the latest time without subscribing to it. The ref is written
 * synchronously in `setCurrentTime`, so it is never staler than the state — and during a
 * React batch it is fresher.
 *
 * @param props - Component props containing children to wrap
 * @returns Context provider with live player state management
 *
 * @example
 * ```jsx
 * <LivePlayerProvider>
 *   <YourApp />
 * </LivePlayerProvider>
 * ```
 */
export const LivePlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [playerState, setPlayerStateValue] = useState<string>(PLAYER_STATE.PAUSED);
  const [seekTime, setSeekTime] = useState<number>(0);
  const [currentTime, setCurrentTimeValue] = useState<number>(0);
  const [playerVolume, setPlayerVolume] = useState<number>(1);

  // Ref mirror of currentTime. Lets the STABLE context read the latest time without
  // subscribing to it — which is the whole point of the split.
  const currentTimeRef = useRef<number>(0);

  const setCurrentTime = useCallback((time: number) => {
    currentTimeRef.current = time;
    setCurrentTimeValue(time);
  }, []);

  const getCurrentTime = useCallback(() => currentTimeRef.current, []);

  const setPlayerState = useCallback((newState: string) => {
    if (newState === PLAYER_STATE.PAUSED) {
      // Reads the ref, not a closed-over render value: on pause we want the time as of
      // NOW, which is what the previous inline closure approximated by being rebuilt on
      // every render.
      setSeekTime(currentTimeRef.current);
    }
    setPlayerStateValue(newState);
  }, []);

  // Changes only on real events (play/pause, seek, volume) — never on the playback tick.
  // setSeekTime / setPlayerVolume are raw setState functions, which React guarantees are stable.
  const value = useMemo<LivePlayerContextType>(
    () => ({
      seekTime,
      playerState,
      playerVolume,
      getCurrentTime,
      setSeekTime,
      setPlayerState,
      setCurrentTime,
      setPlayerVolume,
    }),
    [seekTime, playerState, playerVolume, getCurrentTime, setPlayerState, setCurrentTime]
  );

  return (
    <LivePlayerContext.Provider value={value}>
      <LivePlayerTimeContext.Provider value={currentTime}>
        {children}
      </LivePlayerTimeContext.Provider>
    </LivePlayerContext.Provider>
  );
};

/**
 * Hook to access the Live Player context.
 * Provides access to player state, seek/volume controls, and the setters.
 * Must be used within a LivePlayerProvider component.
 *
 * Does NOT re-render on the playback tick — use `useLivePlayerTime()` if you need the
 * ticking value, or `getCurrentTime()` if you only need to read it inside a handler.
 *
 * @returns LivePlayerContextType object with player state and controls
 * @throws Error if used outside of LivePlayerProvider
 *
 * @example
 * ```js
 * const { playerState, setPlayerState, getCurrentTime } = useLivePlayerContext();
 *
 * setPlayerState(PLAYER_STATE.PLAYING);
 * const now = getCurrentTime();
 * ```
 */
export const useLivePlayerContext = () => {
  const context = useContext(LivePlayerContext);
  if (context === undefined) {
    throw new Error("useLivePlayerContext must be used within a LivePlayerProvider");
  }
  return context;
};

/**
 * Subscribe to the ticking playback time (updates ~20-30x/sec during playback).
 *
 * Use this ONLY in components that visibly render the time — a playhead, a timecode, an
 * active-cue highlight. Everything else should use `getCurrentTime()` from
 * `useLivePlayerContext()`, which reads the same value without subscribing.
 *
 * @returns current playback time in seconds
 * @throws Error if used outside of LivePlayerProvider
 */
export const useLivePlayerTime = (): number => {
  const time = useContext(LivePlayerTimeContext);
  if (time === undefined) {
    throw new Error("useLivePlayerTime must be used within a LivePlayerProvider");
  }
  return time;
};
