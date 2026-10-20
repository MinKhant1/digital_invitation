import * as THREE from "three";
import { type LiveParams, type QualityPreset } from "../config/experience";
import type { ExperienceErrorCode } from "../lib/errors";
import type { LoadedAssets } from "./AssetLoader";
import { canRecordVideo, canvasToBlob, compositeView, FrameRecorder } from "./capture";
import { EighthWallSession } from "./EighthWallSession";
import type { TrackingDiagnostics, TrackingPhase } from "./trackingTypes";

export interface ARCallbacks {
  onPhase: (phase: TrackingPhase) => void;
  onRevealComplete: () => void;
  onError: (code: ExperienceErrorCode) => void;
  onSearchTimeout: () => void;
}

export class ARExperience {
  private session: EighthWallSession | null = null;
  private recorder: FrameRecorder | null = null;
  private readonly photoCanvas = document.createElement("canvas");
  private disposed = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly assets: LoadedAssets,
    private readonly quality: QualityPreset,
    private readonly params: LiveParams,
    private readonly debugMode: boolean,
    private readonly callbacks: ARCallbacks,
  ) {}

  get canRecord() {
    return canRecordVideo();
  }

  get recording() {
    return Boolean(this.recorder?.active);
  }

  async start() {
    window.THREE = THREE;
    if (this.disposed) return;
    const session = new EighthWallSession(this.container, this.assets, this.quality, this.params, this.debugMode, {
      onPhase: (phase) => {
        if (!this.disposed) this.callbacks.onPhase(phase);
      },
      onRevealComplete: () => {
        if (!this.disposed) this.callbacks.onRevealComplete();
      },
      onError: (code) => {
        if (!this.disposed) this.callbacks.onError(code);
      },
      onSearchTimeout: () => {
        if (!this.disposed) this.callbacks.onSearchTimeout();
      },
    });
    this.session = session;
    await session.start();
  }

  extendSearch() {
    this.session?.extendSearch();
  }

  replay() {
    this.session?.replay();
  }

  diagnostics(): TrackingDiagnostics | null {
    return this.session?.diagnostics() ?? null;
  }

  setSmoothing(enabled: boolean) {
    this.session?.setSmoothing(enabled);
  }

  setBounds(visible: boolean) {
    this.session?.setBounds(visible);
  }

  async capturePhoto() {
    const canvas = this.session?.canvasElement;
    if (!canvas) return null;
    const ok = compositeView({
      output: this.photoCanvas,
      glCanvas: canvas,
      viewWidth: this.container.clientWidth,
      viewHeight: this.container.clientHeight,
    });
    if (!ok) return null;
    return canvasToBlob(this.photoCanvas);
  }

  startRecording() {
    const canvas = this.session?.canvasElement;
    if (!canvas || this.recording) return;
    this.recorder = new FrameRecorder((output) => {
      compositeView({
        output,
        glCanvas: canvas,
        viewWidth: this.container.clientWidth,
        viewHeight: this.container.clientHeight,
      });
    });
    this.recorder.start();
  }

  stopRecording() {
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder) return Promise.resolve(null);
    return recorder.stop();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.recorder?.active) void this.recorder.stop();
    this.session?.dispose();
    this.session = null;
  }
}
