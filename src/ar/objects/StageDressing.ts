import * as THREE from "three";
import {
  hologramFragmentShader,
  hologramVertexShader,
  holoBeamFragmentShader,
  holoBeamVertexShader,
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
    const width = 6.6;
    const depth = width * AGENDA_ASPECT;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
      toneMapped: false,
      side: THREE.FrontSide,
    });
    this.material.polygonOffset = true;
    this.material.polygonOffsetFactor = -2;
    this.material.polygonOffsetUnits = -2;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.material);
    this.mesh.name = "agenda-plate";
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
  private readonly projector: THREE.Mesh;
  private readonly beams: THREE.Mesh;
  private readonly markMaterial: THREE.ShaderMaterial;
  private readonly projectorMaterial: THREE.ShaderMaterial;
  private readonly beamMaterial: THREE.ShaderMaterial;
  private readonly restY: number;
  private readonly light: THREE.PointLight;

  constructor(texture: THREE.Texture) {
    const width = 11;
    const height = width / IGNITE_ASPECT;
    this.restY = 10.15;
    const columnHeight = this.restY - height * 0.08;

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

    this.projectorMaterial = new THREE.ShaderMaterial({
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
      side: THREE.DoubleSide,
    });
    this.projector = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 2.55), this.projectorMaterial);
    this.projector.rotation.x = -Math.PI / 2;
    this.projector.position.y = 0.03;

    this.beamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: holoBeamVertexShader,
      fragmentShader: holoBeamFragmentShader,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      premultipliedAlpha: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.PlaneGeometry(width * 1.05, columnHeight);
    this.beams = new THREE.Mesh(beam, this.beamMaterial);
    this.beams.position.y = columnHeight * 0.5 + 0.02;
    for (let i = 1; i < 4; i += 1) {
      const copy = new THREE.Mesh(beam, this.beamMaterial);
      copy.rotation.y = (i * Math.PI) / 4;
      copy.position.y = this.beams.position.y;
      this.group.add(copy);
    }

    this.light = new THREE.PointLight(0xffc46a, 0, 11, 2);
    this.light.position.set(0, columnHeight * 0.45, 0.15);

    this.group.add(this.mark, this.projector, this.beams, this.light);
    this.group.position.copy(STAGE_MARK);
  }

  update(time: number, opacity: number) {
    const hover = Math.sin(time * 1.35) * 0.035;
    this.mark.position.y = this.restY + hover;
    this.mark.rotation.y = Math.sin(time * 0.45) * 0.04;
    this.markMaterial.uniforms.uTime.value = time;
    this.markMaterial.uniforms.uOpacity.value = opacity;
    this.projectorMaterial.uniforms.uTime.value = time;
    this.projectorMaterial.uniforms.uOpacity.value = opacity;
    this.beamMaterial.uniforms.uTime.value = time;
    this.beamMaterial.uniforms.uOpacity.value = opacity;
    this.light.intensity = opacity * 2.4;
  }

  dispose() {
    this.mark.geometry.dispose();
    this.projector.geometry.dispose();
    this.beams.geometry.dispose();
    this.markMaterial.dispose();
    this.projectorMaterial.dispose();
    this.beamMaterial.dispose();
    this.light.dispose();
  }
}
