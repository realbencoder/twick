import { useLivePlayerTime } from "@twick/live-player";
import SeekTrack, { PlayheadState } from "../track/seek-track";
import { TimelineTickConfig } from "../video-editor";

const SeekControl = ({
  duration,
  zoom,
  onSeek,
  timelineTickConfigs,
  onPlayheadUpdate,
}: {
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
  timelineTickConfigs?: TimelineTickConfig[];
  onPlayheadUpdate?: (state: PlayheadState) => void;
}) => {
  const currentTime = useLivePlayerTime();
  return (
    <SeekTrack
      duration={duration}
      currentTime={currentTime}
      zoom={zoom}
      onSeek={onSeek}
      timelineTickConfigs={timelineTickConfigs}
      onPlayheadUpdate={onPlayheadUpdate}
    />
  );
};

export default SeekControl;
