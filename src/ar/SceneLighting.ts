import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export interface SceneLights {
  group: THREE.Group;
  ambient: THREE.AmbientLight;
  key: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  sweep: THREE.PointLight;
}

export function createSceneLights(): SceneLights {
  const group = new THREE.Group();
  const ambient = new THREE.AmbientLight(0xfff3e2, 0.42);
  const key = new THREE.DirectionalLight(0xfff1d2, 2.5);
  key.position.set(0.4, 0.75, 1.15);
  key.target.position.set(0, 0.02, 0.12);
  const rim = new THREE.DirectionalLight(0xc5163c, 0.9);
  rim.position.set(-0.85, 0.2, 0.45);
  rim.target.position.set(0, 0.05, 0.15);
  const fill = new THREE.DirectionalLight(0xf6e6c4, 0.75);
  fill.position.set(0.15, -0.55, 0.85);
  fill.target.position.set(0, 0, 0.1);
  const sweep = new THREE.PointLight(0xffc56b, 0, 1.6, 2);
  sweep.position.set(-0.28, 0.08, 0.32);
  group.add(ambient, key, key.target, rim, rim.target, fill, fill.target, sweep);
  return { group, ambient, key, rim, fill, sweep };
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
  lights.ambient.intensity = 0.42 * (0.75 + brightness * 0.35);
  lights.key.intensity = 2.5 * brightness;
  lights.fill.intensity = 0.75 * brightness;
  lights.rim.intensity = 0.9;
  lights.sweep.intensity = sweep * 4.5 * brightness;
  lights.sweep.position.x = THREE.MathUtils.lerp(-0.32, 0.32, sweep);
}
