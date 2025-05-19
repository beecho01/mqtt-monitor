import { ConfigPayload, MetricsPayload, StatusPayload } from "@shared/types";
import { contextBridge, ipcRenderer } from "electron";

// Define specific callback types for better type safety
type StatusCallback = (data: StatusPayload) => void;
type ConfigCallback = () => void;
type MetricsCallback = (data: MetricsPayload) => void;

// Store event handlers to enable proper removal with improved type safety
const statusHandlers = new Map<StatusCallback, (event: unknown, data: StatusPayload) => void>();
const configHandlers = new Map<ConfigCallback, () => void>();
const metricsHandlers = new Map<MetricsCallback, (event: unknown, data: MetricsPayload) => void>();

// Expose APIs to renderer
contextBridge.exposeInMainWorld("api", {
  getConfig: async () => {
    try {
      return await ipcRenderer.invoke("get-config");
    } catch (error) {
      console.error("Error getting config:", error);
      throw error;
    }
  },
  updateConfig: (config: ConfigPayload) => ipcRenderer.invoke("update-config", config),

  // Status events with proper handler tracking
  onStatus: (callback: StatusCallback) => {
    const handler = (_event: unknown, data: StatusPayload) => callback(data);
    statusHandlers.set(callback, handler);
    ipcRenderer.on("status", handler);
  },
  offStatus: (callback: StatusCallback) => {
    const handler = statusHandlers.get(callback);
    if (handler) {
      ipcRenderer.removeListener("status", handler);
      statusHandlers.delete(callback);
    }
  },

  onStatusOnce: (callback: StatusCallback) => {
    const handler = (_event: unknown, data: StatusPayload) => {
      callback(data);
      statusHandlers.delete(callback); // Auto-cleanup
    };
    statusHandlers.set(callback, handler);
    ipcRenderer.once("status", handler);
  },

  // Config update events with proper handler tracking
  onConfigUpdated: (callback: ConfigCallback) => {
    const handler = () => callback();
    configHandlers.set(callback, handler);
    ipcRenderer.on("config-updated", handler);
  },
  offConfigUpdated: (callback: ConfigCallback) => {
    const handler = configHandlers.get(callback);
    if (handler) {
      ipcRenderer.removeListener("config-updated", handler);
      configHandlers.delete(callback);
    }
  },

  // Metrics events with proper handler tracking
  onMetrics: (callback: MetricsCallback) => {
    const handler = (_event: unknown, data: MetricsPayload) => callback(data);
    metricsHandlers.set(callback, handler);
    ipcRenderer.on("metrics", handler);
  },
  offMetrics: (callback: MetricsCallback) => {
    const handler = metricsHandlers.get(callback);
    if (handler) {
      ipcRenderer.removeListener("metrics", handler);
      metricsHandlers.delete(callback);
    }
  },

  onMetricsOnce: (callback: MetricsCallback) => {
    const handler = (_event: unknown, data: MetricsPayload) => {
      callback(data);
      metricsHandlers.delete(callback); // Auto-cleanup
    };
    metricsHandlers.set(callback, handler);
    ipcRenderer.once("metrics", handler);
  },

  checkProcess: (processName: string) => ipcRenderer.invoke("check-process", processName),
  checkService: (serviceName: string) => ipcRenderer.invoke("check-service", serviceName),
  reconnectMqtt: () => ipcRenderer.invoke("mqtt-reconnect"),
  getMqttStatus: () => ipcRenderer.invoke("getMqttStatus"),
  requestSystemMetrics: () => ipcRenderer.invoke("request-system-metrics"),
  requestProcessStatus: (processNames: string[]) => ipcRenderer.invoke("request-process-status", processNames),
  requestServiceStatus: (serviceNames: string[]) => ipcRenderer.invoke("request-service-status", serviceNames),

  // Method to clean up all handlers when application is shutting down
  cleanupHandlers: () => {
    statusHandlers.forEach((handler) => {
      ipcRenderer.removeListener("status", handler);
    });
    statusHandlers.clear();
    
    configHandlers.forEach((handler) => {
      ipcRenderer.removeListener("config-updated", handler);
    });
    configHandlers.clear();
    
    metricsHandlers.forEach((handler) => {
      ipcRenderer.removeListener("metrics", handler);
    });
    metricsHandlers.clear();
  },
});

// Expose other contextBridge items
contextBridge.exposeInMainWorld("ContextBridge", {
  onNativeThemeChanged: (callback: () => void) => ipcRenderer.on("nativeThemeChanged", callback),
  themeShouldUseDarkColors: () => ipcRenderer.sendSync("themeShouldUseDarkColors"),
});

// Update the global declaration to match the implementation
declare global {
  interface Window {
    api: {
      getConfig: () => Promise<ConfigPayload>;
      updateConfig: (config: ConfigPayload) => Promise<boolean>;
      onStatus: (callback: StatusCallback) => void;
      offStatus: (callback: StatusCallback) => void;
      onStatusOnce: (callback: StatusCallback) => void;
      onConfigUpdated: (callback: ConfigCallback) => void;
      offConfigUpdated: (callback: ConfigCallback) => void;
      onMetrics: (callback: MetricsCallback) => void;
      offMetrics: (callback: MetricsCallback) => void;
      onMetricsOnce: (callback: MetricsCallback) => void;
      checkProcess: (processName: string) => Promise<unknown>;
      checkService: (serviceName: string) => Promise<unknown>;
      reconnectMqtt: () => Promise<{ initiated: boolean }>;
      getMqttStatus: () => Promise<{ connected: boolean; lastError?: string }>;
      requestSystemMetrics: () => Promise<unknown>;
      requestProcessStatus: (processNames: string[]) => Promise<unknown>;
      requestServiceStatus: (serviceNames: string[]) => Promise<unknown>;
      cleanupHandlers: () => void;
    };
    ContextBridge: {
      onNativeThemeChanged: (callback: () => void) => void;
      themeShouldUseDarkColors: () => boolean;
    };
  }
}

export type Api = Window["api"];
