import { ConfigPayload, MetricsPayload, StatusPayload, StatusKind } from "@shared/types";
import { BrowserWindow, ipcMain } from "electron";
import mqtt from "mqtt";

export class MqttBridge {
  private win: BrowserWindow;
  private client = mqtt.connect("mqtt://broker:1883");

  constructor(win: BrowserWindow) {
    this.win = win;

    this.client.on("connect", () => {
      // Subscribe to *all* topics your Python script publishes
      this.client.subscribe("ice-server3/#");
      
      // Send a status update that MQTT is connected
      win.webContents.send("status", { 
        kind: "mqtt", 
        name: "connection", 
        state: "connected" 
      });
    });
    
    this.client.on("disconnect", () => {
      win.webContents.send("status", { 
        kind: "mqtt", 
        name: "connection", 
        state: "disconnected" 
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
          state: message.toString() 
        };
        win.webContents.send("status", statusPayload);
      }
      
      // If it's a system metric, also send to status
      if (key === "system" && (subKey === "cpu" || subKey === "memory")) {
        const statusPayload: StatusPayload = { 
          kind: subKey as StatusKind,
          name: subKey, 
          state: message.toString() 
        };
        win.webContents.send("status", statusPayload);
      }
    });

    ipcMain.handle("update-config", (_e, cfg: ConfigPayload) => {
      // republish config so the Python script can pick it up
      this.client.publish("ice-server3/config", JSON.stringify(cfg));
      
      // Send a status update that config was updated
      win.webContents.send("status", {
        kind: "config",
        name: "update",
        state: "Configuration updated"
      });
    });
  }
}
