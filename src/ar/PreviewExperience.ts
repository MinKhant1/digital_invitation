import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CARD_HEIGHT, CARD_WIDTH } from "../config/assets";
import { CINEMATIC_DURATION, type LiveParams, type QualityPreset } from "../config/experience";
import type { LoadedAssets } from "./AssetLoader";
import { ExperienceRoot } from "./ExperienceRoot";
import { installEnvironment } from "./SceneLighting";

export class PreviewExperience {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly root: ExperienceRoot;
  private readonly gui: GUI;
  private readonly clock = new THREE.Clock();
  private readonly card: THREE.Mesh;
  private environment: THREE.Texture | null = null;
  private running = false;
  private scrubbing = false;
  private onContextLost: ((event: Event) => void) | null = null;

  constructor(
    private readonly container: HTMLElement,
    assets: LoadedAssets,
    quality: QualityPreset,
    params: LiveParams,
    private readonly onError: (message: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality.antialias,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dprMax));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x07060b, 1);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 20);
    this.camera.position.set(0, -1.25, 0.85);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.02, 0.16);
    this.controls.enableDamping = true;
    this.controls.update();

    const cardMaterial = new THREE.MeshBasicMaterial({
      map: assets.card,
      toneMapped: false,
    });
    this.card = new THREE.Mesh(new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT), cardMaterial);
    this.scene.add(this.card);

    this.root = new ExperienceRoot(assets, quality, params);
    this.root.group.visible = true;
    this.scene.add(this.root.group);
    this.environment = installEnvironment(this.renderer, this.scene);
    this.gui = this.createGui(params);
    this.resize();

    this.onContextLost = (event: Event) => {
      event.preventDefault();
      this.onError("The WebGL context was lost. Reload the preview.");
    };
    this.renderer.domElement.addEventListener("webglcontextlost", this.onContextLost);
    window.addEventListener("resize", this.resize);
  }

  start() {
    const requested = Number(new URLSearchParams(window.location.search).get("time"));
    if (Number.isFinite(requested) && requested > 0) this.root.scrub(requested);
    else this.root.play();
    this.running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  dispose() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.resize);
    if (this.onContextLost) {
      this.renderer.domElement.removeEventListener("webglcontextlost", this.onContextLost);
    }
    this.gui.destroy();
    this.controls.dispose();
    this.root.dispose();
    this.card.geometry.dispose();
    (this.card.material as THREE.Material).dispose();
    this.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.container.replaceChildren();
  }

  private frame() {
    if (!this.running) return;
    const delta = this.clock.getDelta();
    this.controls.update();
    this.root.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  private resize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
  };

  private createGui(params: LiveParams) {
    const gui = new GUI({ title: "Ignite preview" });
    const root = this.root;
    const playback = {
      play: () => root.play(),
      pause: () => root.pause(),
      resume: () => root.resume(),
      replay: () => root.replay(),
      invitation: () => root.jumpToInvitation(),
      ambient: () => root.jumpToInvitation(),
    };
    const time = { seconds: root.time };
    gui.add(playback, "play");
    gui.add(playback, "pause");
    gui.add(playback, "resume");
    gui.add(playback, "replay");
    gui.add(playback, "invitation").name("jump to invitation");
    gui.add(playback, "ambient").name("ambient loop");
    const scrubber = gui.add(time, "seconds", 0, CINEMATIC_DURATION, 0.01).name("timeline");
    scrubber.onChange((value: number) => {
      if (this.scrubbing) return;
      root.scrub(value);
    });
    root.onFrame = (value) => {
      this.scrubbing = true;
      scrubber.setValue(value);
      time.seconds = value;
      this.scrubbing = false;
    };

    const model = gui.addFolder("Model");
    model.add(params, "sceneScale", 0.45, 1.6, 0.01).onChange(() => root.applyTransforms());
    model.add(params, "modelScale", 0.4, 2, 0.01).onChange(() => root.applyTransforms());
    model.add(params, "modelHeight", 0.15, 0.8, 0.005).onChange(() => root.applyTransforms());
    model.add(params, "modelPositionX", -0.4, 0.4, 0.005).onChange(() => root.applyTransforms());
    model.add(params, "modelPositionY", -0.3, 0.4, 0.005).onChange(() => root.applyTransforms());
    model.add(params, "modelPositionZ", 0, 0.6, 0.005).onChange(() => root.applyTransforms());
    model.add(params, "modelRotationX", -Math.PI, Math.PI, 0.01).onChange(() => root.applyTransforms());
    model.add(params, "modelRotationY", -Math.PI, Math.PI, 0.01).onChange(() => root.applyTransforms());
    model.add(params, "modelRotationZ", -Math.PI, Math.PI, 0.01).onChange(() => root.applyTransforms());

    const type = gui.addFolder("Typography");
    type.add(params, "textSize", 0.6, 1.6, 0.01).onFinishChange(() => root.rebuildTypography());
    type.add(params, "textDepth", 0.002, 0.04, 0.001).onFinishChange(() => root.rebuildTypography());
    type.add(params, "igniteX", -0.3, 0.3, 0.005);
    type.add(params, "igniteY", -0.1, 0.4, 0.005);
    type.add(params, "igniteZ", 0.1, 0.8, 0.005);
    type.add(params, "anniversaryX", -0.3, 0.3, 0.005);
    type.add(params, "anniversaryY", -0.3, 0.3, 0.005);
    type.add(params, "anniversaryZ", 0.1, 0.8, 0.005);
    type.add(params, "invitationX", -0.3, 0.3, 0.005);
    type.add(params, "invitationY", -0.4, 0.2, 0.005);
    type.add(params, "invitationZ", 0.1, 0.8, 0.005);

    const look = gui.addFolder("Light");
    look.add(params, "goldBrightness", 0.2, 2, 0.01);
    look.add(params, "redGlow", 0, 2, 0.01);
    look.add(params, "particleCount", 8, 240, 1).onFinishChange(() => root.rebuildParticles());
    look.add(params, "animationSpeed", 0.1, 2, 0.01).onChange(() => root.applyTransforms());
    if (window.innerWidth < 960) gui.close();
    return gui;
  }
}
