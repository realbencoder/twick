import { useEffect, useRef } from "react";
import { PLAYER_STATE, useLivePlayerContext } from "@twick/live-player";
import {
  TIMELINE_ACTION,
  useTimelineContext,
} from "@twick/timeline";

/**
 * Custom hook to manage player control state and playback.
 * Handles play/pause toggling and synchronization with timeline context
 * for video editor playback control.
 *
 * @returns Object containing player control functions
 * 
 * @example
 * ```js
 * const { togglePlayback } = usePlayerControl();
 * 
 * // Toggle between play and pause states
 * togglePlayback();
 * ```
 */
export const usePlayerControl = (skipRefreshCycle = false) => {
  const { playerState, setPlayerState } = useLivePlayerContext();
  const { present, timelineAction, setTimelineAction } = useTimelineContext();
  const playerStateRef = useRef<PLAYER_STATE>(playerState);
  const initializedRef = useRef(false);

  // Count total elements across all tracks to detect when new media is added
  const elementCountRef = useRef(0);
  const elementCount = present?.tracks?.reduce(
    (sum: number, t: any) => sum + (t.elements?.length || 0), 0
  ) || 0;

  // Fire UPDATE_PLAYER_DATA on mount AND whenever elements are added/removed.
  // This ensures new media sources (B-roll, audio) are loaded into the player
  // without requiring the user to click on the timeline element.
  useEffect(() => {
    if (!present) return;
    const isInitial = !initializedRef.current;
    const elementsChanged = elementCount !== elementCountRef.current;

    if (isInitial || elementsChanged) {
      console.log('[PlayerControl] Element count changed:',
        elementCountRef.current, '→', elementCount,
        isInitial ? '(initial)' : '(update)',
        'dispatching UPDATE_PLAYER_DATA in', isInitial ? '500ms' : '200ms');
      initializedRef.current = true;
      elementCountRef.current = elementCount;
      const timer = setTimeout(() => {
        setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, present);
      }, isInitial ? 500 : 200);
      return () => clearTimeout(timer);
    }
  }, [present, elementCount, setTimelineAction]);

  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlayback = () => {
    if (skipRefreshCycle) {
      // External player (WebCodecs) — call controller DIRECTLY via window global.
      // No LivePlayerContext middleman. No feedback loops.
      const ctrl = typeof window !== 'undefined' ? (window as any).__webcodecs_controller : null;
      if (ctrl) {
        ctrl.togglePlayback();
        // One-way sync: update LivePlayerContext AFTER controller acts (for UI icons + Fabric.js)
        const newState = ctrl.getState() === 'playing' ? PLAYER_STATE.PLAYING : PLAYER_STATE.PAUSED;
        playerStateRef.current = newState;
        setPlayerState(newState);
        return;
      }
    }

    // Old LivePlayer path — needs Refresh cycle
    console.log('[PlayerControl] togglePlayback called, current state:', playerState);
    if (playerState === PLAYER_STATE.PLAYING) {
      playerStateRef.current = PLAYER_STATE.PAUSED;
      setPlayerState(PLAYER_STATE.PAUSED);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    } else if (playerState === PLAYER_STATE.PAUSED || playerState === PLAYER_STATE.REFRESH) {
      playerStateRef.current = PLAYER_STATE.REFRESH;
      setPlayerState(PLAYER_STATE.REFRESH);
      setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, present);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => {
        if (playerStateRef.current === PLAYER_STATE.REFRESH) {
          playerStateRef.current = PLAYER_STATE.PLAYING;
          setPlayerState(PLAYER_STATE.PLAYING);
        }
      }, 2000);
    }
  };

  useEffect(() => {
    if (timelineAction.type === TIMELINE_ACTION.ON_PLAYER_UPDATED) {
      console.log('[PlayerControl] ON_PLAYER_UPDATED received, stateRef:', playerStateRef.current);
      if(playerStateRef.current === PLAYER_STATE.REFRESH) {
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        playerStateRef.current = PLAYER_STATE.PLAYING;
        setPlayerState(PLAYER_STATE.PLAYING);
        console.log('[PlayerControl] → PLAYING');
      }
    }
  }, [timelineAction]);


  return {
    togglePlayback,
  };
};
