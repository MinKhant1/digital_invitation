import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
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
  /** Stage content in the model's original coordinates. */
  readonly content: THREE.Object3D;
  readonly unscaledHeight: number;
  private readonly unscaledWidth: number;
  private readonly unscaledDepth: number;
  private readonly mixer: THREE.AnimationMixer;
  private readonly main: THREE.AnimationAction | null;
  private readonly ambient: THREE.AnimationAction | null;
  private ambientStarted = false;
  clipNames: { reveal: string | null; ambient: string | null };

  constructor(gltf: GLTF, quality: QualityPreset) {
    const model = gltf.scene;
    removeCloth(model);
    model.updateMatrixWorld(true);
    consolidateStage(model);
    if (!quality.outlines) {
      model.traverse((obj) => {
        if (obj.name.startsWith("HERO_Outline")) obj.visible = false;
      });
    }

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -bounds.min.y, -center.z);
    this.content = model;
    this.unscaledWidth = Math.max(size.x, 0.001);
    this.unscaledHeight = Math.max(size.y, 0.001);
    this.unscaledDepth = Math.max(size.z, 0.001);
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
    const fitted = Math.min(0.96 / this.unscaledWidth, 0.52 / this.unscaledDepth);
    const scale = fitted * scaleMultiplier * (height / 0.42);
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

const STAGE_LIMIT = {
  min: new THREE.Vector3(-0.2, -1.7, -4.4),
  max: new THREE.Vector3(9, 4.3, 0.5),
};

function isStagePiece(mesh: THREE.Mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  if (box.isEmpty()) return false;
  const size = box.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (extent > 9 || extent < 0.0001) return false;
  return (
    box.min.x >= STAGE_LIMIT.min.x &&
    box.max.x <= STAGE_LIMIT.max.x &&
    box.min.y >= STAGE_LIMIT.min.y &&
    box.max.y <= STAGE_LIMIT.max.y &&
    box.min.z >= STAGE_LIMIT.min.z &&
    box.max.z <= STAGE_LIMIT.max.z
  );
}

function stageMaterial(source: THREE.Material) {
  const standard = source as THREE.MeshStandardMaterial;
  const material = new THREE.MeshStandardMaterial({
    color: standard.color ? standard.color.clone() : new THREE.Color("#d7d2cc"),
    map: standard.map ?? null,
    roughness: standard.map ? 0.48 : 0.62,
    metalness: standard.map ? 0.08 : 0.14,
    envMapIntensity: 1.05,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `
        #include <emissivemap_fragment>
        float stageRim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.2);
        totalEmissiveRadiance += vec3(0.72, 0.1, 0.12) * stageRim * 0.42;
      `,
    );
  };
  return material;
}

function prepareGeometry(source: THREE.BufferGeometry) {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  for (const name of Object.keys(geometry.attributes)) {
    if (name !== "position" && name !== "normal" && name !== "uv") geometry.deleteAttribute(name);
  }
  if (!geometry.getAttribute("uv")) {
    const count = geometry.getAttribute("position").count;
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  return geometry;
}

function consolidateStage(model: THREE.Object3D) {
  const buckets = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[] }>();
  const removed: THREE.Mesh[] = [];
  const dropped: THREE.Mesh[] = [];
  model.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!isStagePiece(mesh)) {
      dropped.push(mesh);
      return;
    }
    const source = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    const color = source.color ? source.color.getHexString() : "ffffff";
    const map = source.map?.uuid ?? "";
    const key = `${color}|${map}`;
    const geometry = prepareGeometry(mesh.geometry);
    geometry.applyMatrix4(mesh.matrixWorld);
    const bucket = buckets.get(key);
    if (bucket) bucket.geometries.push(geometry);
    else buckets.set(key, { material: stageMaterial(source), geometries: [geometry] });
    removed.push(mesh);
  });

  for (const mesh of [...removed, ...dropped].reverse()) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }

  for (const bucket of buckets.values()) {
    const merged = mergeGeometries(bucket.geometries, false);
    bucket.geometries.forEach((geometry) => geometry.dispose());
    if (!merged) continue;
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.frustumCulled = true;
    model.add(mesh);
  }
}
