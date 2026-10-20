declare module "mind-ar/dist/mindar-image-three.prod.js" {
  import type { Group, PerspectiveCamera, Scene, WebGLRenderer } from "three";

  export interface MindARAnchor {
    group: Group;
    targetIndex: number;
    onTargetFound: (() => void) | null;
    onTargetLost: (() => void) | null;
    onTargetUpdate: (() => void) | null;
    css: boolean;
    visible: boolean;
  }

  export interface MindARThreeInstance {
    container: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    video: HTMLVideoElement;
    anchors: MindARAnchor[];
    addAnchor: (targetIndex: number) => MindARAnchor;
    start: () => Promise<void>;
    stop: () => void;
    resize: () => void;
  }

  export const MindARThree: new (options: {
    container: HTMLElement;
    imageTargetSrc: string;
    maxTrack?: number;
    filterMinCF?: number | null;
    filterBeta?: number | null;
    warmupTolerance?: number | null;
    missTolerance?: number | null;
    uiLoading?: string;
    uiScanning?: string;
    uiError?: string;
  }) => MindARThreeInstance;
}
