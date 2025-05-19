import { MetricsPayload, StatusPayload } from "@shared/types";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Types for log entries
export type LogEntry = {
  timestamp: number;
  topic: string;
  message: string;
};

export type StatusLogEntry = [number, string]; // [timestamp, message]

interface LogContextType {
  mqttLogs: LogEntry[];
  statusLogs: StatusLogEntry[];
  clearMqttLogs: () => void;
  clearStatusLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mqttLogs, setMqttLogs] = useState<LogEntry[]>([]);
  const [statusLogs, setStatusLogs] = useState<StatusLogEntry[]>([]);

  // Clear functions
  const clearMqttLogs = () => setMqttLogs([]);
  const clearStatusLogs = () => setStatusLogs([]);

  // Set up listeners for logs
  useEffect(() => {
    console.log("Setting up IPC listeners for logs in LogContext");

    const metricsHandler = (payload: MetricsPayload) => {
      setMqttLogs((prev) =>
        [
          ...prev,
          {
            timestamp: Date.now(),
            topic: payload.topic,
            message: payload.value,
          },
        ].slice(-1000),
      ); // Keep last 1000 entries
    };

    const statusHandler = (payload: StatusPayload) => {
      setStatusLogs((prev) => {
        const newEntry: StatusLogEntry = [Date.now(), `${payload.kind}/${payload.name}: ${payload.state}`];
        return [...prev, newEntry].slice(-1000); // Keep last 1000 entries
      });
    };

    // Add event listeners
    window.api.onMetrics(metricsHandler);
    window.api.onStatus(statusHandler);

    // No need to clean up since we want logs to persist throughout the app lifecycle
  }, []);

  return (
    <LogContext.Provider
      value={{
        mqttLogs,
        statusLogs,
        clearMqttLogs,
        clearStatusLogs,
      }}
    >
      {children}
    </LogContext.Provider>
  );
};

// Custom hook for using log context
export const useLogs = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
};
