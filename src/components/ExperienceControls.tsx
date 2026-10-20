import { BookOpen, Camera, RotateCcw, Square, Video } from "lucide-react";

interface ExperienceControlsProps {
  canRecord: boolean;
  recording: boolean;
  onReplay: () => void;
  onPhoto: () => void;
  onRecord: () => void;
  onInvitation: () => void;
}

export function ExperienceControls({
  canRecord,
  recording,
  onReplay,
  onPhoto,
  onRecord,
  onInvitation,
}: ExperienceControlsProps) {
  return (
    <div className="experience-controls">
      <button type="button" onClick={onReplay}>
        <RotateCcw size={18} strokeWidth={1.5} />
        <span>Replay</span>
      </button>
      <button type="button" onClick={onPhoto}>
        <Camera size={18} strokeWidth={1.5} />
        <span>Capture Photo</span>
      </button>
      {canRecord && (
        <button type="button" onClick={onRecord} aria-pressed={recording}>
          {recording ? <Square size={18} strokeWidth={1.5} /> : <Video size={18} strokeWidth={1.5} />}
          <span>{recording ? "Stop Video" : "Record Video"}</span>
        </button>
      )}
      <button type="button" onClick={onInvitation}>
        <BookOpen size={18} strokeWidth={1.5} />
        <span>View Invitation</span>
      </button>
    </div>
  );
}
