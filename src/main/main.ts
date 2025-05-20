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

  // Determine correct icon path based on environment
  let iconPath;
  if (app.isPackaged) {
    // In production, use path relative to app resources
    iconPath = join(process.resourcesPath, iconName);
  } else {
    // In development, use path relative to project directory
    iconPath = join(__dirname, "..", "build", iconName);
  }

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
    icon: iconPath,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#202020" : "#f5f5f5",
  };
  return new BrowserWindow(windowOptions);
};

// Load the HTML file or URL
const loadFileOrUrl = (browserWindow: BrowserWindow) => {
  if (process.env.VITE_DEV_SERVER_URL) {
    browserWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    browserWindow.loadFile(join(__dirname, "..", "dist-renderer", "index.html"));
  }
};

// Register IPC event listeners
const registerIpcEventListeners = (mainWindow: BrowserWindow) => {
  ipcMain.on("themeShouldUseDarkColors", (event: IpcMainEvent) => {
    event.returnValue = nativeTheme.shouldUseDarkColors;
  });

  // Handle config updates
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

  // Handle service updates
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

  // Handle config updates
  ipcMain.handle("getMqttStatus", () => {
    if (!mqttBridge) {
      return { connected: false, lastError: "MQTT bridge not initialised" };
    }

    // Use a public method to get the status instead of accessing the private client property
    const status = mqttBridge.getConnectionStatus();
    //console.log("MQTT Status requested:", status);
    return status;
  });

  // Handle MQTT connection
  ipcMain.handle("request-system-metrics", async () => {
    // Request immediate metrics update
    if (systemMonitor) {
      await systemMonitor.collectAndSendMetrics();
      return;
    }
    throw new Error("System monitor not initialised");
  });
};

// Register native theme event listeners
const registerNativeThemeEventListeners = (allBrowserWindows: BrowserWindow[]) => {
  nativeTheme.addListener("updated", () => {
    // Determine new icon based on current theme
    const iconName = nativeTheme.shouldUseDarkColors ? "app-icon-dark.png" : "app-icon-light.png";

    // Determine correct icon path based on environment
    let iconPath;
    if (app.isPackaged) {
      // In production, use path relative to app resources
      iconPath = join(process.resourcesPath, iconName);
    } else {
      // In development, use path relative to project directory
      iconPath = join(__dirname, "..", "build", iconName);
    }

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

  // Initialise config manager
  const configManager = new ConfigManager();

  // Initialise the MQTT bridge with the config manager (fix the duplicate)
  mqttBridge = new MqttBridge(mainWindow, configManager);

  // Initialise and start the system monitor
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
