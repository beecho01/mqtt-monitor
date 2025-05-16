import { makeStyles, tokens, Text } from "@fluentui/react-components"
import { useState, useEffect } from "react"
import { MetricsPayload } from "@shared/types"

const useStyles = makeStyles({  
  logsContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    width: "100%",
  },
  
  logContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
    flex: 1,
    width: "50%",
  },

  logLabel: {
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    width: "fit-content",
    fontWeight: tokens.fontWeightBold,
    padding: "2px 12px",
  },

  log: {
    overflowY: "auto",
    boxShadow: tokens.shadow16,
    position: "relative",
    minWidth: "200px",
    height: "525px",
    border: `2px solid ${tokens.colorBrandBackground}`,
    padding: "12px",
  },
});

type LogEntry = {
  timestamp: number;
  topic: string;
  message: string;
}

export default function LogView() {
  const styles = useStyles();
  const [mqttLogs, setMqttLogs] = useState<LogEntry[]>([]);
  const [statusLogs, setStatusLogs] = useState<[number, string][]>([]);
  
  const statusLabelId = "status-log-label";
  const mqttLabelId = "mqtt-log-label";

  // Set up IPC listeners for MQTT messages
  useEffect(() => {
    console.log("Setting up IPC listeners for MQTT messages");
    
    // Listen for metrics messages
    const metricsHandler = (payload: MetricsPayload) => {
      console.log("Received metrics:", payload);
      setMqttLogs(prev => [
        ...prev, 
        {
          timestamp: Date.now(),
          topic: payload.topic,
          message: payload.value
        }
      ].slice(-100)); // Keep only the last 100 messages
    };

    // Listen for status messages
    type StatusPayload = { kind: string; name: string; state: string };
    const statusHandler = (payload: StatusPayload) => {
      setStatusLogs(prev => {
        const newEntry: [number, string] = [Date.now(), `${payload.kind}/${payload.name}: ${payload.state}`];
        return [...prev, newEntry].slice(-100);
      }); // Keep only the last 100 status updates
    };

    // Add event listeners using the correct API methods
    window.api.onMetrics(metricsHandler);
    window.api.onStatus(statusHandler);

  }, []);

  return (
    <div>
      <h1 style={{ margin: "20px 0px 40px 0px" }}>Log View</h1>
      
      <div className={styles.logsContainer}>
        {/* Status Log */}
        <div className={styles.logContainer}>
          <div className={styles.logLabel} id={statusLabelId}>
            Status log
          </div>
          <div role="log" aria-labelledby={statusLabelId} className={styles.log}>
            {[...statusLogs].reverse().map(([time, eventLog], i) => {
              const date = new Date(time);
              return (
                <div key={i}>
                  {date.toLocaleTimeString([], {hour12: false})} <Text style={{ color: tokens.colorBrandBackground }} weight="bold">{eventLog}</Text>
                </div>
              );
            })}
          </div>
        </div>

        {/* MQTT Log */}
        <div className={styles.logContainer}>
          <div className={styles.logLabel} id={mqttLabelId}>
            MQTT Messages
          </div>
          <div role="log" aria-labelledby={mqttLabelId} className={styles.log}>
            {[...mqttLogs].reverse().map((log, i) => {
              const date = new Date(log.timestamp);
              return (
                <div key={i}>
                  {date.toLocaleTimeString([], {hour12: false})} <Text weight="bold">{log.topic}:</Text> {log.message}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
