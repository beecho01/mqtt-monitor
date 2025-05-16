export interface MetricsPayload {
  topic: string;
  value: string;
}

export interface ConfigPayload {
  host: string;
  port: number;
  topic: string;
  // Any other properties your config might need
}

export type StatusKind = "process_status" | "service_status";

export interface StatusPayload {
  kind: StatusKind; // which table to update
  name: string; // executable / service name
  state: "running" | "not_running" | "stopped" | "paused" | string;
}
