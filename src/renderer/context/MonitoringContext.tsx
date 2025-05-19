import { ProcessStatus, ServiceStatus, StatusPayload } from "@shared/types";
import React, { createContext, useContext, useEffect, useState } from "react";

// Context type definition
interface MonitoringContextType {
  processes: ProcessStatus[];
  services: ServiceStatus[];
  updateProcess: (process: ProcessStatus) => void;
  updateService: (service: ServiceStatus) => void;
}

// Create the context
const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

// Provider component
export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes, setProcesses] = useState<ProcessStatus[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  // Update a single process
  const updateProcess = (process: ProcessStatus) => {
    setProcesses((prev) => {
      const index = prev.findIndex((p) => p.name === process.name);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = process;
        return updated;
      } else {
        return [...prev, process];
      }
    });
  };

  // Update a single service
  const updateService = (service: ServiceStatus) => {
    setServices((prev) => {
      const index = prev.findIndex((s) => s.name === service.name);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = service;
        return updated;
      } else {
        return [...prev, service];
      }
    });
  };

  // Listen for status updates
  useEffect(() => {
    const handleStatus = (data: StatusPayload) => {
      console.log("Status update received:", data);

      if (data.kind === "process_status") {
        updateProcess({
          name: data.name,
          status: data.state,
          displayName: data.details?.displayName as string | undefined,
          description: data.details?.description as string | undefined,
          details: data.details,
        });
      } else if (data.kind === "service_status") {
        // Cast details to Record<string, unknown> to safely access properties
        const details = data.details || {};

        updateService({
          name: data.name,
          status: data.state,
          displayName: details.displayName as string | undefined,
          description: details.description as string | undefined,
          details: details,
        });
      }
    };

    // Register event handler
    window.api.onStatus(handleStatus);

    return () => {
      // If there's a way to unsubscribe
    };
  }, []);

  return (
    <MonitoringContext.Provider
      value={{
        processes,
        services,
        updateProcess,
        updateService,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

// Custom hook for using the context
export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error("useMonitoring must be used within a MonitoringProvider");
  }
  return context;
};
