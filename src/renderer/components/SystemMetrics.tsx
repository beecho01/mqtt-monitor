import { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
    gap: "16px",
    padding: "10px",
  },
});

export const SystemMetrics = () => {
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const styles = useStyles();
  
  useEffect(() => {
    // Subscribe to metrics events from the main process
    const handleMetrics = (data: { topic: string; value: string }) => {
      if (data.topic === "cpu") {
        setCpuUsage(parseFloat(data.value));
      } else if (data.topic === "memory") {
        setMemoryUsage(parseFloat(data.value));
      }
    };

    // Register the event handler
    window.api.onMetrics(handleMetrics);

    // Clean up the event handler when the component unmounts
    return () => {
      // If you have a way to unsubscribe, do it here
      // For example: window.api.offMetrics(handleMetrics);
    };
  }, []);

  return (
    <div>
        <h2>System Performance</h2>
        <div className={ styles.grid }>
        <MetricCard label="CPU Usage" value={cpuUsage} suffix="%" />
        <MetricCard label="Memory Usage" value={memoryUsage} suffix="%" />
        </div>
    </div>
  );
};