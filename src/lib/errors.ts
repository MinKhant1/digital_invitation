export type ExperienceErrorCode =
  | "camera-denied"
  | "camera-unavailable"
  | "unsupported"
  | "missing-target"
  | "missing-model"
  | "texture"
  | "webgl"
  | "tracking-missing"
  | "webgl-lost";

export const ERROR_COPY: Record<ExperienceErrorCode, { title: string; body: string }> = {
  "camera-denied": {
    title: "Camera access is needed",
    body: "Allow camera access in your browser settings, then return and begin again. The invitation appears on the physical card.",
  },
  "camera-unavailable": {
    title: "No camera could be opened",
    body: "Connect a camera, close other apps that may be using it, and try again.",
  },
  unsupported: {
    title: "This browser cannot run the experience",
    body: "Open the invitation in Safari on iPhone or Chrome on Android. A WebGL-capable browser with camera access is required.",
  },
  "missing-target": {
    title: "The tracking target is missing",
    body: "The compiled invitation target could not be loaded. Refresh the page. If this continues, the tracking file was not deployed.",
  },
  "missing-model": {
    title: "The anniversary sculpture is missing",
    body: "The golden number 5 could not be loaded. Refresh the page and try again.",
  },
  texture: {
    title: "Artwork failed to load",
    body: "A brand image or the invitation card artwork did not load. Check the connection and try again.",
  },
  webgl: {
    title: "Graphics could not start",
    body: "WebGL is unavailable or the graphics context could not be created. Try another browser or restart the device.",
  },
  "tracking-missing": {
    title: "The invitation card was not found",
    body: "Fill the frame with the printed card, hold steady, and avoid glare. The camera must see the same artwork used to create the tracking target.",
  },
  "webgl-lost": {
    title: "Graphics were interrupted",
    body: "The WebGL context was lost. Return to the introduction and begin the experience again.",
  },
};

export function cameraErrorCode(error: unknown): ExperienceErrorCode {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return "camera-denied";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") {
    return "camera-unavailable";
  }
  return "camera-unavailable";
}

export function browserCanAttemptAR() {
  const canvas = document.createElement("canvas");
  const webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  const media = Boolean(navigator.mediaDevices?.getUserMedia);
  return { webgl, media };
}
