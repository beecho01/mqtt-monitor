import { exec } from "child_process";

export class ServiceMonitor {

  // Check if a Windows service is running by name
  public static checkService(
    serviceName: string,
  ): Promise<{ state: string; displayName?: string; description?: string }> {
    return new Promise((resolve) => {
      if (process.platform !== "win32") {
        resolve({ state: "not_supported" });
        return;
      }

      // PowerShell command to get service status and details
      const cmd = `powershell -Command "Get-Service -Name '${serviceName}' | Select-Object -Property Name,DisplayName,Status,Description | ConvertTo-Json"`;

      // Execute the command
      exec(cmd, (error, stdout) => {
        if (error) {
          console.error(`Error checking service ${serviceName}:`, error);
          resolve({ state: "not_found" });
          return;
        }

        try {
          const serviceData = JSON.parse(stdout.trim());

          // Map numeric status to string value
          let statusStr = "unknown";

          // Convert numeric Status to string status
          if (serviceData.Status !== null && serviceData.Status !== undefined) {
            switch (serviceData.Status) {
              case 1:
                statusStr = "stopped";
                break;
              case 2:
                statusStr = "start_pending";
                break;
              case 3:
                statusStr = "stop_pending";
                break;
              case 4:
                statusStr = "running";
                break;
              case 5:
                statusStr = "continue_pending";
                break;
              case 6:
                statusStr = "pause_pending";
                break;
              case 7:
                statusStr = "paused";
                break;
              default:
                statusStr = "unknown";
            }
          }

          resolve({
            state: statusStr,
            displayName: serviceData.DisplayName,
            description: serviceData.Description,
          });
        } catch (parseError) {
          console.error(`Error parsing service data for ${serviceName}:`, parseError, stdout);
          resolve({ state: "error" });
        }
      });
    });
  }
}
