import { BrowserWindow, ipcMain } from "electron";
import mqtt from "mqtt";
import { ConfigPayload, MetricsPayload, StatusPayload, StatusKind } from "@shared/types";

export class MqttBridge {
  private win: BrowserWindow;
  private client: mqtt.MqttClient;
  private config: ConfigPayload | null = null;

  constructor(win: BrowserWindow) {
    this.win = win;
    this.client = mqtt.connect("mqtt://broker:1883");

    this.client.on("connect", () => {
      // Subscribe to *all* topics your Python script publishes
      this.client.subscribe("ice-server3/#");

      // Send a status update that MQTT is connected
      win.webContents.send("status", {
        kind: "mqtt",
        name: "connection",
        state: "connected",
      });
    });

    // Add handlers for other MQTT events
    this.setupEventHandlers();
    
    // Set up IPC handlers
    this.setupIpcHandlers();
  }

  private setupEventHandlers() {
    this.client.on("disconnect", () => {
      this.win.webContents.send("status", {
        kind: "mqtt",
        name: "connection",
        state: "disconnected",
      });
    });

    this.client.on("message", (topic, message) => {
      // Always send raw message to MQTT Messages log
      const payload: MetricsPayload = { topic, value: message.toString() };
      this.win.webContents.send("metrics", payload);

      // Process specific topics for Status log
      const [key, subKey] = topic.split("/");

      if (key === "process_status" || key === "service_status") {
        const statusPayload: StatusPayload = {
          kind: key,
          name: subKey,
          state: message.toString(),
        };
        this.win.webContents.send("status", statusPayload);
      }

      // If it's a system metric, also send to status
      if (key === "system" && (subKey === "cpu" || subKey === "memory")) {
        const statusPayload: StatusPayload = {
          kind: subKey as StatusKind,
          name: subKey,
          state: message.toString(),
        };
        this.win.webContents.send("status", statusPayload);
      }
    });
  }

  private setupIpcHandlers() {
    // Handler for updating configuration
    ipcMain.handle("update-config", (_e, cfg: ConfigPayload) => {
      // Store the config
      this.config = cfg;
      
      // republish config so the Python script can pick it up
      this.client.publish("ice-server3/config", JSON.stringify(cfg));

      // Send a status update that config was updated
      this.win.webContents.send("status", {
        kind: "config",
        name: "update",
        state: "Configuration updated",
      });
      
      // Notify all windows that config was updated
      this.win.webContents.send("config-updated");
      
      return { success: true };
    });
    
    // Handler for getting the current configuration
    ipcMain.handle("get-config", () => {
      console.log("get-config called, returning:", this.config);
      return this.config;
    });
  }
}
