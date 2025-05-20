// Create or modify this file:

import { exec } from "child_process";

export class ProcessMonitor {
  // Check if a process is running by name
  public static checkProcess(processName: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Command differs by platform
      const cmd =
        process.platform === "win32"
          ? `tasklist /FI "IMAGENAME eq ${processName}" /NH`
          : `ps -A | grep -i ${processName}`;

      // Execute the command
      exec(cmd, (error, stdout) => {
        if (error) {
          console.error(`Error checking process ${processName}:`, error);
          resolve(false);
          return;
        }

        // On Windows, check if the process name is in the output
        if (process.platform === "win32") {
          // If process exists, stdout will contain the process name
          resolve(stdout.toLowerCase().includes(processName.toLowerCase()));
        } else {
          // Otherwise check if stdout is not empty
          resolve(!!stdout.trim());
        }
      });
    });
  }
}
