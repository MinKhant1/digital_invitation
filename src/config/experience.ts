import { CARD_HEIGHT } from "./assets";

export const CINEMATIC_DURATION = 25;

export type QualityName = "low" | "medium" | "high";

export interface QualityPreset {
  name: QualityName;
  dprMax: number;
  dprMin: number;
  particles: number;
  fabricLength: number;
  fabricWidthSegments: number;
  curveSegments: number;
  outlines: boolean;
  antialias: boolean;
}

export const qualityPresets: Record<QualityName, QualityPreset> = {
  low: {
    name: "low",
    dprMax: 1.25,
    dprMin: 1,
    particles: 48,
    fabricLength: 48,
    fabricWidthSegments: 8,
    curveSegments: 2,
    outlines: false,
    antialias: false,
  },
  medium: {
    name: "medium",
    dprMax: 1.5,
    dprMin: 1,
    particles: 110,
    fabricLength: 80,
    fabricWidthSegments: 12,
    curveSegments: 3,
    outlines: false,
    antialias: true,
  },
  high: {
    name: "high",
    dprMax: 2,
    dprMin: 1.25,
    particles: 200,
    fabricLength: 112,
    fabricWidthSegments: 18,
    curveSegments: 4,
    outlines: true,
    antialias: true,
  },
};

export interface LiveParams {
  sceneScale: number;
  modelScale: number;
  modelHeight: number;
  modelPositionX: number;
  modelPositionY: number;
  modelPositionZ: number;
  modelRotationX: number;
  modelRotationY: number;
  modelRotationZ: number;
  redFabricWidth: number;
  whiteFabricWidth: number;
  fabricPathSpread: number;
  fabricPathLift: number;
  waveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  textSize: number;
  textDepth: number;
  igniteX: number;
  igniteY: number;
  igniteZ: number;
  anniversaryX: number;
  anniversaryY: number;
  anniversaryZ: number;
  invitationX: number;
  invitationY: number;
  invitationZ: number;
  goldBrightness: number;
  redGlow: number;
  particleCount: number;
  animationSpeed: number;
}

export function resolveQuality(): QualityName {
  const requested = new URLSearchParams(window.location.search).get("quality");
  if (requested === "low" || requested === "medium" || requested === "high") return requested;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return mobile ? "low" : "medium";
}

export function createLiveParams(quality: QualityPreset): LiveParams {
  return {
    sceneScale: 1,
    modelScale: 1,
    modelHeight: 0.42,
    modelPositionX: 0,
    modelPositionY: 0.06,
    modelPositionZ: 0.2,
    modelRotationX: 0,
    modelRotationY: 0,
    modelRotationZ: 0,
    redFabricWidth: 0.26,
    whiteFabricWidth: 0.24,
    fabricPathSpread: 1,
    fabricPathLift: 0,
    waveAmplitude: 0.03,
    waveFrequency: 1.15,
    waveSpeed: 0.85,
    textSize: 1,
    textDepth: 0.012,
    igniteX: 0,
    igniteY: 0.2,
    igniteZ: 0.55,
    anniversaryX: 0,
    anniversaryY: 0.08,
    anniversaryZ: 0.58,
    invitationX: 0,
    invitationY: -0.2,
    invitationZ: 0.32,
    goldBrightness: 1,
    redGlow: 1,
    particleCount: quality.particles,
    animationSpeed: 1,
  };
}

export const trackingConfig = {
  maxTrack: 1,
  // MindAR's One Euro filter. A beta near 0.01 lags far behind the phone.
  // 1000 is the library default and keeps the sculpture locked to the card.
  filterMinCF: 0.001,
  filterBeta: 1000,
  warmupTolerance: 6,
  missTolerance: 10,
  lossGraceMs: 480,
  stableHoldMs: 320,
  searchTimeoutMs: 28000,
};

export const sceneConfig = {
  cardHeight: CARD_HEIGHT,
  revealClipNames: ["IGNITE_18s_MainReveal"],
  ambientClipNames: ["AMBIENT_6s_Loop"],
  revealDuration: 18,
};

export interface MotionState {
  ringSpread: number;
  ringOpacity: number;
  traceOpacity: number;
  platformOpacity: number;
  coreScale: number;
  beamA: number;
  beamB: number;
  beamC: number;
  beamD: number;
  beamE: number;
  beamOpacity: number;
  modelLift: number;
  ambientLift: number;
  lightSweep: number;
  fabricReveal: number;
  fabricOpen: number;
  igniteOpacity: number;
  igniteSweep: number;
  igniteLift: number;
  anniversaryOpacity: number;
  anniversarySweep: number;
  anniversaryLift: number;
  invitation: number;
  particleOpacity: number;
  glow: number;
  ambientGlow: number;
}

export function createMotion(): MotionState {
  return {
    ringSpread: 0.05,
    ringOpacity: 0,
    traceOpacity: 0,
    platformOpacity: 0,
    coreScale: 0,
    beamA: 0,
    beamB: 0,
    beamC: 0,
    beamD: 0,
    beamE: 0,
    beamOpacity: 0,
    modelLift: 0,
    ambientLift: 0,
    lightSweep: 0,
    fabricReveal: 0,
    fabricOpen: 0,
    igniteOpacity: 0,
    igniteSweep: 0,
    igniteLift: -0.035,
    anniversaryOpacity: 0,
    anniversarySweep: 0,
    anniversaryLift: -0.03,
    invitation: 0,
    particleOpacity: 0,
    glow: 0.15,
    ambientGlow: 0,
  };
}
