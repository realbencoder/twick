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

const TrackHeader = ({
  track,
  selectedIds,
  onDragStart,
  onDragOver,
  onDrop,
  onSelect,
}: TrackHeaderProps) => {
  const isLocked = (track.getProps() as any)?.locked === true;

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
      draggable={!isLocked}
      onClick={(e) => onSelect(track, e)}
      onDragStart={(e) => !isLocked && onDragStart(e, track)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, track)}
    >
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
