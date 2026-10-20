import { X } from "lucide-react";
import { extensionForBlob, saveBlob } from "../ar/capture";

interface CapturePreviewProps {
  blob: Blob;
  url: string;
  onClose: () => void;
}

export function CapturePreview({ blob, url, onClose }: CapturePreviewProps) {
  const video = blob.type.startsWith("video/");
  const save = () => {
    const name = `ignite-invitation.${extensionForBlob(blob)}`;
    void saveBlob(blob, name);
  };
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Captured invitation">
      <article className="capture-card">
        <button className="icon-close" type="button" onClick={onClose} aria-label="Close capture">
          <X size={18} />
        </button>
        {video ? <video src={url} controls playsInline /> : <img src={url} alt="Captured invitation scene" />}
        <div className="capture-actions">
          <button type="button" className="begin" onClick={save}>
            Save
          </button>
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </div>
      </article>
    </div>
  );
}
