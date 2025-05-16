import type { ContextBridge } from "@common/ContextBridge";
import type { ConfigPayload, MetricsPayload, StatusPayload } from "@shared/types";

export declare global {
  interface Window {
    api: {
      onMetrics: (cb: (data: MetricsPayload) => void) => void;
      updateConfig: (cfg: ConfigPayload) => Promise<unknown>;
      getConfig: (cfg?: ConfigPayload) => Promise<unknown>; // Made parameter optional
      onStatus: (cb: (data: StatusPayload) => void) => void;
      onConfigUpdated: (cb: (cfg?: ConfigPayload) => void) => void; // Added this method
    };
    ContextBridge: ContextBridge;
  }
}
