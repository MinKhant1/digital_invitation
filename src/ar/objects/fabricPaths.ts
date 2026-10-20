import * as THREE from "three";

export function redFabricPoints(spread: number, lift: number) {
  const s = spread;
  const l = lift;
  return [
    new THREE.Vector3(-0.52, -0.04, 0.06),
    new THREE.Vector3(-0.4 * s, 0.08, 0.14 + l),
    new THREE.Vector3(-0.16 * s, 0.24, 0.24 + l),
    new THREE.Vector3(0.08, 0.3, 0.32 + l),
    new THREE.Vector3(0.3 * s, 0.14, 0.26 + l * 0.6),
    new THREE.Vector3(0.4 * s, -0.04, 0.14),
    new THREE.Vector3(0.16 * s, -0.16, 0.08),
  ];
}

export function whiteFabricPoints(spread: number, lift: number) {
  const s = spread;
  const l = lift;
  return [
    new THREE.Vector3(0.55, 0.12, 0.06),
    new THREE.Vector3(0.46 * s, -0.02, 0.14 + l),
    new THREE.Vector3(0.36 * s, -0.16, 0.22 + l),
    new THREE.Vector3(0.24, -0.26, 0.28 + l),
    new THREE.Vector3(0.14 * s, -0.12, 0.22 + l * 0.4),
    new THREE.Vector3(0.22 * s, 0.06, 0.14),
    new THREE.Vector3(0.34, 0.18, 0.08),
  ];
}
