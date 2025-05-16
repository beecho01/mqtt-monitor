import { BrowserWindow, app, ipcMain, nativeTheme, type IpcMainEvent } from "electron";
import { join } from "path";
import os from "os";
import { MqttBridge } from "./mqtt"; // Add this import

const createBrowserWindow = (): BrowserWindow => {
  const preloadScriptFilePath = join(__dirname, "..", "dist-preload", "preload.js");

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
    icon: join(__dirname, "..", "build", "app-icon-dark.png"),
  };

  // Apply platform-specific options
  if (process.platform === 'win32') {
    try {
      // Check if running on Windows Server
      const isWindowsServer = os.release().toLowerCase().includes('server') || 
                             (os.type() === 'Windows_NT' && os.release() >= '10.0' && 
                              !app.isAccessibilitySupportEnabled()); // This is a hacky check

      if (!isWindowsServer) {
        // Regular Windows, try to use Mica
        windowOptions.backgroundMaterial = "mica";
        windowOptions.vibrancy = "header";
      } else {
        // Windows Server fallback - use solid color matching the theme
        windowOptions.backgroundColor = nativeTheme.shouldUseDarkColors ? '#202020' : '#f5f5f5';
      }
    } catch (error) {
      console.log('Error detecting platform capabilities, using fallback:', error);
      // Fallback to solid background if error occurs
      windowOptions.backgroundColor = nativeTheme.shouldUseDarkColors ? '#202020' : '#f5f5f5';
    }
  } else {
    // Non-Windows platforms
    if (process.platform === 'darwin') {
      windowOptions.vibrancy = "header"; // macOS vibrancy
    } else {
      // Linux and other platforms
      windowOptions.backgroundColor = nativeTheme.shouldUseDarkColors ? '#202020' : '#f5f5f5';
    }
  }

  return new BrowserWindow(windowOptions);
};

const loadFileOrUrl = (browserWindow: BrowserWindow) => {
  if (process.env.VITE_DEV_SERVER_URL) {
    browserWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    browserWindow.loadFile(join(__dirname, "..", "dist-renderer", "index.html"));
  }
};

const registerIpcEventListeners = () => {
  ipcMain.on("themeShouldUseDarkColors", (event: IpcMainEvent) => {
    event.returnValue = nativeTheme.shouldUseDarkColors;
  });
};

const registerNativeThemeEventListeners = (allBrowserWindows: BrowserWindow[]) => {
  nativeTheme.addListener("updated", () => {
    for (const browserWindow of allBrowserWindows) {
      browserWindow.webContents.send("nativeThemeChanged");
    }
  });
};

// Create a function to get CPU usage
async function getCpuUsage() {
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0),
    0
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  const newCpus = os.cpus();
  const newTotalIdle = newCpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const newTotalTick = newCpus.reduce(
    (acc, cpu) => acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0),
    0
  );

  const idleDiff = newTotalIdle - totalIdle;
  const tickDiff = newTotalTick - totalTick;

  return 100 - Math.round((idleDiff / tickDiff) * 100);
}

// Function to get memory usage
function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return Math.round((used / total) * 100);
}

(async () => {
  await app.whenReady();
  const mainWindow = createBrowserWindow();
  loadFileOrUrl(mainWindow);
  registerIpcEventListeners();
  registerNativeThemeEventListeners(BrowserWindow.getAllWindows());
  
  // Initialize the MQTT bridge
  new MqttBridge(mainWindow);

  // Send metrics every second
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Get CPU usage
      getCpuUsage().then(cpuUsage => {
        mainWindow.webContents.send("metrics", {
          topic: "cpu",
          value: cpuUsage.toString(),
        });
      });

      // Get memory usage
      const memoryUsage = getMemoryUsage();
      mainWindow.webContents.send("metrics", {
        topic: "memory",
        value: memoryUsage.toString(),
      });
    }
  }, 1000);
})();
