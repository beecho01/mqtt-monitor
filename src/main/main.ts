import { BrowserWindow, app, ipcMain, nativeTheme, type IpcMainEvent } from "electron";
import { join } from "path";
import { ConfigManager } from "./configManager";
import { MqttBridge } from "./mqtt";
import { ProcessMonitor } from "./processMonitor";
import { ServiceMonitor } from "./serviceMonitor";
import { SystemMonitor } from "./systemMonitor";

let mqttBridge: MqttBridge;
let systemMonitor: SystemMonitor;

const createBrowserWindow = (): BrowserWindow => {
  const preloadScriptFilePath = join(__dirname, "..", "dist-preload", "preload.js");

  // Determine icon based on theme
  const iconName = nativeTheme.shouldUseDarkColors ? "app-icon-light.png" : "app-icon-dark.png";
  
  // Create base window options
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1152,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadScriptFilePath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: join(__dirname, "..", "build", iconName),
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#202020" : "#f5f5f5",
  };

  return new BrowserWindow(windowOptions);
};

const loadFileOrUrl = (browserWindow: BrowserWindow) => {
  if (process.env.VITE_DEV_SERVER_URL) {
    browserWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    browserWindow.loadFile(join(__dirname, "..", "dist-renderer", "index.html"));
  }
};

const registerIpcEventListeners = (mainWindow: BrowserWindow) => {
  ipcMain.on("themeShouldUseDarkColors", (event: IpcMainEvent) => {
    event.returnValue = nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle("check-process", async (_e, processName) => {
    const isRunning = await ProcessMonitor.checkProcess(processName);

    // Send status update
    mainWindow.webContents.send("status", {
      kind: "process_status",
      name: processName,
      state: isRunning ? "running" : "not running",
    });

    return isRunning;
  });

  ipcMain.handle("check-service", async (_e, serviceName) => {
    const serviceStatus = await ServiceMonitor.checkService(serviceName);

    // Send status update
    mainWindow.webContents.send("status", {
      kind: "service_status",
      name: serviceName,
      state: serviceStatus.state,
      details: {
        displayName: serviceStatus.displayName,
        description: serviceStatus.description,
      },
    });

    return serviceStatus;
  });

  ipcMain.handle("getMqttStatus", () => {
    if (!mqttBridge) {
      return { connected: false, lastError: "MQTT bridge not initialized" };
    }
    
    // Use a public method to get the status instead of accessing the private client property
    const status = mqttBridge.getConnectionStatus();
    console.log("MQTT Status requested:", status);
    
    return status;
  });

  ipcMain.handle("request-system-metrics", async () => {
    // Request immediate metrics update
    if (systemMonitor) {
      await systemMonitor.collectAndSendMetrics();
      return;
    }
    throw new Error("System monitor not initialized");
  });
};

const registerNativeThemeEventListeners = (allBrowserWindows: BrowserWindow[]) => {
  nativeTheme.addListener("updated", () => {
    // Determine new icon based on current theme
    const iconName = nativeTheme.shouldUseDarkColors ? "app-icon-dark.png" : "app-icon-light.png";
    const iconPath = join(__dirname, "..", "build", iconName);
    
    for (const browserWindow of allBrowserWindows) {
      // Update the icon
      browserWindow.setIcon(iconPath);
      
      // Notify renderer about theme change
      browserWindow.webContents.send("nativeThemeChanged");
    }
  });
};

(async () => {
  await app.whenReady();
  const mainWindow = createBrowserWindow();
  loadFileOrUrl(mainWindow);
  
  // Initialize config manager
  const configManager = new ConfigManager();
  
  // Initialize the MQTT bridge with the config manager (fix the duplicate)
  mqttBridge = new MqttBridge(mainWindow, configManager);
  
  // Initialize and start the system monitor
  systemMonitor = new SystemMonitor(mainWindow);
  systemMonitor.start();

  // Register IPC handlers AFTER creating the mqttBridge
  registerIpcEventListeners(mainWindow);
  registerNativeThemeEventListeners(BrowserWindow.getAllWindows());

  // Clean up resources when window is closed
  mainWindow.on("closed", () => {
    systemMonitor.stop();
  });
})();
