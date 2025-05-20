import { ConfigPayload } from "@shared/types";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

export class ConfigManager {
  private configPath: string;
  private config: ConfigPayload | null = null;

  constructor() {
    // Store in user data directory for the app
    this.configPath = path.join(app.getPath("userData"), "config.json");
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf8");
        this.config = JSON.parse(data);
        //console.log("Config loaded from disk:", this.configPath);
      } else {
        console.log("No config file exists yet at:", this.configPath);
      }
    } catch (error) {
      console.error("Error loading config from disk:", error);
    }
  }

  public saveConfig(config: ConfigPayload): void {
    try {
      this.config = config;
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), "utf8");
      //console.log("Config saved to disk:", this.configPath);
    } catch (error) {
      console.error("Error saving config to disk:", error);
    }
  }

  public getConfig(): ConfigPayload | null {
    return this.config;
  }
}
