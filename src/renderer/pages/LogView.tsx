import { makeStyles, Text, Title1, tokens } from "@fluentui/react-components";
import { MetricsPayload } from "@shared/types";
import { useEffect, useState } from "react";
import { ScrollableContainer } from "../components/ScrollableContainer";
import { useWindowHeight } from "../hooks/useWindowHeight";
import { useWindowWidth } from "../hooks/useWindowWidth";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    backgroundColor: "transparent",
  },
  logsContainer: {
    display: "flex",
    flexGrow: 1,
    gap: "50px",
    flexDirection: "row",
    height: "100%",
  },

  logContainer: {
    display: "flex",
    flexDirection: "column",
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
    minHeight: "300px",
    border: `2px solid ${tokens.colorBrandBackground}`,
    padding: "12px",
    flexGrow: 1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

type LogEntry = {
  timestamp: number;
  topic: string;
  message: string;
};

export default function LogView() {
  const styles = useStyles();
  const [mqttLogs, setMqttLogs] = useState<LogEntry[]>([]);
  const [statusLogs, setStatusLogs] = useState<[number, string][]>([]);
  const logHeight = useWindowHeight({ percentage: 100, offset: 220 });
  const logWidth = useWindowWidth({ percentage: 50, offset: 180 });

  const statusLabelId = "status-log-label";
  const mqttLabelId = "mqtt-log-label";

  useEffect(() => {
    // Listen for metrics messages
    const metricsHandler = (payload: MetricsPayload) => {
      console.log("Received metrics:", payload);
      setMqttLogs((prev) =>
        [
          ...prev,
          {
            timestamp: Date.now(),
            topic: payload.topic,
            message: payload.value,
          },
        ].slice(-100),
      );
    };

    // Listen for status messages
    type StatusPayload = { kind: string; name: string; state: string };
    const statusHandler = (payload: StatusPayload) => {
      setStatusLogs((prev) => {
        const newEntry: [number, string] = [Date.now(), `${payload.kind}/${payload.name}: ${payload.state}`];
        return [...prev, newEntry].slice(-100);
      });
    };

    // Add event listeners for metrics and status
    window.api.onMetrics(metricsHandler);
    window.api.onStatus(statusHandler);

    return () => {
      // Cleanup: remove the event listeners when the component unmounts
      window.api.offMetrics(metricsHandler);
      window.api.offStatus(statusHandler);
    };
  }, []);

  return (
    <div className={styles.container}>
      <Title1 style={{ paddingBottom: "40px" }}>Log View</Title1>

      <div className={styles.logsContainer}>
        {/* Status Log */}
        <div className={styles.logContainer} style={{ width: logWidth }}>
          <ScrollableContainer height={logHeight} label="Status log" labelId={statusLabelId}>
            {[...statusLogs].reverse().map(([time, eventLog], i) => {
              const date = new Date(time);
              return (
                <div key={`status-${time}-${i}`}>
                  {date.toLocaleTimeString([], { hour12: false })}{" "}
                  {eventLog.includes("error") ? (
                    <Text style={{ color: tokens.colorPaletteRedBackground3 }} weight="bold">
                      {eventLog}
                    </Text>
                  ) : eventLog.includes("warning") ? (
                    <Text style={{ color: "var(--colorWarningForeground)" }} weight="bold">
                      {eventLog}
                    </Text>
                  ) : eventLog.includes("disconnected") ? (
                    <Text style={{ color: tokens.colorPaletteRedBackground3 }} weight="bold">
                      {eventLog}
                    </Text>
                  ) : (
                    <Text style={{ color: "var(--colorBrandBackground)" }} weight="bold">
                      {eventLog}
                    </Text>
                  )}
                </div>
              );
            })}
          </ScrollableContainer>
        </div>
        <div className={styles.logContainer} style={{ width: logWidth }}>
          <ScrollableContainer height={logHeight} label="MQTT Messages" labelId={mqttLabelId}>
            {[...mqttLogs].reverse().map((log, i) => {
              const date = new Date(log.timestamp);
              return (
                <div key={`mqtt-${log.timestamp}-${i}`}>
                  {date.toLocaleTimeString([], { hour12: false })}
                  <Text style={{ color: "var(--colorBrandBackground)" }} weight="bold">
                    {" "}
                    {log.topic}: {log.message}
                  </Text>
                </div>
              );
            })}
          </ScrollableContainer>
        </div>
      </div>
    </div>
  );
}
