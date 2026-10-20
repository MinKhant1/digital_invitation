import * as THREE from "three";
import { attachSweep, type SweepUniforms } from "../gold/goldSweep";

export function createRubyMaterial(): { material: THREE.MeshPhysicalMaterial; uniforms: SweepUniforms } {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#7a1028"),
    metalness: 0.62,
    roughness: 0.28,
    emissive: new THREE.Color("#ff2442"),
    emissiveIntensity: 0.72,
    clearcoat: 0.72,
    clearcoatRoughness: 0.24,
    reflectivity: 0.7,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const uniforms = attachSweep(material, new THREE.Color("#ff5a6e"), "ruby");
  return { material, uniforms };
}

export function createGoldMaterial(): { material: THREE.MeshPhysicalMaterial; uniforms: SweepUniforms } {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d4b06a"),
    metalness: 1,
    roughness: 0.2,
    emissive: new THREE.Color("#5a3d12"),
    emissiveIntensity: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    reflectivity: 1,
    envMapIntensity: 1.35,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const uniforms = attachSweep(material, new THREE.Color("#ffe1a8"), "gold");
  return { material, uniforms };
}

export function createPearlMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#f6f1e8"),
    metalness: 0.06,
    roughness: 0.38,
    clearcoat: 0.65,
    clearcoatRoughness: 0.28,
    sheen: 0.45,
    sheenColor: new THREE.Color("#f4e2c0"),
    sheenRoughness: 0.45,
    envMapIntensity: 0.8,
  });
}

export function createTrimGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#c6a15b"),
    metalness: 1,
    roughness: 0.22,
    emissive: new THREE.Color("#3d2a0c"),
    emissiveIntensity: 0.18,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.25,
  });
}

export function createCrimsonMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#8d1534"),
    metalness: 0.42,
    roughness: 0.34,
    emissive: new THREE.Color("#4a0716"),
    emissiveIntensity: 0.35,
    clearcoat: 0.4,
    envMapIntensity: 0.7,
  });
}
