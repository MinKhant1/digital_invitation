import * as THREE from "three";
import type { Font } from "three/addons/loaders/FontLoader.js";
import { eventConfig } from "../../config/event";
import { createTextLine, setLinePresentation, type TextLine } from "./textLayout";

export class AnniversaryText {
  readonly group = new THREE.Group();
  private line: TextLine | null = null;

  constructor(font: Font, size: number, depth: number, curveSegments: number) {
    this.rebuild(font, size, depth, curveSegments);
  }

  rebuild(font: Font, size: number, depth: number, curveSegments: number) {
    if (this.line) {
      this.group.remove(this.line.mesh);
      this.line.mesh.geometry.dispose();
      this.line.material.dispose();
    }
    this.line = createTextLine({
      font,
      text: eventConfig.anniversary,
      size: 0.055 * size,
      depth,
      curveSegments,
      color: "gold",
      maxWidth: 0.68,
    });
    this.group.add(this.line.mesh);
  }

  apply(opacity: number, sweep: number, glow: number, time: number) {
    if (!this.line) return;
    setLinePresentation(this.line, opacity, sweep, glow * 0.85, time);
  }

  dispose() {
    if (!this.line) return;
    this.line.mesh.geometry.dispose();
    this.line.material.dispose();
  }
}
