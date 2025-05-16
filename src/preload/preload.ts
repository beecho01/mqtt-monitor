import type { ContextBridge } from "@common/ContextBridge";
import { contextBridge, ipcRenderer } from "electron";
import { ConfigPayload, MetricsPayload, StatusPayload } from "@shared/types";

contextBridge.exposeInMainWorld("ContextBridge", <ContextBridge>{
  onNativeThemeChanged: (callback: () => void) => ipcRenderer.on("nativeThemeChanged", callback),
  themeShouldUseDarkColors: () => ipcRenderer.sendSync("themeShouldUseDarkColors"),
});

contextBridge.exposeInMainWorld("api", {
  onMetrics: (cb: (data: MetricsPayload) => void) => ipcRenderer.on("metrics", (_e, d) => cb(d)),

  updateConfig: (cfg: ConfigPayload) => ipcRenderer.invoke("update-config", cfg),

  onStatus: (cb: (data: StatusPayload) => void) => ipcRenderer.on('status', (_e, d) => cb(d)),
});

declare global {
  interface Window {
    api: {
      onMetrics: (cb: (data: MetricsPayload) => void) => void;
      updateConfig: (cfg: ConfigPayload) => Promise<unknown>;
      onStatus: (cb: (data: StatusPayload) => void) => void;
    };
    ContextBridge: ContextBridge;
  }
}

export type Api = Window['api'];
