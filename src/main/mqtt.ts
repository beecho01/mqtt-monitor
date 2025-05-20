import { ConfigPayload, MetricsPayload, StatusKind, StatusPayload } from "@shared/types";
import { BrowserWindow, ipcMain } from "electron";
import mqtt from "mqtt";
import { ConfigManager } from "./configManager";
import { ProcessMonitor } from "./processMonitor";
import { ServiceMonitor } from "./serviceMonitor";
import { SystemMonitor } from "./systemMonitor";

export class MqttBridge {
  private win: BrowserWindow;
  private client: mqtt.MqttClient | null = null;
  public lastError: Error | null = null;
  private configManager: ConfigManager;
  private currentTopic: string = "";
  private processCheckInterval: NodeJS.Timeout | null = null;
  private serviceCheckInterval: NodeJS.Timeout | null = null;
  private systemCheckInterval: NodeJS.Timeout | null = null;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  public get isConnected(): boolean {
    return this.client?.connected || false;
  }

  constructor(win: BrowserWindow, configManager: ConfigManager) {
    this.win = win;
    this.configManager = configManager;

    // Connect to MQTT with current config
    this.connectToMqtt();

    // Set up IPC handlers
    this.setupIpcHandlers();

    // Set up intervals for status checks
    this.setupStatusChecks();

    // Start periodic status updates
    this.startStatusUpdates();

    // Clean up on window close
    this.win.on("closed", () => {
      this.cleanUp();
      this.stopStatusUpdates();
    });
  }

  // Method to manually trigger a connection status update
  public getConnectionStatus(): { connected: boolean; lastError?: string } {
    return {
      connected: this.client?.connected || false,
      lastError: this.lastError?.message,
    };
  }

