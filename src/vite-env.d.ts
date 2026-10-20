/// <reference types="vite/client" />

interface HTMLCanvasElement {
  captureStream?(frameRate?: number): MediaStream;
}
