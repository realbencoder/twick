import { useCallback, useEffect, useMemo, useRef } from "react";
import { Player as CorePlayer } from "@twick/core";
import { Player } from "@twick/player-react";
import { getActiveEffectsForTime } from "@twick/effects";
import { generateId, getBaseProject } from "../helpers/player.utils";
//@ts-ignore
import project from "@twick/visualizer/dist/project";

const DEFAULT_VIDEO_SIZE = {
  width: 720,
  height: 1280,
};

/**
 * Props for the LivePlayer component.
 * Defines the configuration options and callback functions for the live player.
 */
export type LivePlayerProps = {
  /** Whether the player should be playing or paused */
  playing: boolean;

  /** Dynamic project variables to feed into the player */
  projectData: any;

  /** Dimensions of the video player */
  videoSize?: {
    width: number;
    height: number;
  };

  /** Time in seconds to seek to on load or update */
  seekTime?: number;

  /** Style for the player container */
  containerStyle?: React.CSSProperties;

  /** Volume of the player */
  volume?: number;

  /** Playback quality level */
  quality?: number;

  /** Callback fired on time update during playback */
  onTimeUpdate?: (currentTime: number) => void;

  /** Callback fired when player data is updated */
  onPlayerUpdate?: (event: CustomEvent) => void;

  /** Callback fired once the player is ready */
  onPlayerReady?: (player: CorePlayer) => void;

  /** Callback fired when the video duration is loaded */
  onDurationChange?: (duration: number) => void;
};

/**
 * LivePlayer is a React component that wraps around the @twick/player-react player.
 * Supports dynamic project variables, external control for playback, time seeking,
 * volume and quality adjustment, and lifecycle callbacks.
 *
 * @param props - Props to control the player and respond to its state
 * @returns A configured player UI component
 * 
 * @example
 * ```jsx
 * <LivePlayer
 *   playing={true}
 *   projectData={{ text: "Hello World" }}
 *   videoSize={{ width: 720, height: 1280 }}
 *   onTimeUpdate={(time) => console.log('Current time:', time)}
 *   onPlayerReady={(player) => console.log('Player ready:', player)}
 * />
 * ```
 */
