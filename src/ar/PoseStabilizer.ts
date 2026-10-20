import * as THREE from "three";
import { trackingConfig } from "../config/experience";

function followAlpha(dt: number, cutoffHz: number) {
  const r = 2 * Math.PI * Math.max(cutoffHz, 0.01) * dt;
  return r / (r + 1);
}

/**
 * Smooths a rigid world pose for display. The engine's estimated pose is never written here.
 */
export class PoseStabilizer {
  private readonly measuredPos = new THREE.Vector3();
  private readonly measuredQuat = new THREE.Quaternion();
  private readonly measuredScale = new THREE.Vector3(1, 1, 1);
  private readonly pos = new THREE.Vector3();
  private readonly quat = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3(1, 1, 1);
  private readonly matrix = new THREE.Matrix4();
  private seeded = false;
  private shownAt = 0;
  enabled = true;

  reseed() {
    this.seeded = false;
  }

  observe(matrix: THREE.Matrix4) {
    matrix.decompose(this.measuredPos, this.measuredQuat, this.measuredScale);
    if (this.seeded) return;
    this.pos.copy(this.measuredPos);
    this.quat.copy(this.measuredQuat);
    this.scale.copy(this.measuredScale);
    this.shownAt = performance.now();
    this.seeded = true;
    this.matrix.compose(this.pos, this.quat, this.scale);
  }

  writeWorld(target: THREE.Matrix4, now: number) {
    if (!this.seeded) return false;
    if (!this.enabled) {
      this.pos.copy(this.measuredPos);
      this.quat.copy(this.measuredQuat);
      this.scale.copy(this.measuredScale);
      this.matrix.compose(this.pos, this.quat, this.scale);
      this.shownAt = now;
      target.copy(this.matrix);
      return true;
    }

    const dt = Math.min(Math.max((now - this.shownAt) / 1000, 0.001), 0.05);
    this.shownAt = now;
    const width = Math.max(this.measuredScale.x, 1e-4);
    const posError = this.pos.distanceTo(this.measuredPos) / width;
    const rotError = this.quat.angleTo(this.measuredQuat);

    if (posError > trackingConfig.snapDistance || rotError > trackingConfig.snapAngle) {
      this.pos.copy(this.measuredPos);
      this.quat.copy(this.measuredQuat);
    } else {
      const posCut = trackingConfig.positionMinHz + posError * trackingConfig.positionBeta;
      const rotCut = trackingConfig.rotationMinHz + rotError * trackingConfig.rotationBeta;
      this.pos.lerp(this.measuredPos, followAlpha(dt, posCut));
      this.quat.slerp(this.measuredQuat, followAlpha(dt, rotCut));
    }

    this.scale.copy(this.measuredScale);
    this.matrix.compose(this.pos, this.quat, this.scale);
    target.copy(this.matrix);
    return true;
  }
}
