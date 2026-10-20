import * as THREE from "three";
import type { Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import type { SweepUniforms } from "../../shaders/gold/goldSweep";
import { createGoldMaterial, createRubyMaterial } from "../../shaders/crimson/rubyGlow";

export interface TextLineOptions {
  font: Font;
  text: string;
  size: number;
  depth: number;
  curveSegments: number;
  color: "ruby" | "gold";
  maxWidth?: number;
}

export interface TextLine {
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  uniforms: SweepUniforms;
}

export function createTextLine(options: TextLineOptions): TextLine {
  const geometry = new TextGeometry(options.text, {
    font: options.font,
    size: options.size,
    // TextGeometry copies `height` onto `depth`. Passing depth alone is overwritten with 50.
    height: options.depth,
    curveSegments: options.curveSegments,
    bevelEnabled: true,
    bevelThickness: options.depth * 0.22,
    bevelSize: options.size * 0.012,
    bevelOffset: 0,
    bevelSegments: 1,
  });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box) {
    const center = box.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
  }
  geometry.computeBoundingBox();
  const made = options.color === "ruby" ? createRubyMaterial() : createGoldMaterial();
  const bounds = geometry.boundingBox;
  if (bounds) {
    made.uniforms.uBoxMin.value = bounds.min.x;
    made.uniforms.uBoxMax.value = bounds.max.x;
  }
  const mesh = new THREE.Mesh(geometry, made.material);
  mesh.name = `text:${options.text}`;
  mesh.renderOrder = 5;
  if (options.maxWidth && bounds) {
    const width = bounds.max.x - bounds.min.x;
    if (width > options.maxWidth) {
      const scale = options.maxWidth / width;
      mesh.scale.setScalar(scale);
    }
  }
  return { mesh, material: made.material, uniforms: made.uniforms };
}

export function setLinePresentation(line: TextLine, opacity: number, sweep: number, glow: number, time: number) {
  line.material.opacity = opacity;
  line.material.depthWrite = opacity > 0.92;
  line.uniforms.uSweep.value = sweep;
  line.uniforms.uGlow.value = glow;
  line.uniforms.uTime.value = time;
  line.mesh.visible = opacity > 0.01 || sweep > 0.02;
}
