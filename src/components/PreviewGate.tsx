import { useEffect, useRef, useState } from "react";
import { preloadAssets, AssetError } from "../ar/AssetLoader";
import { PreviewExperience } from "../ar/PreviewExperience";
import { createLiveParams, qualityPresets, resolveQuality } from "../config/experience";
import { ERROR_COPY, type ExperienceErrorCode } from "../lib/errors";

export function PreviewGate() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<ExperienceErrorCode | null>(null);

  useEffect(() => {
    const host = stageRef.current;
    if (!host) return;
    let experience: PreviewExperience | null = null;
    let cancelled = false;
    preloadAssets(setProgress)
      .then((assets) => {
        if (cancelled) return;
        const quality = qualityPresets[resolveQuality()];
        experience = new PreviewExperience(host, assets, quality, createLiveParams(quality), () => {
          setError("webgl-lost");
        });
        experience.start();
        setReady(true);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof AssetError ? reason.code : "webgl");
      });
    return () => {
      cancelled = true;
      experience?.dispose();
    };
  }, []);

  return (
    <div className="preview-shell">
      <div className="stage" ref={stageRef} />
      {!ready && !error && (
        <div className="stage-loading" role="status" aria-live="polite">
          <p>Preparing the stage</p>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="progress-value">{Math.round(progress * 100)}%</p>
        </div>
      )}
      {error && (
        <section className="error-screen" role="alert">
          <div className="error-card">
            <h2>{ERROR_COPY[error].title}</h2>
            <p>{ERROR_COPY[error].body}</p>
          </div>
        </section>
      )}
      <p className="preview-badge">Desktop preview</p>
    </div>
  );
}