export const LivePlayer = ({
  playing,
  containerStyle,
  projectData,
  videoSize,
  seekTime = 0,
  volume = 0.25,
  quality = 0.5,
  onTimeUpdate,
  onPlayerUpdate,
  onPlayerReady,
  onDurationChange,
}: LivePlayerProps) => {
  

  const isFirstRender = useRef(false);

  const playerRef = useRef<{
    id: string;
    player: CorePlayer | null;
    htmlElement: HTMLElement | null;
  }>({ id: generateId(), player: null, htmlElement: null });

  const baseProject = useMemo(
    () => getBaseProject(videoSize || DEFAULT_VIDEO_SIZE, playerRef.current.id),
    [videoSize]
  );
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Handle time updates from the player and relay to external callback.
   * Processes time update events and forwards them to the onTimeUpdate prop
   * if provided.
   *
   * @param currentTime - The current playback time in seconds
   * 
   * @example
   * ```js
   * onCurrentTimeUpdate(5.5);
   * // Triggers onTimeUpdate callback with 5.5 seconds
   * ```
   */
  const onCurrentTimeUpdate = useCallback((currentTime: number) => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime);
    }
  }, [onTimeUpdate]);

  /**
   * Applies JSON variables to the player element.
   * Converts project data to JSON and sets it as an attribute
   * on the player HTML element for dynamic content updates.
   * 
   * Uses setAttribute instead of setting the property directly because
   * the twick-player custom element's variables property is read-only (getter only).
   * React would try to set it as a property, which would fail.
   *
   * @param projectData - The project data to apply to the player
   * 
   * @example
   * ```js
   * setProjectData({ text: "Updated content", color: "red" });
   * // Updates player with new project variables via setAttribute
   * ```
   */
  const setProjectData = useCallback((projectData: any) => {
    if (playerRef.current?.htmlElement && projectData) {
      playerRef.current.htmlElement.setAttribute(
        "variables",
        JSON.stringify({ ...projectData, playerId: playerRef.current.id })
      );
    }
  }, []);

  /**
   * Performs setup only once after the player has rendered for the first time.
   * Hides unnecessary UI elements and applies initial project data
   * to ensure proper player initialization.
   * 
   * Merges baseProject with projectData to ensure all required properties are present.
   * 
   * @example
   * ```js
   * onFirstRender();
   * // Hides UI elements and sets initial project data
   * ```
   */
  const onFirstRender = useCallback(() => {
    if (playerRef.current?.player && playerRef.current.htmlElement) {
      playerRef.current.htmlElement?.nextElementSibling?.setAttribute(
        "style",
        "display: none;"
      );
      // Set initial project data — the real data with video tracks
      // arrives later via projectData prop update, which triggers
      // the scene init cycle in the projectData useEffect below.
      const initialData = { ...baseProject, ...projectData };
      setProjectData(initialData);
    }
  }, [projectData, baseProject, setProjectData]);

  /**s
   * Handle player ready lifecycle and store references.
   * Called when the player is fully initialized and ready for use.
   * Stores player references and triggers the onPlayerReady callback.
   *
   * @param player - The initialized CorePlayer instance
   * 
   * @example
   * ```js
   * handlePlayerReady(playerInstance);
   * // Stores player reference and triggers onPlayerReady callback
   * ```
   */
  const handlePlayerReady = useCallback((player: CorePlayer) => {
    const el = playerContainerRef.current?.querySelector("twick-player");
    const htmlElement = el ? (el as HTMLElement) : null;
    if (htmlElement) {
      (htmlElement as any).getActiveEffectsForTime = getActiveEffectsForTime;
    }
    playerRef.current = {
      player,
      id: playerRef.current.id,
      htmlElement,
    };

    if (!isFirstRender.current) {
      onFirstRender();
      isFirstRender.current = true;

      // Force the player canvas to match container dimensions on first load.
      // Without this, the canvas renders at native resolution (e.g. 720x1280)
      // which overflows the container until CSS layout settles.
      if (htmlElement) {
        const canvas = htmlElement.querySelector('canvas');
        const container = playerContainerRef.current;
        if (canvas && container) {
          requestAnimationFrame(() => {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
          });
        }
      }

      if (onPlayerReady) {
        onPlayerReady(player);
      }
    }
  }, [onPlayerReady, onFirstRender]);

  /**
   * Handles player update events from the Twick player.
   * Filters events by player ID and forwards them to the onPlayerUpdate callback
   * if provided. This ensures only events for this specific player instance
   * are processed.
   *
   * @param event - Custom event containing player update information
   * 
   * @example
   * ```js
   * handleUpdate(customEvent);
   * // Forwards event to onPlayerUpdate if playerId matches
   * ```
   */
  const handleUpdate = (event: CustomEvent) => {
    if (event.detail.playerId === playerRef.current.id) {
      if (onPlayerUpdate) {
        onPlayerUpdate(event);
      }
    }
  };

  // Apply new project data whenever it changes.
  // This is where the real video track data arrives (via UPDATE_PLAYER_DATA).
  // We force the Motion Canvas scene to render a frame so it creates
  // <video>/<audio> DOM elements from the actual project data.
  const hasInitSceneRef = useRef(false);
  const prevSeekTimeRef = useRef(seekTime);
  const prevProjectDataRef = useRef(projectData);
  useEffect(() => {
    if (!isFirstRender.current || !playerRef.current?.htmlElement) return;

    const seekTimeChanged = prevSeekTimeRef.current !== seekTime;
    const projectDataChanged = prevProjectDataRef.current !== projectData;
    const currentFrame = playerRef.current.player?.playback?.frame ?? '?';
    console.log('[LivePlayer] useEffect fired — seekTimeChanged:', seekTimeChanged,
      'projectDataChanged:', projectDataChanged,
      'seekTime:', seekTime, 'prevSeekTime:', prevSeekTimeRef.current,
      'currentFrame:', currentFrame,
      'version:', (projectData as any)?.input?.version);

    const el = playerRef.current.htmlElement;
    const player = playerRef.current.player;

    // CRITICAL: Only call setProjectData when projectData actually changed.
    // Previously this was called on every effect run (including seekTime-only
    // changes), which triggered attributeChangedCallback. That callback does
    // requestSeek(playback.frame) — but playback.frame can be stale/wrong
    // (Motion Canvas internal frame counter drifts from timeline time).
    // This was the root cause of playhead jumping after cuts: seekTime change
    // → setProjectData (unnecessarily) → attributeChangedCallback →
    // requestSeek(staleFrame) → overrides the correct seekto event.
    if (projectDataChanged) {
      prevProjectDataRef.current = projectData;
      console.log('[LivePlayer] projectData changed — calling setProjectData');
      setProjectData(projectData);
    }

    // Only dispatch seekto when seekTime actually changed (user clicked
    // timeline / scrubbed). Do NOT dispatch on projectData-only changes
    // (split, element add/remove) — the Motion Canvas attributeChangedCallback
    // already seeks to the current frame when variables update.
    if (seekTimeChanged) {
      prevSeekTimeRef.current = seekTime;
      console.log('[LivePlayer] Dispatching seekto event with time:', seekTime);
      requestAnimationFrame(() => {
        el.dispatchEvent(new CustomEvent("seekto", { detail: seekTime }));
      });
    } else {
      console.log('[LivePlayer] Skipping seekto — seekTime unchanged');
    }

    // CRITICAL FIX: Motion Canvas scenes are generator functions that read
    // variables ONCE at startup. If the scene started before variables were
    // set (common on first load — scene starts with empty data), the scene
    // must be RESET to re-read the now-correct variables.
    //
    // player.requestReset() tells the scene to restart from frame 0,
    // which re-runs the generator and re-reads the input variables.
    // A brief play then pause runs the scene for one frame with correct data.
    if (!hasInitSceneRef.current && player) {
      hasInitSceneRef.current = true;
      const hasTracks = !!(projectData as any)?.input?.tracks?.length;
      console.log('[LivePlayer] Init scene — resetting to re-read variables. Has tracks:', hasTracks);

      // Reset scene so the generator re-reads the (now correct) variables.
      // Then run ONE frame via play/pause so the scene processes the data.
      // Skip the play/pause if data already has tracks — the scene can
      // process them on the next user-initiated play without interference.
      setTimeout(() => {
        (player as any).requestReset();
        if (!hasTracks) {
          // No tracks yet — force a frame render so scene is ready
          player.togglePlayback(true);
          setTimeout(() => {
            player.togglePlayback(false);
            console.log('[LivePlayer] Init complete — scene reset (empty → waiting for data)');
          }, 200);
        } else {
          console.log('[LivePlayer] Init complete — scene reset with correct data');
        }
      }, 100);
    }
  }, [projectData, setProjectData, seekTime]);

  // Play/pause player based on external prop.
  // Uses a MutationObserver to catch dynamically-created media elements
  // that the scene adds after the initial pause — prevents audio leaks.
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const cleanups: ReturnType<typeof setTimeout>[] = [];
    let observer: MutationObserver | null = null;

    const tryToggle = () => {
      if (playerRef.current?.player) {
        playerRef.current.player.togglePlayback(playing);
        return true;
      }
      return false;
    };

    if (!tryToggle()) {
      cleanups.push(setTimeout(() => tryToggle(), 500));
      cleanups.push(setTimeout(() => tryToggle(), 1000));
    }

    // Pause + mute a single media element
    const muteAndPause = (media: HTMLMediaElement) => {
      try { media.pause(); media.muted = true; } catch {}
    };

    // Unmute a single media element
    const unmute = (media: HTMLMediaElement) => {
      try { media.muted = false; } catch {}
    };

    // Find all media elements including inside shadow DOMs
    const getAllMedia = (): HTMLMediaElement[] => {
      const container = playerContainerRef.current;
      if (!container) return [];
      const results: HTMLMediaElement[] = [];
      container.querySelectorAll('video, audio').forEach((el) =>
        results.push(el as HTMLMediaElement)
      );
      // Check shadow DOMs
      container.querySelectorAll('*').forEach((el) => {
        if ((el as any).shadowRoot) {
          (el as any).shadowRoot.querySelectorAll('video, audio').forEach((m: HTMLMediaElement) =>
            results.push(m)
          );
        }
      });
      return results;
    };

    if (!playing) {
      // Pause all existing media
      getAllMedia().forEach(muteAndPause);

      // Watch for new media elements the scene creates asynchronously.
      // Any new <video>/<audio> added while paused gets immediately muted+paused.
      if (playerContainerRef.current) {
        observer = new MutationObserver((mutations) => {
          if (playingRef.current) return; // playing started, stop intercepting
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLMediaElement) {
                muteAndPause(node);
              } else if (node instanceof HTMLElement) {
                node.querySelectorAll?.('video, audio').forEach((el) =>
                  muteAndPause(el as HTMLMediaElement)
                );
              }
            }
          }
        });
        observer.observe(playerContainerRef.current, {
          childList: true,
          subtree: true,
        });
      }

      // Safety net: catch anything the observer missed
      cleanups.push(setTimeout(() => {
        if (!playingRef.current) getAllMedia().forEach(muteAndPause);
      }, 200));
    } else {
      // Playing — unmute any media elements (audio tracks may use DOM elements)
      getAllMedia().forEach(unmute);
      cleanups.push(setTimeout(() => getAllMedia().forEach(unmute), 100));
    }

    return () => {
      cleanups.forEach((t) => clearTimeout(t));
      if (observer) observer.disconnect();
    };
  }, [playing]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener(
        "twick:playerUpdate",
        handleUpdate as EventListener
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "twick:playerUpdate",
          handleUpdate as EventListener
        );
      }
    };
  }, [handleUpdate]);

  return (
    <div
      ref={playerContainerRef}
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        ...(containerStyle || {}),
      }}
    >
      <Player
        project={project}
        looping={false}
        controls={false}
        currentTime={seekTime}
        volume={volume}
        quality={quality || 1}
        onTimeUpdate={onCurrentTimeUpdate}
        onPlayerReady={handlePlayerReady}
        width={baseProject.input?.properties?.width || DEFAULT_VIDEO_SIZE.width}
        height={
          baseProject?.input?.properties?.height || DEFAULT_VIDEO_SIZE.height
        }
        timeDisplayFormat="MM:SS.mm"
        onDurationChange={(e: number) => {
          if (onDurationChange) {
            onDurationChange(e);
          }
        }}
      />
    </div>
  );
};