  // Method to manually trigger a status update
  public sendStatusUpdate(): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send("status", {
        kind: "mqtt",
        state: this.client?.connected ? "connected" : "disconnected",
        details: {
          lastError: this.lastError?.message,
        },
      });
    }
  }

  // Method to publish a message to a specific topic
  public async publish(topic: string, payload: string): Promise<boolean> {
    if (this.client && this.client.connected) {
      this.client.publish(topic, payload, {}, (err) => {
        if (!err) {
          this.sendMqttStatus();
        }
      });
      this.sendStatusUpdate();
      this.sendMqttStatus();
      return true;
    }
    return false;
  }

  // Method to publish a message to a specific topic with QoS
  private connectToMqtt(): void {
    const config = this.configManager.getConfig();
    if (!config) {
      //console.log("No configuration available, MQTT connection deferred");
      this.sendConnectionStatus("not_configured");
      return;
    }

    if (this.client) {
      //console.log("Closing existing MQTT connection before reconnecting");
      this.client.end(true);
      this.client = null;
    }

    // Default MQTT URL
    let mqttUrl = "mqtt://broker:1883";
    this.currentTopic = config.topic || "default";

    // Check if the config has the required fields
    if (config && config.host) {
      const protocol = "mqtt://";
      const credentials = config.username && config.password ? `${config.username}:${config.password}@` : "";
      mqttUrl = `${protocol}${credentials}${config.host}:${config.port || 1883}`;
      //console.log(`Connecting to MQTT broker at ${config.host}:${config.port || 1883}`);
      try {
        this.client = mqtt.connect(mqttUrl, {
          clientId: `mqtt-monitor-${Math.random().toString(16).substring(2, 10)}`,
          clean: true,
          reconnectPeriod: 5000,
          connectTimeout: 10000,
        });
        this.setupEventHandlers();
      } catch (error) {
        //console.error("Error creating MQTT client:", error);
        const errMsg = error instanceof Error ? error.message : "Connection initialisation error";
        this.handleConnectionError(new Error(errMsg));
      }
    } else {
      //console.log("Incomplete MQTT configuration, cannot connect");
      this.sendConnectionStatus("not_configured");
    }
  }

  // Method to handle connection errors
  private handleConnectionError(error: Error): void {
    this.lastError = error;
    this.sendConnectionStatus("error", { lastError: error.message });
  }

  // Method to send connection status to the renderer process
  private sendConnectionStatus(state: string, details?: Record<string, unknown>): void {
    if (state === "error" && details?.lastError) {
      this.lastError = new Error(details.lastError as string);
    }
    this.win.webContents.send("status", {
      kind: "mqtt",
      state,
      details,
    });
  }

  // Method to set up event handlers for the MQTT client
  private setupEventHandlers() {
    if (!this.client) return;
    this.client.on("connect", () => {
      //console.log("Connected to MQTT broker");
      const topicFilter = `${this.currentTopic}/#`;
      this.client?.subscribe(topicFilter, (err) => {
        if (err) {
          //console.error(`Error subscribing to ${topicFilter}:`, err);
        } else {
          //console.log(`Subscribed to MQTT topic: ${topicFilter}`);
        }
      });
      this.sendConnectionStatus("connected");
      this.sendMqttStatus();
    });

    // Handle disconnection
    this.client.on("disconnect", () => {
      //console.log("Disconnected from MQTT broker");
      this.sendConnectionStatus("disconnected");
      this.sendMqttStatus();
    });

    // Handle error
    this.client.on("error", (error) => {
      //console.log("MQTT connection error:", error);
      this.handleConnectionError(error);
    });

    // Handle reconnection
    this.client.on("reconnect", () => {
      //console.log("Attempting to reconnect to MQTT broker");
      this.sendConnectionStatus("reconnecting");
    });

    // Handle message reception and forward to renderer
    this.client.on("message", (topic, message) => {
      //console.log(`MQTT message received on topic ${topic}: ${message.toString()}`);

      const payload: MetricsPayload = {
        topic,
        value: message.toString(),
        source: "mqtt",
      };
      this.win.webContents.send("metrics", payload);

      const [key, subKey] = topic.split("/");

      if (key === "process_status" || key === "service_status") {
        const statusPayload: StatusPayload = {
          kind: key as StatusKind,
          name: subKey,
          state: message.toString(),
        };
        this.win.webContents.send("status", statusPayload);
      }

      if (key === "system" && (subKey === "cpu" || subKey === "memory")) {
        const statusPayload: StatusPayload = {
          kind: subKey as StatusKind,
          name: subKey,
          state: message.toString(),
        };
        this.win.webContents.send("status", statusPayload);
      }
    });

    // Send status update on connect
    this.client.on("connect", () => {
      //console.log("MQTT connected");
      this.sendMqttStatus();
    });

    // Send status update on close
    this.client.on("close", () => {
      console.log("MQTT connection closed");
      this.sendMqttStatus();
    });

    // Send status update on error
    this.client.on("error", (err) => {
      console.error("MQTT error:", err);
      this.lastError = new Error(err.message);
      this.sendMqttStatus();
    });
  }

  // Method to set up status checks
  private setupStatusChecks(): void {
    const config = this.configManager.getConfig();
    if (this.processCheckInterval) {
      clearInterval(this.processCheckInterval);
    }
    if (this.serviceCheckInterval) {
      clearInterval(this.serviceCheckInterval);
    }
    if (this.systemCheckInterval) {
      clearInterval(this.systemCheckInterval);
    }

    // Process status check every 5 seconds
    this.processCheckInterval = setInterval(() => {
      this.updateProcessStatuses();
    }, 5000);

    // Service status check every 15 seconds
    this.serviceCheckInterval = setInterval(
      () => {
        this.updateServiceStatuses();
      },
      (config?.status_update_interval ?? 15) * 1000,
    );

    // System metrics check every 30 seconds
    this.systemCheckInterval = setInterval(() => {
      this.updateSystemStatus();
    }, 30000);
  }

  // Method to clean up resources
  private cleanUp(): void {
    if (this.processCheckInterval) {
      clearInterval(this.processCheckInterval);
      this.processCheckInterval = null;
    }

    // Clear the service check interval
    if (this.serviceCheckInterval) {
      clearInterval(this.serviceCheckInterval);
      this.serviceCheckInterval = null;
    }

    // Clear the system check interval
    if (this.systemCheckInterval) {
      clearInterval(this.systemCheckInterval);
      this.systemCheckInterval = null;
    }

    // Clear the MQTT client
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  // Method to update process statuses
  private async updateProcessStatuses() {
    const config = this.configManager.getConfig();
    if (!config || !config.process_check || !config.process_check.length) return;
    for (const processName of config.process_check) {
      try {
        const isRunning = await ProcessMonitor.checkProcess(processName);

        // Send status update to renderer
        this.win.webContents.send("status", {
          kind: "process_status",
          name: processName,
          state: isRunning ? "running" : "not running",
        });

        // Publish to MQTT if connected
        if (this.client && this.client.connected) {
          this.client.publish(
            `${this.currentTopic}/process_status/${processName}`,
            isRunning ? "running" : "not running",
          );
        }
        //console.log(`Process ${processName}: ${isRunning ? "Running" : "Not Running"}`);
      } catch (error) {
        console.error(`Error checking process ${processName}:`, error);
      }
    }
  }

  // Method to update service statuses
  private async updateServiceStatuses() {
    const config = this.configManager.getConfig();
    if (!config || !config.service_check || !config.service_check.length) return;
    for (const serviceName of config.service_check) {
      try {
        const serviceStatus = await ServiceMonitor.checkService(serviceName);

        // Send status update
        this.win.webContents.send("status", {
          kind: "service_status",
          name: serviceName,
          state: serviceStatus.state,
          details: {
            displayName: serviceStatus.displayName,
            description: serviceStatus.description,
          },
        });

        // Publish to MQTT if connected
        if (this.client && this.client.connected) {
          this.client.publish(`${this.currentTopic}/service_status/${serviceName}`, serviceStatus.state);
        }
        //console.log(`Service ${serviceName}: ${serviceStatus.state}`);
      } catch (error) {
        console.error(`Error checking service ${serviceName}:`, error);
      }
    }
  }

  private async updateSystemStatus(): Promise<void> {
    try {
      // Get current config
      const config = this.configManager.getConfig();
      if (!config) return;

      // Use SystemMonitor to get system metrics
      const systemInfo = await SystemMonitor.getSystemInfo();

      // Format the metrics
      const cpuPercentage = Math.round(systemInfo.cpu);
      const memPercentage = Math.round(systemInfo.memory);
      const diskInfo = systemInfo.disks;

      // Send CPU metrics (only if enabled)
      if (config.cpu_enabled !== false) {
        this.win.webContents.send("status", {
          kind: "system",
          name: "cpu",
          state: `${cpuPercentage}%`,
        });

        // Publish to MQTT if connected
        if (this.client && this.client.connected) {
          const cpuTopic = `${this.currentTopic}/system/cpu`;
          this.client.publish(cpuTopic, `${cpuPercentage}%`);
          this.win.webContents.send("metrics", {
            topic: cpuTopic,
            value: `${cpuPercentage}%`,
            source: "mqtt",
          });
        }
      }

      // Send Memory metrics (only if enabled)
      if (config.memory_enabled !== false) {
        this.win.webContents.send("status", {
          kind: "system",
          name: "memory",
          state: `${memPercentage}%`,
        });

        // Publish to MQTT if connected
        if (this.client && this.client.connected) {
          const memoryTopic = `${this.currentTopic}/system/memory`;
          this.client.publish(memoryTopic, `${memPercentage}%`);
          this.win.webContents.send("metrics", {
            topic: memoryTopic,
            value: `${memPercentage}%`,
            source: "mqtt",
          });
        }
      }

      // Send Disk metrics (only if enabled)
      if (config.disk_enabled !== false) {
        diskInfo.forEach((drive) => {
          this.win.webContents.send("status", {
            kind: "system",
            name: `disk_${drive.drive}`,
            state: `${Math.round(drive.percentUsed)}%`,
            details: {
              drive: drive.drive,
              total: drive.total,
              used: drive.used,
              free: drive.free,
            },
          });

          // Publish to MQTT if connected
          if (this.client && this.client.connected) {
            const diskTopic = `${this.currentTopic}/system/disk/${drive.drive}`;
            const percentUsed = Math.round(drive.percentUsed);

            // Publish the disk usage percentage
            this.client.publish(diskTopic, `${percentUsed}%`);
            this.win.webContents.send("metrics", {
              topic: diskTopic,
              value: `${percentUsed}%`,
              source: "mqtt",
            });
          }
        });
      }
    } catch (error) {
      console.error("Error updating system status:", error);
    }
  }

  // Method to set up IPC handlers
  private setupIpcHandlers() {
    ipcMain.handle("update-config", (_e, cfg: ConfigPayload) => {
      console.log("Config update received:", cfg);

      // Validate the config
      this.configManager.saveConfig(cfg);

      // Update the current topic
      this.connectToMqtt();

      // Set up status checks based on the new config
      this.setupStatusChecks();

      // Send status update to renderer
      if (this.client && this.client.connected) {
        this.client.publish(`${cfg.topic}/config`, JSON.stringify(cfg));

        // Publish to MQTT
        this.win.webContents.send("status", {
          kind: "config",
          name: "update",
          state: "Configuration updated and published",
        });
      } else {
        // If not connected, just save the config
        this.win.webContents.send("status", {
          kind: "config",
          name: "update",
          state: "Configuration saved but not published (no connection)",
        });
      }

      // Send updated config to renderer
      this.win.webContents.send("config-updated");
      return { success: true };
    });

    // Handle request for current config
    ipcMain.handle("get-config", () => {
      const config = this.configManager.getConfig();
      //console.log("get-config called, returning:", config);
      return config;
    });

    // Handle request for MQTT status
    ipcMain.handle("mqtt-reconnect", () => {
      //console.log("Manual MQTT reconnection requested");
      this.connectToMqtt();
      return { initiated: true };
    });
  }

  // Add this method to start regular status updates
  private startStatusUpdates(): void {
    this.stopStatusUpdates(); // Clear any existing interval

    // Send status every 5 seconds
    this.statusUpdateInterval = setInterval(() => {
      this.sendMqttStatus();
    }, 5000);

    // Send initial status
    this.sendMqttStatus();
  }

  // Stop the updates when no longer needed
  private stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);

      // Set to null to avoid memory leaks
      this.statusUpdateInterval = null;
    }
  }

  // Method to send current status to the renderer
  private sendMqttStatus(): void {
    if (this.win && !this.win.isDestroyed()) {
      // Send MQTT connection status
      this.win.webContents.send("status", {
        kind: "mqtt",
        name: "mqtt-connection",
        state: this.client?.connected ? "connected" : "disconnected",
        details: {
          lastError: this.lastError,
        },
      });
    }
  }
}
