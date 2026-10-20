import * as THREE from "three";
import {
  hologramFragmentShader,
  hologramVertexShader,
  holoRingFragmentShader,
  holoRingVertexShader,
} from "../../shaders/hologram/igniteHologram";

/** Center of the stage's circular floor, in the stage model's own coordinates. */
const STAGE_MARK = new THREE.Vector3(4.2675, 0.011, -1.524);
const IGNITE_ASPECT = 2138 / 735;
const AGENDA_ASPECT = 1639 / 922;

export class AgendaPlate {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshBasicMaterial;

  constructor(texture: THREE.Texture) {
    const width = 1.7;
    const depth = width * AGENDA_ASPECT;
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      toneMapped: true,
      side: THREE.DoubleSide,
    });
    this.material.polygonOffset = true;
    this.material.polygonOffsetFactor = -2;
    this.material.polygonOffsetUnits = -2;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(STAGE_MARK.x, STAGE_MARK.y + 0.012, 0.12 + depth / 2);
    this.mesh.frustumCulled = true;
  }

  setOpacity(opacity: number) {
    this.material.opacity = opacity;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

export class IgniteHologram {
  readonly group = new THREE.Group();
  private readonly mark: THREE.Mesh;
  private readonly ring: THREE.Mesh;
  private readonly markMaterial: THREE.ShaderMaterial;
  private readonly ringMaterial: THREE.ShaderMaterial;
  private readonly restY: number;
  private readonly light: THREE.PointLight;

  constructor(texture: THREE.Texture) {
    const width = 2.72;
    const height = width / IGNITE_ASPECT;
    this.restY = height * 0.5 + 0.72;

    this.markMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      premultipliedAlpha: true,
      side: THREE.DoubleSide,
    });
    this.mark = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.markMaterial);
    this.mark.position.y = this.restY;

    this.ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: holoRingVertexShader,
      fragmentShader: holoRingFragmentShader,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      premultipliedAlpha: true,
      blending: THREE.AdditiveBlending,
    });
    this.ring = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), this.ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;

    this.light = new THREE.PointLight(0xffc48a, 0, 1.35, 2);
    this.light.position.set(0, 0.55, 0.15);

    this.group.add(this.mark, this.ring, this.light);
    this.group.position.copy(STAGE_MARK);
  }

  update(time: number, opacity: number) {
    const hover = Math.sin(time * 1.35) * 0.045;
    this.mark.position.y = this.restY + hover;
    this.mark.rotation.y = Math.sin(time * 0.45) * 0.06;
    this.markMaterial.uniforms.uTime.value = time;
    this.markMaterial.uniforms.uOpacity.value = opacity;
    this.ringMaterial.uniforms.uTime.value = time;
    this.ringMaterial.uniforms.uOpacity.value = opacity;
    this.light.intensity = opacity * 1.35;
  }

  dispose() {
    this.mark.geometry.dispose();
    this.ring.geometry.dispose();
    this.markMaterial.dispose();
    this.ringMaterial.dispose();
    this.light.dispose();
  }
}
