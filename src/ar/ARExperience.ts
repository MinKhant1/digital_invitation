import * as THREE from "three";
import { ASSETS } from "../config/assets";
import { trackingConfig, type LiveParams, type QualityPreset } from "../config/experience";
import type { ExperienceErrorCode } from "../lib/errors";
import type { LoadedAssets } from "./AssetLoader";
import { canRecordVideo, canvasToBlob, compositeView, FrameRecorder } from "./capture";
import { ExperienceRoot } from "./ExperienceRoot";
import { ImageTrackingManager } from "./ImageTrackingManager";
import { FrameProfiler } from "./profiler";
import { installEnvironment } from "./SceneLighting";

export interface ARCallbacks {
  onScanning: () => void;
  onTracking: () => void;
  onLost: () => void;
  onRevealComplete: () => void;
  onError: (code: ExperienceErrorCode) => void;
  onSearchTimeout: () => void;
}

export class ARExperience {
  private mind: import("mind-ar/dist/mindar-image-three.prod.js").MindARThreeInstance | null = null;
  private root: ExperienceRoot | null = null;
  private tracker: ImageTrackingManager | null = null;
  private recorder: FrameRecorder | null = null;
  private environment: THREE.Texture | null = null;
  private readonly profiler = new FrameProfiler();
  private readonly clock = new THREE.Clock();
  private readonly photoCanvas = document.createElement("canvas");
  private running = false;
  private disposed = false;
  private onContextLost: ((event: Event) => void) | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly assets: LoadedAssets,
    private readonly quality: QualityPreset,
    private readonly params: LiveParams,
    private readonly callbacks: ARCallbacks,
  ) {}

  get canRecord() {
    return canRecordVideo();
  }

  get recording() {
    return Boolean(this.recorder?.active);
  }

  async start() {
    const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js");
    if (this.disposed) return;
    const mind = new MindARThree({
      container: this.container,
      imageTargetSrc: ASSETS.imageTarget,
      maxTrack: trackingConfig.maxTrack,
      filterMinCF: trackingConfig.filterMinCF,
      filterBeta: trackingConfig.filterBeta,
      warmupTolerance: trackingConfig.warmupTolerance,
      missTolerance: trackingConfig.missTolerance,
      uiLoading: "no",
      uiScanning: "no",
      uiError: "no",
    });
    this.mind = mind;
    const root = new ExperienceRoot(this.assets, this.quality, this.params);
    root.group.visible = false;
    root.onRevealComplete = () => this.callbacks.onRevealComplete();
    this.root = root;

    const tracker = new ImageTrackingManager(mind, {
      onStable: () => {
        root.group.visible = true;
        root.play();
        this.callbacks.onTracking();
      },
      onConcealed: () => {
        root.holdPlayback();
        this.callbacks.onLost();
      },
      onResumed: () => {
        root.releasePlayback();
        this.callbacks.onTracking();
      },
      onSearchTimeout: () => this.callbacks.onSearchTimeout(),
    });
    this.tracker = tracker;
    tracker.anchor.group.add(root.group);

    const renderer = mind.renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.dprMax));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    this.environment = installEnvironment(renderer, mind.scene);
    renderer.domElement.style.pointerEvents = "none";

    this.onContextLost = (event: Event) => {
      event.preventDefault();
      this.callbacks.onError("webgl-lost");
    };
    renderer.domElement.addEventListener("webglcontextlost", this.onContextLost);

    try {
      await mind.start();
    } catch (error) {
      if (!this.disposed) throw error;
      return;
    }
    if (this.disposed) {
      this.stopMind(mind);
      return;
    }
    this.running = true;
    this.clock.start();
    tracker.armSearch();
    renderer.setAnimationLoop(() => this.frame());
    this.callbacks.onScanning();
  }

  extendSearch() {
    this.tracker?.extendSearch();
  }

  replay() {
    this.root?.group && (this.root.group.visible = true);
    this.root?.replay();
  }

  async capturePhoto() {
    const mind = this.mind;
    if (!mind) return null;
    this.frame();
    const viewWidth = this.container.clientWidth;
    const viewHeight = this.container.clientHeight;
    const ok = compositeView({
      output: this.photoCanvas,
      glCanvas: mind.renderer.domElement,
      video: mind.video,
      viewWidth,
      viewHeight,
    });
    if (!ok) return null;
    return canvasToBlob(this.photoCanvas);
  }

  startRecording() {
    const mind = this.mind;
    if (!mind || this.recording) return;
    this.recorder = new FrameRecorder((canvas) => {
      compositeView({
        output: canvas,
        glCanvas: mind.renderer.domElement,
        video: mind.video,
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
    this.running = false;
    if (this.recorder?.active) void this.recorder.stop();
    this.tracker?.dispose();
    const mind = this.mind;
    if (mind) {
      mind.renderer.setAnimationLoop(null);
      if (this.onContextLost) {
        mind.renderer.domElement.removeEventListener("webglcontextlost", this.onContextLost);
      }
      this.stopMind(mind);
      mind.renderer.dispose();
    }
    this.root?.dispose();
    this.environment?.dispose();
    this.container.replaceChildren();
  }

  private frame() {
    const mind = this.mind;
    const root = this.root;
    const tracker = this.tracker;
    if (!mind || !root || !tracker || !this.running) return;
    tracker.beforeRender();
    root.update(this.clock.getDelta());
    mind.renderer.render(mind.scene, mind.camera);
    this.profiler.tick(
      mind.renderer,
      { width: this.container.clientWidth, height: this.container.clientHeight },
      this.quality.dprMin,
    );
  }

  private stopMind(mind: NonNullable<ARExperience["mind"]>) {
    try {
      if (mind.video?.srcObject) mind.stop();
    } catch {
      const stream = mind.video?.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    }
  }
}
