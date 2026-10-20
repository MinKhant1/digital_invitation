import * as THREE from "three";
import { particleFragmentShader, particleVertexShader } from "../../shaders/particles/particleShaders";

export class DecorativeParticles {
  readonly points: THREE.Points;
  private uniforms: {
    uTime: { value: number };
    uSize: { value: number };
    uHeight: { value: number };
    uOpacity: { value: number };
    uColor: { value: THREE.Color };
  };

  constructor(count: number) {
    this.uniforms = {
      uTime: { value: 0 },
      uSize: { value: 10 },
      uHeight: { value: 0.48 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color("#f3d7a1") },
    };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.points = new THREE.Points(this.createGeometry(count), material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
  }

  private createGeometry(count: number) {
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      seeds[i * 3] = (Math.random() - 0.5) * 0.78;
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(count * 3, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    return geometry;
  }

  setCount(count: number) {
    this.points.geometry.dispose();
    this.points.geometry = this.createGeometry(Math.max(8, Math.round(count)));
  }

  setTime(time: number) {
    this.uniforms.uTime.value = time;
  }

  setOpacity(opacity: number) {
    this.uniforms.uOpacity.value = opacity;
  }

  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
