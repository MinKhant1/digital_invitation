import * as THREE from "three";
import type { MindARAnchor, MindARThreeInstance } from "mind-ar/dist/mindar-image-three.prod.js";
import { trackingConfig } from "../config/experience";

export interface TrackingCallbacks {
  onStable: () => void;
  onConcealed: () => void;
  onResumed: () => void;
  onSearchTimeout: () => void;
}

export class ImageTrackingManager {
  readonly mind: MindARThreeInstance;
  readonly anchor: MindARAnchor;
  private readonly lastMatrix = new THREE.Matrix4();
  private hasPose = false;
  private revealed = false;
  private graceActive = false;
  private concealed = false;
  private lostAt = 0;
  private stableTimer: number | null = null;
  private searchTimer: number | null = null;
  private disposed = false;

  constructor(
    mind: MindARThreeInstance,
    private readonly callbacks: TrackingCallbacks,
  ) {
    this.mind = mind;
    this.anchor = mind.addAnchor(0);
    this.anchor.onTargetFound = () => this.found();
    this.anchor.onTargetLost = () => this.lost();
    this.anchor.onTargetUpdate = () => this.updated();
  }

  armSearch() {
    this.clearSearch();
    this.searchTimer = window.setTimeout(() => {
      this.searchTimer = null;
      if (!this.revealed && !this.disposed) this.callbacks.onSearchTimeout();
    }, trackingConfig.searchTimeoutMs);
  }

  extendSearch() {
    if (this.revealed) return;
    this.armSearch();
  }

  beforeRender() {
    const group = this.anchor.group;
    group.matrixWorldNeedsUpdate = true;
    if (this.anchor.visible) {
      this.lastMatrix.copy(group.matrix);
      this.hasPose = true;
      return;
    }
    if (this.graceActive && this.hasPose && performance.now() - this.lostAt < trackingConfig.lossGraceMs) {
      group.visible = true;
      group.matrix.copy(this.lastMatrix);
      group.matrixWorldNeedsUpdate = true;
    }
  }

  dispose() {
    this.disposed = true;
    this.clearStable();
    this.clearSearch();
    this.anchor.onTargetFound = null;
    this.anchor.onTargetLost = null;
    this.anchor.onTargetUpdate = null;
  }

  private found() {
    if (this.concealed) {
      this.concealed = false;
      this.graceActive = false;
      this.callbacks.onResumed();
    } else {
      this.graceActive = false;
    }
    if (!this.revealed) this.armStable();
  }

  private lost() {
    this.clearStable();
    if (!this.revealed || !this.hasPose) return;
    this.graceActive = true;
    this.lostAt = performance.now();
    this.anchor.group.visible = true;
    this.anchor.group.matrix.copy(this.lastMatrix);
    this.anchor.group.matrixWorldNeedsUpdate = true;
  }

  private updated() {
    if (this.anchor.visible) {
      this.lastMatrix.copy(this.anchor.group.matrix);
      this.hasPose = true;
      this.anchor.group.matrixWorldNeedsUpdate = true;
      return;
    }
    if (!this.graceActive || !this.hasPose) return;
    if (performance.now() - this.lostAt < trackingConfig.lossGraceMs) {
      this.anchor.group.visible = true;
      this.anchor.group.matrix.copy(this.lastMatrix);
      this.anchor.group.matrixWorldNeedsUpdate = true;
      return;
    }
    this.graceActive = false;
    this.concealed = true;
    this.anchor.group.visible = false;
    this.callbacks.onConcealed();
  }

  private armStable() {
    if (this.stableTimer || this.revealed) return;
    this.stableTimer = window.setTimeout(() => {
      this.stableTimer = null;
      if (this.disposed || this.revealed) return;
      if (!this.anchor.visible && !this.graceActive) return;
      this.revealed = true;
      this.clearSearch();
      this.callbacks.onStable();
    }, trackingConfig.stableHoldMs);
  }

  private clearStable() {
    if (this.stableTimer === null) return;
    window.clearTimeout(this.stableTimer);
    this.stableTimer = null;
  }

  private clearSearch() {
    if (this.searchTimer === null) return;
    window.clearTimeout(this.searchTimer);
    this.searchTimer = null;
  }
}
