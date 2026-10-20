export type TrackingPhase =
  | "INITIALIZING"
  | "SEARCHING"
  | "ACQUIRING"
  | "TRACKING"
  | "TEMPORARILY_LOST"
  | "LOST"
  | "REACQUIRING";

export interface TrackingDiagnostics {
  phase: TrackingPhase;
  targetVisible: boolean;
  fps: number;
  position: string;
  rotation: string;
  poseDelta: string;
  reacquisitions: number;
  smoothing: boolean;
  bounds: boolean;
  slamStatus: string;
  slamReason: string;
  worldMode: string;
  engineFilter: string;
}

export interface ImageTargetDetail {
  name?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { w: number; x: number; y: number; z: number };
  scale?: number;
  scaledWidth?: number;
  scaledHeight?: number;
}

export interface ImageTargetRecord {
  imagePath: string;
  name: string;
  type: string;
  metadata?: { fullCardScale?: number; source?: string } | null;
  properties: {
    width: number;
    height: number;
    isRotated: boolean;
    originalWidth: number;
    originalHeight: number;
  };
}
