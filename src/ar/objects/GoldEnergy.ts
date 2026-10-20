import * as THREE from "three";
import type { MotionState } from "../../config/experience";
import {
  radialFragmentShader,
  radialVertexShader,
  ringFragmentShader,
  ringVertexShader,
} from "../../shaders/fresnel/fresnelShaders";

function additive(color: string) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

export class GoldEnergy {
  readonly group = new THREE.Group();
  private readonly core: THREE.Mesh;
  private readonly halo: THREE.Mesh;
  private readonly platform: THREE.Mesh;
  private readonly rings: THREE.Mesh[] = [];
  private readonly arcs: THREE.Mesh[] = [];
  private readonly arcBase: number[] = [];
  private readonly haloUniforms: { uOpacity: { value: number }; uTime: { value: number } };
  private readonly ringUniforms: { uOpacity: { value: number } }[] = [];

  constructor() {
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.018, 18, 14), additive("#fff1c9"));
    this.group.add(this.core);

    this.haloUniforms = { uOpacity: { value: 0 }, uTime: { value: 0 } };
    this.halo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.62),
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color("#f0c27a") },
          uOpacity: this.haloUniforms.uOpacity,
          uTime: this.haloUniforms.uTime,
        },
        vertexShader: radialVertexShader,
        fragmentShader: radialFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    this.halo.position.set(0, 0.04, 0.28);
    this.halo.renderOrder = 1;
    this.group.add(this.halo);

    this.platform = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 48),
      new THREE.MeshBasicMaterial({
        color: "#e7c88a",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.platform.position.z = 0.012;
    this.group.add(this.platform);

    for (let i = 0; i < 3; i += 1) {
      const uniforms = { uOpacity: { value: 0 } };
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.82, 1, 72),
        new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(i === 1 ? "#fff6df" : "#e7c27a") },
            uOpacity: uniforms.uOpacity,
          },
          vertexShader: ringVertexShader,
          fragmentShader: ringFragmentShader,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      mesh.position.z = 0.02 + i * 0.004;
      this.rings.push(mesh);
      this.ringUniforms.push(uniforms);
      this.group.add(mesh);
    }

    const arcRadii = [0.18, 0.26, 0.33];
    arcRadii.forEach((radius, index) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.0032, 6, 48, Math.PI * (1.05 + index * 0.18)),
        additive("#f6deaa"),
      );
      mesh.rotation.z = index * 0.6;
      mesh.position.z = 0.025;
      this.arcBase.push(index * 0.6);
      this.arcs.push(mesh);
      this.group.add(mesh);
    });
  }

  apply(motion: MotionState, time: number) {
    this.core.scale.setScalar(Math.max(0.001, motion.coreScale) * (1 + Math.sin(time * 2.2) * 0.06));
    (this.core.material as THREE.MeshBasicMaterial).opacity = Math.min(1, motion.coreScale) * 0.95;

    this.haloUniforms.uTime.value = time;
    this.haloUniforms.uOpacity.value = motion.glow * (0.18 + motion.igniteOpacity * 0.45);
    this.halo.scale.setScalar(0.7 + motion.glow * 0.45);

    (this.platform.material as THREE.MeshBasicMaterial).opacity = motion.platformOpacity * 0.42;
    this.platform.scale.setScalar(0.35 + motion.platformOpacity * 0.75);

    this.rings.forEach((ring, index) => {
      const spread = Math.max(0.02, motion.ringSpread * (0.22 + index * 0.2));
      ring.scale.setScalar(spread);
      ring.rotation.z = time * (0.12 + index * 0.05);
      this.ringUniforms[index].uOpacity.value = motion.ringOpacity * (0.85 - index * 0.18);
    });

    this.arcs.forEach((arc, index) => {
      (arc.material as THREE.MeshBasicMaterial).opacity = motion.traceOpacity * (0.7 - index * 0.12);
      const direction = index % 2 === 0 ? 1 : -1;
      arc.rotation.z = this.arcBase[index] + time * 0.18 * direction;
      arc.scale.setScalar(0.65 + motion.ringSpread * 0.45);
    });
  }

  dispose() {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const material = mesh.material as THREE.Material;
      material.dispose();
    });
  }
}
