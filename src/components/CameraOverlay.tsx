interface CameraOverlayProps {
  mode: "scanning" | "lost" | "missing";
  onKeepLooking?: () => void;
  onBack?: () => void;
}

export function CameraOverlay({ mode, onKeepLooking, onBack }: CameraOverlayProps) {
  return (
    <div className={`scan-overlay mode-${mode}`}>
      <div className="scan-corners" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {mode === "lost" ? (
        <div className="scan-copy">
          <p className="scan-title">The card left the frame</p>
          <p className="scan-sub">Bring the invitation back into view. The ceremony will continue.</p>
        </div>
      ) : (
        <div className="scan-copy">
          <p className="scan-title">Point your camera at the invitation card</p>
          <p className="scan-sub">Hold steady to unlock your invitation.</p>
        </div>
      )}
      {mode === "missing" && (
        <div className="scan-actions">
          <button type="button" className="text-button" onClick={onKeepLooking}>
            Keep looking
          </button>
          <button type="button" className="text-button quiet" onClick={onBack}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
