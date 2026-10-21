import * as THREE from "three";
import { ASSETS, CARD_HEIGHT } from "../config/assets";
import { trackingConfig, type LiveParams, type QualityPreset } from "../config/experience";
import type { ExperienceErrorCode } from "../lib/errors";
import type { XR8Api } from "../types/xr8";
import type { LoadedAssets } from "./AssetLoader";
import { ExperienceRoot } from "./ExperienceRoot";
import { loadXrEngine } from "./loadXrEngine";
import { PoseStabilizer } from "./PoseStabilizer";
import { FrameProfiler } from "./profiler";
import { installEnvironment } from "./SceneLighting";
import { TrackingDebugMarker } from "./TrackingDebugMarker";
import type { ImageTargetDetail, ImageTargetRecord, TrackingDiagnostics, TrackingPhase } from "./trackingTypes";

const TARGET_NAME = "invitation-card";

export interface TrackingSessionCallbacks {
  onPhase: (phase: TrackingPhase) => void;
  onRevealComplete: () => void;
  onError: (code: ExperienceErrorCode) => void;
  onSearchTimeout: () => void;
  onAgenda: () => void;
}

let sharedCanvas: HTMLCanvasElement | null = null;

function claimCanvas(container: HTMLElement) {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
    sharedCanvas.className = "xr-canvas";
  }
  container.appendChild(sharedCanvas);
  coverCanvas(sharedCanvas);
  return sharedCanvas;
}

function viewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, Math.round(viewport?.width ?? window.innerWidth)),
    height: Math.max(1, Math.round(viewport?.height ?? window.innerHeight)),
  };
}

function coverCanvas(canvas: HTMLCanvasElement) {
  const { width, height } = viewportSize();
  canvas.width = width;
  canvas.height = height;
}

function fullCardScale(record: ImageTargetRecord) {
  const { width, height, isRotated, originalWidth, originalHeight } = record.properties;
  const tracked = isRotated ? height : width;
  const full = isRotated ? originalHeight : originalWidth;
  if (!tracked || !full) return 1;
  return full / tracked;
}

function asDetail(event: { detail?: unknown } | ImageTargetDetail): ImageTargetDetail {
  if (event && typeof event === "object" && "detail" in event && event.detail && typeof event.detail === "object") {
    return event.detail as ImageTargetDetail;
  }
  return event as ImageTargetDetail;
}

