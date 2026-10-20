import { useEffect, useRef, useState } from "react";
import { ARExperience } from "../ar/ARExperience";
import { AssetError, preloadAssets, type LoadedAssets } from "../ar/AssetLoader";
import { canRecordVideo } from "../ar/capture";
import { CameraOverlay } from "../components/CameraOverlay";
import { CapturePreview } from "../components/CapturePreview";
import { ErrorScreen } from "../components/ErrorScreen";
import { ExperienceControls } from "../components/ExperienceControls";
import { InvitationModal } from "../components/InvitationModal";
import { LandingScreen } from "../components/LandingScreen";
import { LoadingScreen } from "../components/LoadingScreen";
import { PreviewGate } from "../components/PreviewGate";
import { createLiveParams, qualityPresets, resolveQuality } from "../config/experience";
import { browserCanAttemptAR, cameraErrorCode, type ExperienceErrorCode } from "../lib/errors";

function isPreview() {
  return new URLSearchParams(window.location.search).get("preview") === "true";
}

export function App() {
  if (isPreview()) return <PreviewGate />;
  return <GuestExperience />;
}

function GuestExperience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<ARExperience | null>(null);
  const [phase, setPhase] = useState<"landing" | "loading" | "scanning" | "experience" | "error">("landing");
  const [progress, setProgress] = useState(0);
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [session, setSession] = useState(false);
  const [lost, setLost] = useState(false);
  const [searchMiss, setSearchMiss] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<ExperienceErrorCode | null>(null);
  const [capture, setCapture] = useState<{ blob: Blob; url: string } | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const recordable = canRecordVideo();

  useEffect(() => {
    void preloadAssets().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session || !assets || !stageRef.current) return;
    const quality = qualityPresets[resolveQuality()];
    const experience = new ARExperience(stageRef.current, assets, quality, createLiveParams(quality), {
      onScanning: () => setPhase("scanning"),
      onTracking: () => {
        setLost(false);
        setSearchMiss(false);
        setPhase("experience");
      },
      onLost: () => setLost(true),
      onRevealComplete: () => setRevealed(true),
      onError: (code) => {
        setError(code);
        setPhase("error");
      },
      onSearchTimeout: () => setSearchMiss(true),
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
  }, [session, assets]);

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
    setPhase("loading");
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
    setLost(false);
    setSearchMiss(false);
    setRevealed(false);
    setRecording(false);
    setInvitationOpen(false);
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

  const overlayMode = searchMiss ? "missing" : lost ? "lost" : "scanning";
  const showOverlay = session && phase !== "error" && phase !== "loading" && (phase === "scanning" || lost || searchMiss);

  return (
    <div className="app-shell">
      {phase === "landing" && <LandingScreen onBegin={() => void begin()} />}
      {phase === "loading" && <LoadingScreen progress={progress} label="Opening the camera" />}
      {session && phase !== "landing" && <div className="stage" ref={stageRef} />}
      {showOverlay && (
        <CameraOverlay
          mode={overlayMode}
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
      {capture && <CapturePreview blob={capture.blob} url={capture.url} onClose={releaseCapture} />}
    </div>
  );
}

function startFailure(reason: unknown): ExperienceErrorCode {
  if (reason instanceof AssetError) return reason.code;
  if (reason instanceof DOMException) return cameraErrorCode(reason);
  const message = reason instanceof Error ? reason.message : "";
  if (/webgl/i.test(message)) return "webgl";
  if (/target|\.mind|fetch/i.test(message)) return "missing-target";
  return "camera-unavailable";
}
