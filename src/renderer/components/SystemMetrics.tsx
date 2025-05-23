import { makeStyles, Text } from "@fluentui/react-components";
import { StatusPayload } from "@shared/types";
import { useEffect, useState } from "react";
import { useConfig } from "../hooks/useConfig";
import { MetricCard } from "./MetricCard";
import { SkeletonCard } from "./SkeletonCard";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "0px 0px 20px 0px",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
  },
  emptyState: {
    paddingTop: "20px",
    color: "gray",
    fontStyle: "italic",
  },
});

export const SystemMetrics = () => {
  const styles = useStyles();
  const { config } = useConfig();

  const [systemMetrics, setSystemMetrics] = useState<{
    cpu: string | null;
    memory: string | null;
    disks: Record<string, string>;
  }>({
    cpu: null,
    memory: null,
    disks: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to update system metrics from status events
    const handleStatus = (payload: StatusPayload) => {
      // First check if the kind is "system"
      if (payload.kind === "system") {
        setSystemMetrics((prev) => {
          // Create a new state object based on the previous state
          const newState = { ...prev };

          // Update the appropriate metric based on the payload name
          if (payload.name === "cpu") {
            // Parse cpu load percentage value from string like "50.0%" to number
            newState.cpu = payload.state;
          } else if (payload.name === "memory") {
            // Parse memory percentage value from string like "50.0%" to number
            newState.memory = payload.state;
          } else if (payload.name.startsWith("disk_")) {
            // Extract the drive name from the payload name (e.g., "disk_C")
            const drive = payload.name.replace("disk_", "");
            newState.disks = { ...newState.disks, [drive]: payload.state };
          }
          return newState;
        });

        // Set loading to false after receiving the first status update
        setLoading(false);
      }
    };

    // Listen for status updates
    window.api.onStatus(handleStatus);

    return () => {
      // Cleanup: remove the event listener when the component unmounts
      window.api.offStatus(handleStatus);
    };
  }, []);

  // Helper to parse percentage value from string like "45.2%" to number
  const parsePercentage = (value: string | null): number => {
    if (!value) return 0;
    const match = value.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Check if all system metrics are disabled in config
  const allMetricsDisabled = !config.cpu_enabled && !config.memory_enabled && !config.disk_enabled;

  // If all metrics are disabled, show a message
  if (allMetricsDisabled) {
    return (
      <div className={styles.container}>
        <Text className={styles.title}>System Metrics</Text>
        <div className={styles.emptyState}>No system metrics enabled. Enable metrics in the Configuration page.</div>
      </div>
    );
  }

  // If loading, show skeleton cards
  if (loading) {
    return (
      <div className={styles.container}>
        <Text className={styles.title}>System Metrics</Text>
        <div className={styles.metricsGrid}>
          <SkeletonCard variant="metric" />
          <SkeletonCard variant="metric" />
          <SkeletonCard variant="metric" />
        </div>
      </div>
    );
  }

  // Render the system metrics once loaded
  return (
    <div className={styles.container}>
      <Text className={styles.title}>System Metrics</Text>
      <div className={styles.metricsGrid}>
        {config.cpu_enabled && systemMetrics.cpu !== null && (
          <MetricCard label="CPU Usage" value={parsePercentage(systemMetrics.cpu)} suffix="%" showProgress={true} />
        )}
        {config.memory_enabled && systemMetrics.memory !== null && (
          <MetricCard
            label="Memory Usage"
            value={parsePercentage(systemMetrics.memory)}
            suffix="%"
            showProgress={true}
          />
        )}
        {config.disk_enabled &&
          Object.entries(systemMetrics.disks).map(([drive, usage]) => (
            <MetricCard
              key={drive}
              label={`Disk ${drive} Usage`}
              value={parsePercentage(usage)}
              suffix="%"
              showProgress={true}
            />
          ))}
        {config.disk_enabled && Object.keys(systemMetrics.disks).length === 0 && !loading && (
          <SkeletonCard variant="metric" />
        )}
      </div>
    </div>
  );
};
