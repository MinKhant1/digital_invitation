import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { sceneConfig, type QualityPreset } from "../../config/experience";

function findClip(clips: THREE.AnimationClip[], names: string[]) {
  for (const name of names) {
    const clip = THREE.AnimationClip.findByName(clips, name);
    if (clip) return clip;
  }
  return null;
}

const CLOTH_NODES = new Set(["RIBBON_RedUnion", "RIBBON_WhiteUnion"]);

function withoutClothTracks(clip: THREE.AnimationClip) {
  const tracks = clip.tracks.filter((track) => !CLOTH_NODES.has(track.name.split(".")[0]));
  if (tracks.length === clip.tracks.length) return clip;
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function removeCloth(model: THREE.Object3D) {
  const cloth: THREE.Object3D[] = [];
  model.traverse((obj) => {
    if (CLOTH_NODES.has(obj.name)) cloth.push(obj);
  });
  for (const obj of cloth) {
    obj.removeFromParent();
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => material.dispose());
    });
  }
}

export class AnniversaryModel {
  readonly lift = new THREE.Group();
  readonly pivot = new THREE.Group();
  readonly unscaledHeight: number;
  private readonly mixer: THREE.AnimationMixer;
  private readonly main: THREE.AnimationAction | null;
  private readonly ambient: THREE.AnimationAction | null;
  private ambientStarted = false;
  clipNames: { reveal: string | null; ambient: string | null };

  constructor(gltf: GLTF, quality: QualityPreset) {
    const model = gltf.scene;
    removeCloth(model);
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = true;
      if (!quality.outlines && mesh.name.startsWith("HERO_Outline")) mesh.visible = false;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial;
        if (standard.isMeshStandardMaterial) {
          standard.envMapIntensity = 1.15;
          standard.needsUpdate = true;
        }
      });
    });

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.sub(center);
    this.unscaledHeight = Math.max(size.y, 0.001);
    this.pivot.add(model);
    this.lift.add(this.pivot);

    this.mixer = new THREE.AnimationMixer(model);
    const revealSource =
      findClip(gltf.animations, sceneConfig.revealClipNames) ??
      [...gltf.animations].sort((a, b) => b.duration - a.duration)[0] ??
      null;
    const revealClip = revealSource ? withoutClothTracks(revealSource) : null;
    const ambientSource =
      findClip(gltf.animations, sceneConfig.ambientClipNames) ??
      gltf.animations.find((clip) => clip !== revealSource) ??
      null;
    const ambientClip = ambientSource ? withoutClothTracks(ambientSource) : null;
    this.clipNames = {
      reveal: revealClip?.name ?? null,
      ambient: ambientClip?.name ?? null,
    };
    this.main = revealClip ? this.mixer.clipAction(revealClip) : null;
    this.ambient = ambientClip ? this.mixer.clipAction(ambientClip) : null;
    if (this.main) {
      this.main.setLoop(THREE.LoopOnce, 1);
      this.main.clampWhenFinished = true;
      this.main.play();
      this.main.paused = true;
      this.setRevealTime(0);
    }
    if (this.ambient) {
      this.ambient.setLoop(THREE.LoopRepeat, Infinity);
      this.ambient.enabled = true;
      this.ambient.setEffectiveWeight(0);
      this.ambient.paused = true;
    }
  }

  setHeight(height: number, scaleMultiplier: number) {
    const scale = (height / this.unscaledHeight) * scaleMultiplier;
    this.pivot.scale.setScalar(scale);
  }

  setRevealTime(time: number) {
    if (!this.main) return;
    this.ambientStarted = false;
    if (this.ambient) {
      this.ambient.paused = true;
      this.ambient.setEffectiveWeight(0);
    }
    this.main.enabled = true;
    this.main.setEffectiveWeight(1);
    this.main.paused = true;
    this.main.time = THREE.MathUtils.clamp(time, 0, this.main.getClip().duration);
    this.mixer.update(0);
  }

  tickAmbient(delta: number) {
    if (!this.main) return;
    this.main.paused = true;
    this.main.setEffectiveWeight(1);
    this.main.time = this.main.getClip().duration;
    if (this.ambient) {
      this.ambient.setEffectiveWeight(1);
      this.ambient.paused = false;
      if (!this.ambientStarted) {
        this.ambient.reset();
        this.ambient.play();
        this.ambientStarted = true;
      }
    }
    this.mixer.update(delta);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.pivot.clear();
  }
}
