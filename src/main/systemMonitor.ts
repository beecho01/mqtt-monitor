import { BrowserWindow } from "electron";
import si from "systeminformation";

export class SystemMonitor {
  private win: BrowserWindow;
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs: number;

  constructor(win: BrowserWindow, intervalMs: number = 5000) {
    this.win = win;
    this.intervalMs = intervalMs;
  }

  // Start collecting system metrics at regular intervals
  public start(): void {
    if (this.intervalId) {
      this.stop();
    }
    this.intervalId = setInterval(() => {
      if (this.win && !this.win.isDestroyed()) {
        this.collectAllMetrics();
      } else {
        this.stop();
      }
    }, this.intervalMs);
  }

  //Stop collecting system metrics
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("SystemMonitor: Stopped collecting metrics");
    }
  }

  // Collect all system information and return it
  public static async getSystemInfo(): Promise<{
    cpu: number;
    memory: number;
    disks: Array<{
      drive: string;
      total: number;
      used: number;
      free: number;
      percentUsed: number;
    }>;
  }> {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disks = await si.fsSize();
    const cpuLoad = cpu.currentLoad;
    const memoryUsage = (mem.used / mem.total) * 100;
    const diskInfo = disks.map((d) => ({
      drive: d.mount.replace(/\\|:/g, ""),
      total: d.size,
      used: d.used,
      free: d.size - d.used,
      percentUsed: (d.used / d.size) * 100,
    }));
    return {
      cpu: cpuLoad,
      memory: memoryUsage,
      disks: diskInfo,
    };
  }

  // Private method to collect metrics for internal use
  private async collectAllMetrics(): Promise<void> {}

  //Collect and send system metrics
  public async collectAndSendMetrics(): Promise<void> {
    try {
      // Use the existing getSystemInfo method to collect all metrics at once
      const systemInfo = await SystemMonitor.getSystemInfo();

      // Send CPU metrics
      this.sendMetric("cpu", `${systemInfo.cpu.toFixed(1)}%`);

      // Send memory metrics
      this.sendMetric("memory", `${systemInfo.memory.toFixed(1)}%`);

      // Send disk metrics
      for (const disk of systemInfo.disks) {
        this.sendMetric(`disk_${disk.drive}`, `${disk.percentUsed.toFixed(1)}%`);
      }
    } catch (error) {
      console.error("Error collecting system metrics:", error);
    }
  }

  // Send a metric to the renderer process
  private sendMetric(name: string, value: string): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send("status", {
        kind: "system",
        name,
        state: value,
      });
    }
  }
}
