import { useLayoutEffect, useRef, useState } from "react";
import { ASSETS } from "../config/assets";

interface CameraOverlayProps {
  mode: "scanning" | "acquiring" | "lost" | "missing";
  onKeepLooking?: () => void;
  onBack?: () => void;
}

const copy = {
  scanning: {
    title: "Point your camera at the invitation card",
    body: "Hold steady to unlock your invitation.",
  },
  acquiring: {
    title: "Hold steady",
    body: "The card is in view. Waiting for a stable pose.",
  },
  lost: {
    title: "The card left the frame",
    body: "Bring the invitation back into view. The ceremony will continue.",
  },
  missing: {
    title: "Point your camera at the invitation card",
    body: "Hold steady to unlock your invitation.",
  },
} as const;

function viewfinderMask(x: number, y: number, w: number, h: number) {
  const right = x + w;
  const bottom = y + h;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path fill='white' fill-rule='evenodd' d='M0 0H100V100H0Z M${x} ${y}H${right}V${bottom}H${x}Z'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function CameraOverlay({ mode, onKeepLooking, onBack }: CameraOverlayProps) {
  const text = copy[mode];
  const framed = mode !== "lost";
  const rootRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [mask, setMask] = useState(() => viewfinderMask(7, 34, 86, 36));

  useLayoutEffect(() => {
    if (!framed) return;
    const root = rootRef.current;
    const frame = windowRef.current;
    if (!root || !frame) return;
    const update = () => {
      const bounds = root.getBoundingClientRect();
      const opening = frame.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      const x = ((opening.left - bounds.left) / bounds.width) * 100;
      const y = ((opening.top - bounds.top) / bounds.height) * 100;
      const w = (opening.width / bounds.width) * 100;
      const h = (opening.height / bounds.height) * 100;
      setMask(viewfinderMask(x, y, w, h));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [framed]);

  return (
    <div className={`scan-overlay mode-${mode}`} ref={rootRef}>
      {framed && (
        <>
          <img
            className="scan-bg"
            src={ASSETS.background}
            alt=""
            style={{ maskImage: mask, WebkitMaskImage: mask }}
          />
          <header className="brand-row scan-brands">
            <img className="brand-logo" src={ASSETS.yomaLogo} alt="Yoma Bank" />
            <span className="brand-rule" aria-hidden="true" />
            <img className="brand-logo" src={ASSETS.prudentialLogo} alt="Prudential" />
          </header>
        </>
      )}
      <div className="scan-copy">
        <p className="scan-title">{text.title}</p>
        <p className="scan-sub">{text.body}</p>
        {mode === "missing" && (
          <div className="scan-actions">
            <button type="button" className="scan-primary" onClick={onKeepLooking}>
              Keep looking
            </button>
            <button type="button" className="text-button scan-back" onClick={onBack}>
              Back
            </button>
          </div>
        )}
      </div>
      {framed && <div className="scan-window" ref={windowRef} aria-hidden="true" />}
    </div>
  );
}
