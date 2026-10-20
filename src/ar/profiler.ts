import type * as THREE from "three";

export class FrameProfiler {
  fps = 60;
  private frames = 0;
  private last = performance.now();
  private lowStreak = 0;

  tick(renderer: THREE.WebGLRenderer, viewport: { width: number; height: number }, dprMin: number) {
    this.frames += 1;
    const now = performance.now();
    if (now - this.last < 1000) return;
    this.fps = (this.frames * 1000) / (now - this.last);
    this.frames = 0;
    this.last = now;
    const current = renderer.getPixelRatio();
    if (this.fps < 26 && current > dprMin + 0.05) {
      this.lowStreak += 1;
      if (this.lowStreak >= 2) {
        const next = Math.max(dprMin, Math.round((current - 0.25) * 100) / 100);
        renderer.setPixelRatio(next);
        renderer.setSize(viewport.width, viewport.height, false);
        this.lowStreak = 0;
      }
    } else {
      this.lowStreak = 0;
    }
  }
}
