import { useEffect, useState, type RefObject } from "react";
import type { ARExperience } from "../ar/ARExperience";
import type { TrackingDiagnostics } from "../ar/trackingTypes";

interface TrackingDebugPanelProps {
  experience: RefObject<ARExperience | null>;
}

export function TrackingDebugPanel({ experience }: TrackingDebugPanelProps) {
  const [stats, setStats] = useState<TrackingDiagnostics | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStats(experience.current?.diagnostics() ?? null);
    }, 200);
    return () => window.clearInterval(id);
  }, [experience]);

  if (!stats) return null;

  return (
    <aside className="tracking-debug" aria-label="Tracking diagnostics">
      <p>Tracking debug</p>
      <dl>
        <div>
          <dt>State</dt>
          <dd>{stats.phase}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{stats.targetVisible ? "Visible" : "Not visible"}</dd>
        </div>
        <div>
          <dt>Frame rate</dt>
          <dd>{stats.fps} fps</dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>{stats.position}</dd>
        </div>
        <div>
          <dt>Rotation</dt>
          <dd>{stats.rotation}</dd>
        </div>
        <div>
          <dt>Pose change</dt>
          <dd>{stats.poseDelta}</dd>
        </div>
        <div>
          <dt>Reacquisitions</dt>
          <dd>{stats.reacquisitions}</dd>
        </div>
        <div>
          <dt>SLAM</dt>
          <dd>
            {stats.slamStatus} / {stats.slamReason}
          </dd>
        </div>
        <div>
          <dt>World</dt>
          <dd>{stats.worldMode}</dd>
        </div>
        <div>
          <dt>Engine filter</dt>
          <dd>{stats.engineFilter}</dd>
        </div>
      </dl>
      <div className="tracking-debug-actions">
        <button type="button" onClick={() => experience.current?.setSmoothing(!stats.smoothing)}>
          Smoothing {stats.smoothing ? "on" : "off"}
        </button>
        <button type="button" onClick={() => experience.current?.setBounds(!stats.bounds)}>
          Bounds {stats.bounds ? "on" : "off"}
        </button>
      </div>
    </aside>
  );
}
