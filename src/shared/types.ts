export interface MetricsPayload {
  topic: string;
  value: string;
  source?: "mqtt" | "system"; // Add source property to distinguish between MQTT and system metrics
}

export interface ConfigPayload {
  host: string;
  port: number;
  topic: string;
  username: string;
  password: string;
  status_update_interval: number;
  mqtt_reconnect_min_delay: number;
  mqtt_reconnect_max_delay: number;
  process_check: string[];
  service_check: string[];
  cpu_enabled: boolean;
  memory_enabled: boolean;
  disk_enabled: boolean;
}

// Process and Service Status types used across components
export interface ProcessStatus {
  name: string;
  status: string;
  displayName?: string;
  description?: string;
  details?: Record<string, unknown>;
}

export interface ServiceStatus {
  name: string;
  status: string;
  displayName?: string;
  description?: string;
  details?: Record<string, unknown>;
}

// Status update types for IPC communications
export type StatusKind = "process_status" | "service_status" | "system" | "mqtt" | "config";

export interface StatusPayload {
  kind: StatusKind;
  name: string;
  state: "running" | "not running" | "stopped" | "paused" | "pending" | string;
  details?: {
    displayName?: string;
    description?: string;
    [key: string]: unknown;
  };
}
