import type { ContextBridge } from "@common/ContextBridge";
import type { MetricsPayload, ConfigPayload, StatusPayload } from "@shared/types";

export declare global {
  interface Window {
    api: {
      onMetrics: (cb: (data: MetricsPayload) => void) => void;
      updateConfig: (cfg: ConfigPayload) => Promise<void>;
      onStatus: (cb: (data: StatusPayload) => void) => void;
    };
    ContextBridge: ContextBridge;
  }
}