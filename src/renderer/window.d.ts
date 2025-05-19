import type { ContextBridge } from "@common/ContextBridge";
import { ConfigPayload, MetricsPayload, StatusPayload } from "@shared/types";

export declare global {
  interface Window {
    api: {
      getConfig: () => Promise<ConfigPayload>;
      updateConfig: (config: ConfigPayload) => Promise<void>;
      onStatus: (callback: (data: StatusPayload) => void) => void;
      offStatus: (callback: (data: StatusPayload) => void) => void;
      onConfigUpdated: (callback: () => void) => void;
      offConfigUpdated: (callback: () => void) => void;
      onMetrics: (callback: (data: MetricsPayload) => void) => void;
      offMetrics: (callback: (data: MetricsPayload) => void) => void;
      checkProcess: (processName: string) => Promise<boolean>;
      checkService: (serviceName: string) => Promise<{ state: string; displayName?: string; description?: string }>;
      getMqttStatus: () => Promise<{ connected: boolean; lastError?: string }>;
      requestSystemMetrics: () => Promise<void>;
      requestProcessStatus: (processNames: string[]) => Promise<boolean>;
      requestServiceStatus: (serviceNames: string[]) => Promise<boolean>;
    };
    ContextBridge: ContextBridge;
  }
}
