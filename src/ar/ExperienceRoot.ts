import * as THREE from "three";
import {
  CINEMATIC_DURATION,
  createMotion,
  sceneConfig,
  type LiveParams,
  type QualityPreset,
} from "../config/experience";
import { createAmbientLoop } from "./animations/ambientLoop";
import { createMasterTimeline } from "./animations/createMasterTimeline";
import type { LoadedAssets } from "./AssetLoader";
import { AnniversaryModel } from "./objects/AnniversaryModel";
import { DecorativeParticles } from "./objects/DecorativeParticles";
import { GoldEnergy } from "./objects/GoldEnergy";
import { AgendaPlate, IgniteHologram } from "./objects/StageDressing";
import { applyGoldBrightness, createSceneLights, type SceneLights } from "./SceneLighting";

type Playback = "ready" | "playing" | "paused" | "ambient";

export class ExperienceRoot {
  readonly group = new THREE.Group();
  readonly lights: SceneLights;
  readonly params: LiveParams;
  readonly motion = createMotion();
  readonly model: AnniversaryModel;
  onRevealComplete: (() => void) | null = null;
  onFrame: ((time: number) => void) | null = null;
  private readonly energy: GoldEnergy;
  private readonly particles: DecorativeParticles;
  private readonly agenda: AgendaPlate;
  private readonly hologram: IgniteHologram;
  private readonly timeline;
  private ambientLoop: ReturnType<typeof createAmbientLoop> | null = null;
  private mode: Playback = "ready";
  private shaderTime = 0;
  private completed = false;
  private held = false;

  constructor(assets: LoadedAssets, quality: QualityPreset, params: LiveParams) {
    this.params = params;
    this.lights = createSceneLights();
    this.model = new AnniversaryModel(assets.gltf, quality);
    this.energy = new GoldEnergy();
    this.particles = new DecorativeParticles(params.particleCount);
    this.agenda = new AgendaPlate(assets.agenda);
    this.hologram = new IgniteHologram(assets.ignite);
    this.model.content.add(this.agenda.mesh, this.hologram.group);
    this.group.add(this.lights.group, this.energy.group, this.model.lift, this.particles.points);
    this.timeline = createMasterTimeline(this.motion, () => this.finish());
    this.applyTransforms();
    this.applyMotion(0);
  }

  get time() {
    return this.timeline.time();
  }

  get duration() {
    return CINEMATIC_DURATION;
  }

  get playback(): Playback {
    return this.mode;
  }

  play() {
    if (this.mode === "ambient" || this.time >= CINEMATIC_DURATION - 0.05) {
      this.replay();
      return;
    }
    this.mode = "playing";
    this.timeline.timeScale(this.params.animationSpeed);
    this.timeline.play();
  }

  pause() {
    if (this.mode === "playing") {
      this.timeline.pause();
      this.mode = "paused";
      return;
    }
    if (this.mode === "ambient") {
      this.ambientLoop?.pause();
      this.mode = "paused";
    }
  }

  resume() {
    if (this.mode !== "paused" || this.held) return;
    if (this.time >= CINEMATIC_DURATION - 0.001) {
      this.mode = "ambient";
      this.ambientLoop?.resume();
      return;
    }
    this.mode = "playing";
    this.timeline.resume();
  }

  holdPlayback() {
    if (this.held) return;
    this.held = true;
    this.timeline.pause();
    this.ambientLoop?.pause();
  }

  releasePlayback() {
    if (!this.held) return;
    this.held = false;
    if (this.mode === "playing") this.timeline.resume();
    if (this.mode === "ambient") this.ambientLoop?.resume();
  }

  replay() {
    this.ambientLoop?.kill();
    this.ambientLoop = null;
    this.completed = false;
    this.motion.ambientGlow = 0;
    this.motion.ambientLift = 0;
    this.mode = "playing";
    this.shaderTime = 0;
    this.timeline.pause(0);
    this.timeline.timeScale(this.params.animationSpeed);
    this.model.setRevealTime(0);
    this.timeline.play(0);
  }

  scrub(time: number) {
    this.ambientLoop?.kill();
    this.ambientLoop = null;
    this.completed = false;
    this.motion.ambientGlow = 0;
    this.motion.ambientLift = 0;
    const next = THREE.MathUtils.clamp(time, 0, CINEMATIC_DURATION);
    this.timeline.pause(next);
    this.mode = next >= CINEMATIC_DURATION - 0.001 ? "ambient" : "paused";
    if (this.mode === "ambient") this.finish();
  }

  jumpToInvitation() {
    this.scrub(CINEMATIC_DURATION);
  }

  update(delta: number) {
    if (!this.held) {
      const scaled = Math.min(Math.max(delta, 0), 0.05) * this.params.animationSpeed;
      const time = this.timeline.time();
      if (this.mode === "ambient") this.shaderTime += scaled;
      else this.shaderTime = time;
      if (time >= sceneConfig.revealDuration && (this.mode === "playing" || this.mode === "ambient")) {
        this.model.tickAmbient(scaled);
      } else {
        this.model.setRevealTime(Math.min(time, sceneConfig.revealDuration));
      }
    }
    this.applyMotion(this.shaderTime);
    this.onFrame?.(this.time);
  }

  applyTransforms() {
    const params = this.params;
    this.group.scale.setScalar(params.sceneScale);
    this.model.setHeight(params.modelHeight, params.modelScale);
    this.model.pivot.position.set(params.modelPositionX, params.modelPositionY, params.modelPositionZ);
    this.model.pivot.rotation.set(params.modelRotationX, params.modelRotationY, params.modelRotationZ);
    this.timeline.timeScale(params.animationSpeed);
    this.ambientLoop?.timeScale(params.animationSpeed);
  }

  rebuildParticles() {
    this.particles.setCount(this.params.particleCount);
  }

  hitsAgenda(raycaster: THREE.Raycaster) {
    const mesh = this.agenda.mesh;
    let node: THREE.Object3D | null = mesh;
    while (node) {
      if (!node.visible) return false;
      node = node.parent;
    }
    mesh.updateWorldMatrix(true, false);
    return raycaster.intersectObject(mesh, false).length > 0;
  }

  rebuildTypography() {
    this.applyMotion(this.shaderTime);
  }

  dispose() {
    this.timeline.kill();
    this.ambientLoop?.kill();
    this.model.dispose();
    this.energy.dispose();
    this.particles.dispose();
    this.agenda.dispose();
    this.hologram.dispose();
    this.lights.group.traverse((obj) => {
      const light = obj as THREE.Light;
      if (light.isLight) light.dispose();
    });
  }

  private finish() {
    if (this.completed) return;
    this.completed = true;
    this.mode = "ambient";
    this.ambientLoop?.kill();
    this.ambientLoop = createAmbientLoop(this.motion);
    this.ambientLoop.timeScale(this.params.animationSpeed);
    this.onRevealComplete?.();
  }

  private applyMotion(time: number) {
    const motion = this.motion;
    this.model.lift.position.z = motion.modelLift + motion.ambientLift;
    this.energy.apply(motion, time);
    this.particles.setTime(time);
    const sparkle = Math.max(motion.particleOpacity, THREE.MathUtils.smoothstep(time, 0.2, 1.1));
    this.particles.setOpacity(sparkle);
    const hologramOpacity = Math.max(motion.igniteOpacity, THREE.MathUtils.smoothstep(time, 0.2, 1.15));
    this.agenda.setOpacity(1);
    this.hologram.update(time, hologramOpacity);
    applyGoldBrightness(this.lights, this.params.goldBrightness, motion.lightSweep);
  }
}
