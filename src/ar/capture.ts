export function coverSourceRect(
  videoWidth: number,
  videoHeight: number,
  viewWidth: number,
  viewHeight: number,
) {
  const videoAspect = videoWidth / videoHeight;
  const viewAspect = viewWidth / viewHeight;
  let sx = 0;
  let sy = 0;
  let sw = videoWidth;
  let sh = videoHeight;
  if (videoAspect > viewAspect) {
    sw = videoHeight * viewAspect;
    sx = (videoWidth - sw) / 2;
  } else {
    sh = videoWidth / viewAspect;
    sy = (videoHeight - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

export function compositeView(options: {
  output: HTMLCanvasElement;
  glCanvas: HTMLCanvasElement;
  video?: HTMLVideoElement | null;
  viewWidth: number;
  viewHeight: number;
}) {
  const { output, glCanvas, video } = options;
  const width = glCanvas.width || options.viewWidth;
  const height = glCanvas.height || options.viewHeight;
  if (width < 2 || height < 2) return false;
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) return false;
  if (video && video.readyState >= 2 && video.videoWidth > 0) {
    const crop = coverSourceRect(video.videoWidth, video.videoHeight, options.viewWidth, options.viewHeight);
    context.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  } else {
    context.fillStyle = "#09080d";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(glCanvas, 0, 0, width, height);
  return true;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
}

export function canRecordVideo() {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function"
  );
}

export function preferredVideoMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export class FrameRecorder {
  active = false;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private canvas = document.createElement("canvas");
  private frame = 0;

  constructor(private readonly draw: (canvas: HTMLCanvasElement) => void) {}

  start() {
    if (!canRecordVideo() || !this.canvas.captureStream) {
      throw new Error("Recording is not supported on this device");
    }
    this.draw(this.canvas);
    const mimeType = preferredVideoMime();
    const stream = this.canvas.captureStream(30);
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start(250);
    this.active = true;
    const loop = () => {
      if (!this.active) return;
      this.draw(this.canvas);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.frame);
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder) return Promise.resolve(null);
    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "video/webm";
        resolve(this.chunks.length ? new Blob(this.chunks, { type }) : null);
        recorder.stream.getTracks().forEach((track) => track.stop());
      };
      if (recorder.state !== "inactive") recorder.stop();
      else resolve(null);
    });
  }
}

export async function saveBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  const shareData = { files: [file], title: filename };
  if (typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded" as const;
}

export function extensionForBlob(blob: Blob) {
  if (blob.type.includes("png")) return "png";
  if (blob.type.includes("mp4")) return "mp4";
  if (blob.type.includes("webm")) return "webm";
  if (blob.type.includes("jpeg") || blob.type.includes("jpg")) return "jpg";
  return "bin";
}
