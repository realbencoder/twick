import React from "react";
import { Track } from "@twick/timeline";
import { GripVertical, Lock, Unlock } from "lucide-react";
import "../../styles/timeline.css";

interface TrackHeaderProps {
  track: Track;
  selectedIds: Set<string>;
  onSelect: (track: Track, event: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, track: Track) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, track: Track) => void;
}

/**
 * A friendly label + accent color per track, so empty tracks read as "Subtitles"/"Audio"/etc.
 * instead of anonymous grey bars. Resolves the MAIN video track by NAME ("Video"), like the rest
 * of the codebase — never by type alone (which also matches B-roll video tracks).
 */
const trackLabel = (track: Track): { label: string; color: string } => {
  const type = track.getType?.();
  const name = track.getName?.() ?? "";
  if (type === "video" && (name === "Video" || !name)) return { label: "Video", color: "#22c55e" };
  if (type === "video") return { label: "B-roll", color: "#3b82f6" };
  if (type === "caption") return { label: "Subtitles", color: "#f97316" };
  if (type === "audio") return { label: "Audio", color: "#14b8a6" };
  return { label: name || "Overlay", color: "#8b5cf6" };
};

const TrackHeader = ({
  track,
  selectedIds,
  onDragStart,
  onDragOver,
  onDrop,
  onSelect,
}: TrackHeaderProps) => {
  const isLocked = (track.getProps() as any)?.locked === true;
  const { label, color } = trackLabel(track);

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const props = track.getProps() ?? {};
    track.setProps({ ...props, locked: !isLocked });
    // Force re-render by triggering a click on the header
    onSelect(track, e);
  };

  return (
    <div
      className={`twick-track-header ${
        selectedIds.has(track.getId())
          ? "twick-track-header-selected"
          : "twick-track-header-default"
      } ${isLocked ? "twick-track-header-locked" : ""}`}
      title={label}
      draggable={!isLocked}
      onClick={(e) => onSelect(track, e)}
      onDragStart={(e) => !isLocked && onDragStart(e, track)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, track)}
    >
      {/* Accent rail: a color stripe down the header's left edge so each track's type reads at a
          glance (green Video, orange Subtitles, teal Audio, blue B-roll, violet Overlay). */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          backgroundColor: color,
          borderTopLeftRadius: "inherit",
          borderBottomLeftRadius: "inherit",
        }}
      />
      <div className="twick-track-header-content">
        <div className="twick-track-header-grip">
          <GripVertical size={14} />
        </div>
        <button
          className="twick-track-lock-btn"
          onClick={toggleLock}
          title={isLocked ? "Unlock track" : "Lock track"}
        >
          {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
    </div>
  );
};

export default TrackHeader;
