import * as THREE from "three";
import type { Font } from "three/addons/loaders/FontLoader.js";
import { eventConfig } from "../../config/event";
import { createTextLine, setLinePresentation, type TextLine } from "./textLayout";

export class IgniteText {
  readonly group = new THREE.Group();
  private readonly lines: TextLine[] = [];

  constructor(font: Font, size: number, depth: number, curveSegments: number) {
    this.rebuild(font, size, depth, curveSegments);
  }

  rebuild(font: Font, size: number, depth: number, curveSegments: number) {
    this.clear();
    const headline = createTextLine({
      font,
      text: eventConfig.title,
      size: 0.11 * size,
      depth,
      curveSegments,
      color: "ruby",
      maxWidth: 0.72,
    });
    headline.mesh.position.y = 0.055 * size;
    const subline = createTextLine({
      font,
      text: eventConfig.subtitle,
      size: 0.046 * size,
      depth: depth * 0.8,
      curveSegments,
      color: "ruby",
      maxWidth: 0.7,
    });
    subline.mesh.position.y = -0.055 * size;
    this.lines.push(headline, subline);
    this.group.add(headline.mesh, subline.mesh);
  }

  apply(opacity: number, sweep: number, glow: number, time: number) {
    for (const line of this.lines) setLinePresentation(line, opacity, sweep, glow, time);
  }

  private clear() {
    for (const line of this.lines) {
      this.group.remove(line.mesh);
      line.mesh.geometry.dispose();
      line.material.dispose();
    }
    this.lines.length = 0;
  }

  dispose() {
    this.clear();
  }
}
