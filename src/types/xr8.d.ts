import type * as THREE from "three";

export interface XrPipelineModule {
  name: string;
  onStart?: () => void;
  onUpdate?: (event: {
    processCpuResult?: { reality?: { trackingStatus?: string; trackingReason?: string } };
  }) => void;
  onException?: (error: unknown) => void;
  onCameraStatusChange?: (event: { status?: string; error?: unknown; detail?: { status?: string } }) => void;
  listeners?: Array<{ event: string; process: (event: { detail?: unknown }) => void }>;
}

export interface XR8Api {
  loadChunk?: (name: string) => Promise<void>;
  addCameraPipelineModule: (module: XrPipelineModule) => void;
  removeCameraPipelineModule: (name: string) => void;
  clearCameraPipelineModules?: () => void;
  run: (options: {
    canvas: HTMLCanvasElement;
    allowedDevices?: unknown;
    cameraConfig?: { direction?: unknown };
  }) => void;
  stop: () => void;
  XrController: {
    configure: (config: { imageTargetData?: unknown[] }) => void;
    pipelineModule: () => XrPipelineModule;
  };
  Threejs: {
    pipelineModule: () => XrPipelineModule;
    xrScene: () => {
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
    };
  };
  GlTextureRenderer: {
    pipelineModule: () => XrPipelineModule;
  };
  XrConfig: {
    device: () => { MOBILE_AND_HEADSETS: unknown };
    camera: () => { BACK: unknown };
  };
}

declare global {
  interface Window {
    XR8?: XR8Api;
    THREE?: typeof import("three");
  }
}

export {};
