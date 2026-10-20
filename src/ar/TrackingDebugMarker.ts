import * as THREE from "three";

export class TrackingDebugMarker {
  readonly group = new THREE.Group();
  private readonly plane: THREE.Mesh;
  private readonly cube: THREE.Mesh;
  private readonly axes: THREE.AxesHelper;

  constructor() {
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xe7c98a,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.cube = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x9d1834 }));
    this.cube.position.z = 0.14;
    this.axes = new THREE.AxesHelper(0.45);
    this.group.add(this.plane, this.cube, this.axes);
  }

  setSize(width: number, height: number) {
    this.plane.scale.set(Math.max(width, 0.01), Math.max(height, 0.01), 1);
  }

  setBoundsVisible(visible: boolean) {
    this.plane.visible = visible;
  }

  dispose() {
    this.plane.geometry.dispose();
    (this.plane.material as THREE.Material).dispose();
    this.cube.geometry.dispose();
    (this.cube.material as THREE.Material).dispose();
    this.axes.geometry.dispose();
    const axisMaterial = this.axes.material;
    if (Array.isArray(axisMaterial)) axisMaterial.forEach((material) => material.dispose());
    else axisMaterial.dispose();
  }
}
