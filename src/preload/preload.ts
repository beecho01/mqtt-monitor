import type { ContextBridge } from "@common/ContextBridge";
import { ConfigPayload, MetricsPayload, StatusPayload } from "@shared/types";
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ContextBridge", <ContextBridge>{
  onNativeThemeChanged: (callback: () => void) => ipcRenderer.on("nativeThemeChanged", callback),
  themeShouldUseDarkColors: () => ipcRenderer.sendSync("themeShouldUseDarkColors"),
});

contextBridge.exposeInMainWorld("api", {
  onMetrics: (cb: (data: MetricsPayload) => void) => ipcRenderer.on("metrics", (_e, d) => cb(d)),
  updateConfig: (cfg: ConfigPayload) => ipcRenderer.invoke("update-config", cfg),
  getConfig: (cfg: ConfigPayload) => ipcRenderer.invoke("get-config", cfg),
  onStatus: (cb: (data: StatusPayload) => void) => ipcRenderer.on("status", (_e, d) => cb(d)),
  onConfigUpdated: (cb: (cfg: ConfigPayload) => void) => ipcRenderer.on("config-updated", (_e, cfg) => cb(cfg)),
});

declare global {
  interface Window {
    api: {
      onMetrics: (cb: (data: MetricsPayload) => void) => void;
      updateConfig: (cfg: ConfigPayload) => Promise<unknown>;
      getConfig: (cfg: ConfigPayload) => Promise<unknown>;
      onStatus: (cb: (data: StatusPayload) => void) => void;
      onConfigUpdated: (cb: () => void) => void;
    };
    ContextBridge: ContextBridge;
  }
}

export type Api = Window["api"];
