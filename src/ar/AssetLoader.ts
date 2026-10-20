import * as THREE from "three";
import { FontLoader, type Font } from "three/addons/loaders/FontLoader.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { ASSETS } from "../config/assets";
import type { ExperienceErrorCode } from "../lib/errors";

export interface LoadedAssets {
  gltf: GLTF;
  font: Font;
  card: THREE.Texture;
  yoma: THREE.Texture;
  prudential: THREE.Texture;
}

export class AssetError extends Error {
  code: ExperienceErrorCode;

  constructor(code: ExperienceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

let pending: Promise<LoadedAssets> | null = null;
const progressListeners = new Set<(progress: number) => void>();

function notifyProgress(progress: number) {
  progressListeners.forEach((listener) => listener(progress));
}

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

async function loadTexture(loader: THREE.TextureLoader, url: string) {
  try {
    return configureTexture(await loader.loadAsync(url));
  } catch {
    throw new AssetError("texture", `Failed to load ${url}`);
  }
}

export function preloadAssets(onProgress?: (progress: number) => void) {
  if (onProgress) progressListeners.add(onProgress);
  if (!pending) pending = loadAll(notifyProgress);
  return pending.finally(() => {
    if (onProgress) progressListeners.delete(onProgress);
  });
}

async function loadAll(onProgress?: (progress: number) => void): Promise<LoadedAssets> {
  onProgress?.(0.05);
  const modelResponse = await fetch(ASSETS.model);
  if (!modelResponse.ok) throw new AssetError("missing-model", "five.glb did not load");
  const modelBuffer = await modelResponse.arrayBuffer();
  onProgress?.(0.35);

  const targetResponse = await fetch(ASSETS.imageTarget);
  if (!targetResponse.ok) throw new AssetError("missing-target", "invitation target did not load");
  const target = (await targetResponse.json()) as { imagePath?: string };
  if (!target.imagePath) throw new AssetError("missing-target", "invitation target is missing its image");
  const luminance = await fetch(target.imagePath);
  if (!luminance.ok) throw new AssetError("missing-target", "invitation target image did not load");
  onProgress?.(0.5);

  const gltf = await new Promise<GLTF>((resolve, reject) => {
    new GLTFLoader().parse(modelBuffer, "", resolve, () => {
      reject(new AssetError("missing-model", "five.glb could not be parsed"));
    });
  });
  onProgress?.(0.7);

  const font = await new Promise<Font>((resolve, reject) => {
    new FontLoader().load(ASSETS.font, resolve, undefined, () => {
      reject(new AssetError("texture", "The display typeface could not be loaded"));
    });
  });
  onProgress?.(0.82);

  const textures = new THREE.TextureLoader();
  const [card, yoma, prudential] = await Promise.all([
    loadTexture(textures, ASSETS.cardImage),
    loadTexture(textures, ASSETS.yomaLogo),
    loadTexture(textures, ASSETS.prudentialLogo),
  ]);
  onProgress?.(1);
  return { gltf, font, card, yoma, prudential };
}