export class EighthWallSession {
  private readonly stabilizer = new PoseStabilizer();
  private readonly profiler = new FrameProfiler();
  private readonly clock = new THREE.Clock();
  private readonly imageTargetPose = new THREE.Group();
  private readonly visualRoot = new THREE.Group();
  private readonly fit = new THREE.Group();
  private readonly rawPos = new THREE.Vector3();
  private readonly rawQuat = new THREE.Quaternion();
  private readonly previousPos = new THREE.Vector3();
  private readonly previousQuat = new THREE.Quaternion();
  private readonly smoothedWorld = new THREE.Matrix4();
  private readonly parentInverse = new THREE.Matrix4();
  private readonly localMatrix = new THREE.Matrix4();
  private readonly euler = new THREE.Euler();
  private root: ExperienceRoot | null = null;
  private marker: TrackingDebugMarker | null = null;
  private environment: THREE.Texture | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private scene: THREE.Scene | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly pickStart = new THREE.Vector2();
  private canvas: HTMLCanvasElement | null = null;
  private engine: XR8Api | null = null;
  private phase: TrackingPhase = "INITIALIZING";
  private slamStatus = "LIMITED";
  private slamReason = "INITIALIZING";
  private rawScale = 1;
  private scaledWidth = 1;
  private scaledHeight = CARD_HEIGHT;
  private cardScale = 1;
  private hasMeasurement = false;
  private hasPrevious = false;
  private anchored = false;
  private poseDelta = 0;
  private rotationDelta = 0;
  private reacquisitions = 0;
  private acquireStarted = 0;
  private reacquireStarted = 0;
  private lostAt = 0;
  private searchTimer: number | null = null;
  private fps = 0;
  private showBounds = true;
  private disposed = false;
  private mounted = false;
  private onContextLost: ((event: Event) => void) | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly assets: LoadedAssets,
    private readonly quality: QualityPreset,
    private readonly params: LiveParams,
    private readonly debugMode: boolean,
    private readonly callbacks: TrackingSessionCallbacks,
  ) {
    this.imageTargetPose.name = "ImageTargetPose";
    this.visualRoot.name = "VisualStabilizationRoot";
    this.imageTargetPose.add(this.visualRoot);
    this.visualRoot.add(this.fit);
    this.visualRoot.visible = false;
    this.container.addEventListener("pointerdown", this.onPointerDown);
    this.container.addEventListener("pointerup", this.onPointerUp);
  }

  get canvasElement() {
    return this.renderer?.domElement ?? this.canvas;
  }

  async start() {
    const record = await this.loadTarget();
    if (this.disposed) return;
    this.cardScale = fullCardScale(record);
    window.THREE = THREE;
    const XR8 = await loadXrEngine();
    if (this.disposed) return;
    this.engine = XR8;
    if (XR8.loadChunk) {
      try {
        await XR8.loadChunk("slam");
      } catch {
        // The script tag already preloads the slam chunk.
      }
    }
    if (this.disposed) return;
    const canvas = claimCanvas(this.container);
    this.canvas = canvas;
    XR8.XrController.configure({ imageTargetData: [record] });
    if (XR8.FullWindowCanvas) XR8.addCameraPipelineModule(XR8.FullWindowCanvas.pipelineModule());
    XR8.addCameraPipelineModule(XR8.GlTextureRenderer.pipelineModule());
    XR8.addCameraPipelineModule(XR8.Threejs.pipelineModule());
    XR8.addCameraPipelineModule(XR8.XrController.pipelineModule());
    XR8.addCameraPipelineModule(this.pipeline());
    this.bindViewport();
    XR8.run({
      canvas,
      allowedDevices: XR8.XrConfig.device().MOBILE_AND_HEADSETS,
      cameraConfig: { direction: XR8.XrConfig.camera().BACK },
    });
  }

  extendSearch() {
    if (this.anchored || this.disposed) return;
    this.armSearch();
  }

  replay() {
    if (!this.root) return;
    this.root.group.visible = true;
    this.visualRoot.visible = true;
    this.root.replay();
  }

  setSmoothing(enabled: boolean) {
    this.stabilizer.enabled = enabled;
  }

  setBounds(visible: boolean) {
    this.showBounds = visible;
    this.marker?.setBoundsVisible(visible);
  }

  diagnostics(): TrackingDiagnostics {
    this.euler.setFromQuaternion(this.rawQuat, "YXZ");
    return {
      phase: this.phase,
      targetVisible: this.phase === "TRACKING" || this.phase === "REACQUIRING" || this.phase === "TEMPORARILY_LOST",
      fps: Math.round(this.fps),
      position: `${this.rawPos.x.toFixed(3)}, ${this.rawPos.y.toFixed(3)}, ${this.rawPos.z.toFixed(3)}`,
      rotation: `${THREE.MathUtils.radToDeg(this.euler.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(this.euler.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(this.euler.z).toFixed(1)}°`,
      poseDelta: `${this.poseDelta.toFixed(4)} widths, ${THREE.MathUtils.radToDeg(this.rotationDelta).toFixed(2)}°`,
      reacquisitions: this.reacquisitions,
      smoothing: this.stabilizer.enabled,
      bounds: this.showBounds,
      slamStatus: this.slamStatus,
      slamReason: this.slamReason,
      worldMode: this.worldMode(),
      engineFilter: "Internal to XrController. The current configure() API has no filter toggle.",
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearSearch();
    this.container.removeEventListener("pointerdown", this.onPointerDown);
    this.container.removeEventListener("pointerup", this.onPointerUp);
    this.root?.dispose();
    this.marker?.dispose();
    if (this.scene) this.scene.environment = null;
    this.environment?.dispose();
    this.imageTargetPose.removeFromParent();
    if (this.renderer && this.onContextLost) {
      this.renderer.domElement.removeEventListener("webglcontextlost", this.onContextLost);
    }
    const XR8 = this.engine;
    if (XR8) {
      try {
        XR8.stop();
      } catch {
        // The camera is already closed.
      }
      try {
        XR8.clearCameraPipelineModules?.();
      } catch {
        XR8.removeCameraPipelineModule("anniversary-tracking");
      }
    }
    this.unbindViewport();
    this.canvas?.remove();
  }

  private readonly onViewportChange = () => this.fitCanvas();

  private bindViewport() {
    window.addEventListener("resize", this.onViewportChange);
    window.addEventListener("orientationchange", this.onViewportChange);
    window.visualViewport?.addEventListener("resize", this.onViewportChange);
  }

  private unbindViewport() {
    window.removeEventListener("resize", this.onViewportChange);
    window.removeEventListener("orientationchange", this.onViewportChange);
    window.visualViewport?.removeEventListener("resize", this.onViewportChange);
  }

  private fitCanvas() {
    const canvas = this.renderer?.domElement ?? this.canvas;
    if (!canvas || this.disposed) return;
    const { width, height } = viewportSize();
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
  }

  private pipeline() {
    return {
      name: "anniversary-tracking",
      onStart: () => this.onStart(),
      onCanvasSizeChange: () => this.fitCanvas(),
      onDeviceOrientationChange: () => this.fitCanvas(),
      onUpdate: ({ processCpuResult }: { processCpuResult?: { reality?: { trackingStatus?: string; trackingReason?: string } } }) => {
        const reality = processCpuResult?.reality;
        if (reality?.trackingStatus) this.slamStatus = reality.trackingStatus;
        if (reality?.trackingReason) this.slamReason = reality.trackingReason;
        this.frame();
      },
      onCameraStatusChange: (event: { status?: string; detail?: { status?: string } }) => {
        const status = event.status ?? event.detail?.status;
        if (status === "failed" && !this.disposed) this.callbacks.onError("camera-unavailable");
      },
      onException: () => {
        if (!this.disposed) this.callbacks.onError("webgl");
      },
      listeners: [
        { event: "reality.imagescanning", process: () => this.beginSearch() },
        { event: "reality.imagefound", process: (event: { detail?: unknown }) => this.onFound(asDetail(event)) },
        { event: "reality.imageupdated", process: (event: { detail?: unknown }) => this.onUpdated(asDetail(event)) },
        { event: "reality.imagelost", process: (event: { detail?: unknown }) => this.onImageLost(asDetail(event)) },
        {
          event: "reality.trackingstatus",
          process: (event: { detail?: unknown }) => {
            const detail = event.detail as { status?: string; reason?: string } | undefined;
            if (detail?.status) this.slamStatus = detail.status;
            if (detail?.reason) this.slamReason = detail.reason;
          },
        },
      ],
    };
  }

  private onStart() {
    if (this.disposed || this.mounted || !this.engine) return;
    const { scene, renderer, camera } = this.engine.Threejs.xrScene();
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.mounted = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.dprMax));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.classList.add("xr-canvas");
    renderer.domElement.style.pointerEvents = "none";
    this.fitCanvas();
    window.requestAnimationFrame(() => this.fitCanvas());
    this.onContextLost = (event: Event) => {
      event.preventDefault();
      if (!this.disposed) this.callbacks.onError("webgl-lost");
    };
    renderer.domElement.addEventListener("webglcontextlost", this.onContextLost);
    scene.add(this.imageTargetPose);
    if (this.debugMode) {
      this.marker = new TrackingDebugMarker();
      this.marker.setBoundsVisible(this.showBounds);
      this.visualRoot.add(this.marker.group);
    } else {
      const root = new ExperienceRoot(this.assets, this.quality, this.params);
      root.setWorldUp(new THREE.Vector3(0, 1, 0));
      root.group.visible = false;
      root.onRevealComplete = () => this.callbacks.onRevealComplete();
      this.root = root;
      this.fit.add(root.group);
      this.environment = installEnvironment(renderer, scene);
    }
    this.clock.start();
    if (this.phase === "INITIALIZING") this.beginSearch();
  }

  private onPointerDown = (event: PointerEvent) => {
    this.pickStart.set(event.clientX, event.clientY);
  };

  private onPointerUp = (event: PointerEvent) => {
    const dx = event.clientX - this.pickStart.x;
    const dy = event.clientY - this.pickStart.y;
    if (dx * dx + dy * dy > 144) return;
    const camera = this.camera;
    const root = this.root;
    if (!camera || !root) return;
    const bounds = this.container.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, camera);
    if (root.hitsAgenda(this.raycaster)) this.callbacks.onAgenda();
  };

  private beginSearch() {
    if (this.disposed || this.anchored) return;
    if (this.phase === "SEARCHING") return;
    this.phase = "SEARCHING";
    this.visualRoot.visible = false;
    this.armSearch();
    this.callbacks.onPhase(this.phase);
  }

  private onFound(detail: ImageTargetDetail) {
    if (detail.name !== TARGET_NAME) return;
    this.clearSearch();
    this.applyDetail(detail);
    if (!this.anchored) {
      this.phase = "ACQUIRING";
      this.acquireStarted = performance.now();
      this.stabilizer.reseed();
      this.callbacks.onPhase(this.phase);
      return;
    }
    this.stabilizer.reseed();
    if (this.phase !== "TRACKING") {
      this.phase = "REACQUIRING";
      this.reacquireStarted = performance.now();
      this.reacquisitions += 1;
      this.showContent();
      this.root?.releasePlayback();
      this.callbacks.onPhase(this.phase);
    }
  }

  private onUpdated(detail: ImageTargetDetail) {
    if (detail.name !== TARGET_NAME) return;
    if (this.phase === "LOST" || this.phase === "SEARCHING" || this.phase === "INITIALIZING") {
      this.onFound(detail);
      return;
    }
    this.applyDetail(detail);
  }

  private onImageLost(detail: ImageTargetDetail) {
    if (detail.name && detail.name !== TARGET_NAME) return;
    if (!this.anchored) {
      this.phase = "SEARCHING";
      this.visualRoot.visible = false;
      this.armSearch();
      this.callbacks.onPhase(this.phase);
      return;
    }
    this.root?.holdPlayback();
    if (this.slamStatus === "NORMAL") {
      this.phase = "TEMPORARILY_LOST";
      this.lostAt = performance.now();
      this.callbacks.onPhase(this.phase);
      return;
    }
    this.enterLost();
  }

  private frame() {
    if (this.disposed || !this.mounted) return;
    const now = performance.now();
    this.present(now);
    if (this.phase === "ACQUIRING" && now - this.acquireStarted >= trackingConfig.stableHoldMs) {
      this.enterTracking(true);
    }
    if (this.phase === "REACQUIRING" && now - this.reacquireStarted >= 240) {
      this.enterTracking(false);
    }
    if (this.phase === "TEMPORARILY_LOST") {
      const expired = now - this.lostAt >= trackingConfig.lossGraceMs;
      if (expired || this.slamStatus !== "NORMAL") this.enterLost();
    }
    this.root?.update(Math.min(this.clock.getDelta(), 0.05));
    if (this.renderer) {
      this.profiler.tick(
        this.renderer,
        { width: this.container.clientWidth, height: this.container.clientHeight },
        this.quality.dprMin,
      );
      this.fps = this.profiler.fps;
    }
  }

  private present(now: number) {
    if (!this.hasMeasurement) return;
    this.imageTargetPose.position.copy(this.rawPos);
    this.imageTargetPose.quaternion.copy(this.rawQuat);
    this.imageTargetPose.scale.setScalar(this.rawScale);
    this.imageTargetPose.updateMatrixWorld(true);
    this.stabilizer.observe(this.imageTargetPose.matrixWorld);
    if (!this.stabilizer.writeWorld(this.smoothedWorld, now)) return;
    this.parentInverse.copy(this.imageTargetPose.matrixWorld).invert();
    this.localMatrix.multiplyMatrices(this.parentInverse, this.smoothedWorld);
    this.localMatrix.decompose(this.visualRoot.position, this.visualRoot.quaternion, this.visualRoot.scale);
  }

  private applyDetail(detail: ImageTargetDetail) {
    if (!detail.position || !detail.rotation) return;
    this.rawPos.set(detail.position.x, detail.position.y, detail.position.z);
    this.rawQuat.set(detail.rotation.x, detail.rotation.y, detail.rotation.z, detail.rotation.w);
    this.rawScale = detail.scale && detail.scale > 0 ? detail.scale : 1;
    if (detail.scaledWidth && detail.scaledWidth > 0) this.scaledWidth = detail.scaledWidth;
    if (detail.scaledHeight && detail.scaledHeight > 0) this.scaledHeight = detail.scaledHeight;
    this.fit.scale.setScalar(this.scaledWidth * this.cardScale);
    this.marker?.setSize(this.scaledWidth, this.scaledHeight);
    this.noteMotion();
    this.hasMeasurement = true;
  }

  private noteMotion() {
    if (!this.hasPrevious) {
      this.previousPos.copy(this.rawPos);
      this.previousQuat.copy(this.rawQuat);
      this.hasPrevious = true;
      this.poseDelta = 0;
      this.rotationDelta = 0;
      return;
    }
    this.poseDelta = this.previousPos.distanceTo(this.rawPos) / Math.max(this.rawScale, 1e-4);
    this.rotationDelta = this.previousQuat.angleTo(this.rawQuat);
    this.previousPos.copy(this.rawPos);
    this.previousQuat.copy(this.rawQuat);
    if (this.phase === "ACQUIRING" && (this.poseDelta > 0.08 || this.rotationDelta > 0.12)) {
      this.acquireStarted = performance.now();
    }
  }

  private enterTracking(first: boolean) {
    this.phase = "TRACKING";
    this.anchored = true;
    this.showContent();
    if (first) this.root?.play();
    else this.root?.releasePlayback();
    this.callbacks.onPhase(this.phase);
  }

  private enterLost() {
    this.phase = "LOST";
    this.visualRoot.visible = false;
    this.root?.holdPlayback();
    this.callbacks.onPhase(this.phase);
  }

  private showContent() {
    this.visualRoot.visible = true;
    if (this.root) this.root.group.visible = true;
    if (this.marker) this.marker.group.visible = true;
  }

  private worldMode() {
    if (this.phase === "TEMPORARILY_LOST") return "SLAM is holding the last image pose";
    if (this.phase === "TRACKING" || this.phase === "REACQUIRING" || this.phase === "ACQUIRING") {
      return this.slamStatus === "NORMAL" ? "Image target inside the SLAM world" : "Image target only";
    }
    if (this.phase === "LOST") return "Scene hidden. The last pose is not being held.";
    return "Searching for the card";
  }

  private armSearch() {
    this.clearSearch();
    this.searchTimer = window.setTimeout(() => {
      this.searchTimer = null;
      if (!this.anchored && !this.disposed) this.callbacks.onSearchTimeout();
    }, trackingConfig.searchTimeoutMs);
  }

  private clearSearch() {
    if (this.searchTimer === null) return;
    window.clearTimeout(this.searchTimer);
    this.searchTimer = null;
  }

  private async loadTarget() {
    const response = await fetch(ASSETS.imageTarget);
    if (!response.ok) throw new Error("The invitation image target did not load");
    const record = (await response.json()) as ImageTargetRecord;
    if (!record.imagePath || record.name !== TARGET_NAME) {
      throw new Error("The invitation image target is invalid");
    }
    const image = await fetch(record.imagePath);
    if (!image.ok) throw new Error("The invitation luminance image did not load");
    record.imagePath = new URL(record.imagePath, window.location.href).href;
    return record;
  }
}
