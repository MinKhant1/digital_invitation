import type { XR8Api } from "../types/xr8";

let loading: Promise<XR8Api> | null = null;

export function loadXrEngine(): Promise<XR8Api> {
  if (window.XR8) return Promise.resolve(window.XR8);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const fail = (error: Error) => {
      loading = null;
      reject(error);
    };
    const finish = () => {
      if (!window.XR8) {
        fail(new Error("8th Wall engine did not start"));
        return;
      }
      resolve(window.XR8);
    };
    window.addEventListener("xrloaded", finish, { once: true });
    const existing = document.querySelector<HTMLScriptElement>("script[data-xr-engine]");
    if (existing) return;
    const script = document.createElement("script");
    script.src = "/xr/xr.js";
    script.async = true;
    script.dataset.xrEngine = "true";
    script.dataset.preloadChunks = "slam";
    script.onerror = () => fail(new Error("8th Wall engine failed to load"));
    document.head.appendChild(script);
  });
  return loading;
}
