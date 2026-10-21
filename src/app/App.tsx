import { useEffect, useRef, useState } from "react";
import { ARExperience } from "../ar/ARExperience";
import { AssetError, preloadAssets, type LoadedAssets } from "../ar/AssetLoader";
import { canRecordVideo } from "../ar/capture";
import type { TrackingPhase } from "../ar/trackingTypes";
import { AgendaModal } from "../components/AgendaModal";
import { CameraOverlay } from "../components/CameraOverlay";
import { CapturePreview } from "../components/CapturePreview";
import { ErrorScreen } from "../components/ErrorScreen";
import { ExperienceControls } from "../components/ExperienceControls";
import { InvitationModal } from "../components/InvitationModal";
import { InviteScreen } from "../components/InviteScreen";
import { LandingScreen } from "../components/LandingScreen";
import { PreviewGate } from "../components/PreviewGate";
import { TrackingDebugPanel } from "../components/TrackingDebugPanel";
import { createLiveParams, qualityPresets, resolveQuality } from "../config/experience";
import { browserCanAttemptAR, cameraErrorCode, type ExperienceErrorCode } from "../lib/errors";

function isPreview() {
  return new URLSearchParams(window.location.search).get("preview") === "true";
}

function isTrackingDebug() {
  return new URLSearchParams(window.location.search).get("trackingDebug") === "true";
}

export function App() {
  if (isPreview()) return <PreviewGate />;
  return <GuestExperience />;
}

function GuestExperience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<ARExperience | null>(null);
  const [phase, setPhase] = useState<"landing" | "invited" | "scanning" | "experience" | "error">("landing");
  const [progress, setProgress] = useState(0);
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [session, setSession] = useState(false);
  const [trackingPhase, setTrackingPhase] = useState<TrackingPhase>("INITIALIZING");
  const [searchMiss, setSearchMiss] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<ExperienceErrorCode | null>(null);
  const [capture, setCapture] = useState<{ blob: Blob; url: string } | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const recordable = canRecordVideo();
  const trackingDebug = isTrackingDebug();

  useEffect(() => {
    void preloadAssets().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session || !assets || !stageRef.current) return;
    const quality = qualityPresets[resolveQuality()];
    const experience = new ARExperience(stageRef.current, assets, quality, createLiveParams(quality), trackingDebug, {
      onPhase: (next) => {
        setTrackingPhase(next);
        if (next === "TRACKING" || next === "REACQUIRING" || next === "TEMPORARILY_LOST") {
          setSearchMiss(false);
          setPhase("experience");
          return;
        }
        if (next === "LOST") {
          setSearchMiss(false);
          setPhase((current) => (current === "experience" ? current : "scanning"));
          return;
        }
        setPhase((current) => (current === "experience" ? current : "scanning"));
      },
      onRevealComplete: () => setRevealed(true),
      onError: (code) => {
        setError(code);
        setPhase("error");
      },
      onSearchTimeout: () => setSearchMiss(true),
      onAgenda: () => setAgendaOpen(true),
    });
    experienceRef.current = experience;
    let cancelled = false;
    experience.start().catch((reason: unknown) => {
      if (cancelled) return;
      experience.dispose();
      setError(startFailure(reason));
      setPhase("error");
    });
    return () => {
      cancelled = true;
      experience.dispose();
      experienceRef.current = null;
    };
  }, [session, assets, trackingDebug]);

  async function begin() {
    const support = browserCanAttemptAR();
    if (!support.webgl || !support.media) {
      setError("unsupported");
      setPhase("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch (reason) {
      setError(cameraErrorCode(reason));
      setPhase("error");
      return;
    }
    setProgress(0);
    setPhase("scanning");
    try {
      const loaded = await preloadAssets(setProgress);
      setAssets(loaded);
      setSession(true);
    } catch (reason) {
      setError(reason instanceof AssetError ? reason.code : "texture");
      setPhase("error");
    }
  }

  function releaseCapture() {
    setCapture((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function backHome() {
    setSession(false);
    setPhase("landing");
    setError(null);
    setTrackingPhase("INITIALIZING");
    setSearchMiss(false);
    setRevealed(false);
    setRecording(false);
    setInvitationOpen(false);
    setAgendaOpen(false);
    releaseCapture();
  }

  function retry() {
    if (session || error === "webgl-lost") {
      window.location.reload();
      return;
    }
    setError(null);
    setPhase("landing");
  }

  async function photo() {
    const blob = await experienceRef.current?.capturePhoto();
    if (!blob) return;
    setCapture((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { blob, url: URL.createObjectURL(blob) };
    });
  }

  async function record() {
    const experience = experienceRef.current;
    if (!experience) return;
    if (experience.recording) {
      const blob = await experience.stopRecording();
      setRecording(false);
      if (!blob) return;
      setCapture((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { blob, url: URL.createObjectURL(blob) };
      });
      return;
    }
    try {
      experience.startRecording();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  const overlayMode = searchMiss
    ? "missing"
    : trackingPhase === "LOST" && phase === "experience"
      ? "lost"
      : trackingPhase === "ACQUIRING"
        ? "acquiring"
        : "scanning";
  const preparing = phase === "scanning" && !session;
  const showOverlay =
    preparing ||
    (session &&
      phase !== "error" &&
      (searchMiss ||
        trackingPhase === "INITIALIZING" ||
        trackingPhase === "SEARCHING" ||
        trackingPhase === "ACQUIRING" ||
        trackingPhase === "LOST"));

  return (
    <div className="app-shell">
      {phase === "landing" && <LandingScreen onBegin={() => setPhase("invited")} />}
      {phase === "invited" && <InviteScreen onNext={() => void begin()} />}
      {session && phase !== "landing" && phase !== "invited" && <div className="stage" ref={stageRef} />}
      {trackingDebug && session && phase !== "landing" && phase !== "invited" && (
        <TrackingDebugPanel experience={experienceRef} />
      )}
      {trackingPhase === "TEMPORARILY_LOST" && phase === "experience" && (
        <p className="tracking-hold">Holding the card's place for a moment.</p>
      )}
      {showOverlay && (
        <CameraOverlay
          mode={overlayMode}
          loading={preparing}
          progress={progress}
          onKeepLooking={() => {
            setSearchMiss(false);
            experienceRef.current?.extendSearch();
          }}
          onBack={backHome}
        />
      )}
      {phase === "experience" && revealed && (
        <ExperienceControls
          canRecord={recordable}
          recording={recording}
          onReplay={() => experienceRef.current?.replay()}
          onPhoto={() => void photo()}
          onRecord={() => void record()}
          onInvitation={() => setInvitationOpen(true)}
        />
      )}
      {phase === "error" && error && <ErrorScreen code={error} onRetry={retry} onBack={backHome} />}
      {invitationOpen && <InvitationModal onClose={() => setInvitationOpen(false)} />}
      {agendaOpen && <AgendaModal onClose={() => setAgendaOpen(false)} />}
      {capture && <CapturePreview blob={capture.blob} url={capture.url} onClose={releaseCapture} />}
    </div>
  );
}

function startFailure(reason: unknown): ExperienceErrorCode {
  if (reason instanceof AssetError) return reason.code;
  if (reason instanceof DOMException) return cameraErrorCode(reason);
  const message = reason instanceof Error ? reason.message : "";
  if (/webgl/i.test(message)) return "webgl";
  if (/target|image-target|fetch/i.test(message)) return "missing-target";
  return "camera-unavailable";
}
