import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export interface SceneLights {
  group: THREE.Group;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  key: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  sweep: THREE.PointLight;
  accent: THREE.PointLight;
}

export function createSceneLights(): SceneLights {
  const group = new THREE.Group();
  const ambient = new THREE.AmbientLight(0xfff6ee, 0.26);
  const hemi = new THREE.HemisphereLight(0xfff8f1, 0x3a1218, 0.7);
  const key = new THREE.DirectionalLight(0xfff3e2, 2.25);
  key.position.set(0.2, 1.2, 1.45);
  key.target.position.set(0, 0.14, 0.02);
  const rim = new THREE.DirectionalLight(0xff2438, 1.05);
  rim.position.set(-0.9, 0.48, -0.2);
  rim.target.position.set(0, 0.16, 0);
  const fill = new THREE.DirectionalLight(0xd5e2f4, 0.4);
  fill.position.set(0.85, 0.28, 0.95);
  fill.target.position.set(0, 0.1, 0);
  const sweep = new THREE.PointLight(0xffc56b, 0, 1.8, 2);
  sweep.position.set(0, 0.24, 0.3);
  const accent = new THREE.PointLight(0xffe2b8, 1.25, 1.5, 2);
  accent.position.set(0, 0.52, 0.24);
  group.add(ambient, hemi, key, key.target, rim, rim.target, fill, fill.target, sweep, accent);
  return { group, ambient, hemi, key, rim, fill, sweep, accent };
}

export function installEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const texture = pmrem.fromScene(room, 0.04).texture;
  scene.environment = texture;
  room.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => material.dispose());
    }
  });
  pmrem.dispose();
  return texture;
}

export function applyGoldBrightness(lights: SceneLights, brightness: number, sweep: number) {
  const lift = 0.74 + brightness * 0.36;
  lights.ambient.intensity = 0.26 * lift;
  lights.hemi.intensity = 0.7 * lift;
  lights.key.intensity = 2.25 * brightness;
  lights.fill.intensity = 0.4 * brightness;
  lights.rim.intensity = 0.72 + brightness * 0.38;
  lights.accent.intensity = 1.25 * brightness;
  lights.sweep.intensity = sweep * 3.4 * brightness;
  lights.sweep.position.x = THREE.MathUtils.lerp(-0.28, 0.28, sweep);
}
