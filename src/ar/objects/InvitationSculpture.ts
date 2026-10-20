import * as THREE from "three";
import type { Font } from "three/addons/loaders/FontLoader.js";
import { eventConfig } from "../../config/event";
import type { LoadedAssets } from "../AssetLoader";
import { createCrimsonMaterial, createPearlMaterial, createTrimGoldMaterial } from "../../shaders/crimson/rubyGlow";
import { createTextLine, setLinePresentation, type TextLine } from "./textLayout";

function roundedRect(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function extrudePlate(width: number, height: number, depth: number, radius: number) {
  return new THREE.ExtrudeGeometry(roundedRect(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
    curveSegments: 6,
  });
}

export class InvitationSculpture {
  readonly group = new THREE.Group();
  private readonly lines: TextLine[] = [];
  private readonly fadeMaterials: THREE.Material[] = [];
  private readonly owned: THREE.Material[] = [];

  constructor(font: Font, assets: LoadedAssets, size: number, depth: number, curveSegments: number) {
    const gold = createTrimGoldMaterial();
    const pearl = createPearlMaterial();
    const crimson = createCrimsonMaterial();
    this.owned.push(gold, pearl, crimson);

    const back = new THREE.Mesh(extrudePlate(0.5, 0.3, 0.014, 0.022), gold);
    back.position.z = -0.008;
    const panel = new THREE.Mesh(extrudePlate(0.44, 0.24, 0.01, 0.018), pearl);
    panel.position.z = 0.006;
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.004, 0.003), crimson);
    accent.position.set(0, 0.062, 0.02);

    const corner = new THREE.OctahedronGeometry(0.012, 0);
    for (const [x, y] of [
      [-0.21, 0.12],
      [0.21, 0.12],
      [-0.21, -0.12],
      [0.21, -0.12],
    ] as const) {
      const gem = new THREE.Mesh(corner, gold);
      gem.position.set(x, y, 0.022);
      gem.scale.z = 0.45;
      this.group.add(gem);
    }

    this.group.add(back, panel, accent);
    this.fadeMaterials.push(gold, pearl, crimson);
    this.buildLines(font, size, depth, curveSegments);
    this.addLogos(assets);
  }

  rebuild(font: Font, size: number, depth: number, curveSegments: number) {
    for (const line of this.lines) {
      this.group.remove(line.mesh);
      line.mesh.geometry.dispose();
      line.material.dispose();
    }
    this.lines.length = 0;
    this.buildLines(font, size, depth, curveSegments);
  }

  private buildLines(font: Font, size: number, depth: number, curveSegments: number) {
    const specs = [
      { text: eventConfig.invitationHeading, y: 0.072, size: 0.038, color: "ruby" as const },
      { text: `${eventConfig.organization1} × ${eventConfig.organization2}`, y: 0.028, size: 0.034, color: "gold" as const },
      { text: eventConfig.eventName, y: -0.008, size: 0.026, color: "gold" as const },
      { text: eventConfig.themeLine, y: -0.04, size: 0.024, color: "ruby" as const },
    ];
    if (eventConfig.date) specs.push({ text: eventConfig.date, y: -0.052, size: 0.013, color: "gold" });
    if (eventConfig.time) specs.push({ text: eventConfig.time, y: -0.07, size: 0.012, color: "gold" });
    if (eventConfig.venue) specs.push({ text: eventConfig.venue, y: -0.088, size: 0.012, color: "gold" });

    for (const spec of specs) {
      const line = createTextLine({
        font,
        text: spec.text,
        size: spec.size * size,
        depth: depth * 0.55,
        curveSegments,
        color: spec.color,
        maxWidth: 0.38,
      });
      line.mesh.position.set(0, spec.y, 0.028);
      line.mesh.renderOrder = 8;
      this.lines.push(line);
      this.group.add(line.mesh);
    }
  }

  private addLogos(assets: LoadedAssets) {
    const yoma = this.logoPlane(assets.yoma, -0.08, -0.09);
    const prudential = this.logoPlane(assets.prudential, 0.08, -0.09);
    this.group.add(yoma, prudential);
  }

  private logoPlane(texture: THREE.Texture, x: number, y: number) {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.owned.push(material);
    this.fadeMaterials.push(material);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.055), material);
    mesh.position.set(x, y, 0.028);
    return mesh;
  }

  apply(amount: number, time: number) {
    const opacity = THREE.MathUtils.clamp(amount, 0, 1);
    this.group.visible = opacity > 0.01;
    this.group.scale.setScalar(0.86 + opacity * 0.14);
    for (const material of this.fadeMaterials) {
      material.transparent = true;
      material.opacity = opacity;
    }
    const glow = 0.65 + opacity * 0.5;
    for (const line of this.lines) setLinePresentation(line, opacity, 1.3, glow, time);
  }

  dispose() {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    for (const line of this.lines) line.material.dispose();
    for (const material of this.owned) material.dispose();
  }
}
