import { makeStyles, mergeClasses, Subtitle1 } from "@fluentui/react-components";
import { CheckmarkCircle20Regular, ErrorCircle20Regular, QuestionCircle20Regular } from "@fluentui/react-icons";
import { ProcessStatus } from "@shared/types"; // Import from shared types
import { useEffect, useState } from "react";
import { useMonitoring } from "../context/MonitoringContext";
import { MetricCard } from "./MetricCard";
import { SkeletonCard } from "./SkeletonCard"; // Import skeleton component

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
    gap: "16px",
    padding: "20px 0px",
  },
  emptyState: {
    paddingTop: "20px",
    color: "gray",
    fontStyle: "italic",
  },
  processRunning: {
    color: "#107C10", // Green
  },
  processStopped: {
    color: "#A80000", // Red
  },
  processPending: {
    color: "#797775", // Gray
  },
  statusIcon: {
    marginRight: "0px",
    verticalAlign: "middle",
  },
});

export const ApplicationMetrics = () => {
  const { processes } = useMonitoring();
  const [configuredProcesses, setConfiguredProcesses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useStyles();

  // Load configured processes
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log("Loading process configuration...");

        let config;
        try {
          config = await window.api.getConfig();
          console.log("Config loaded:", config);
        } catch (error) {
          console.error("Error calling getConfig:", error);

          // Fallback to localStorage
          const storedConfig = localStorage.getItem("app-config");
          if (storedConfig) {
            config = JSON.parse(storedConfig);
            console.log("Using config from localStorage:", config);
          }
        }

        if (config && config.process_check) {
          setConfiguredProcesses(config.process_check);
          // Set loading to false after a brief delay
          setTimeout(() => setLoading(false), 800);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in loadConfig:", error);
        setLoading(false);
      }
    };

    loadConfig();

    // Listen for config updates
    const handleConfigUpdate = () => {
      loadConfig();
    };

    window.api.onConfigUpdated(handleConfigUpdate);

    return () => {
      // Clean up event listener if needed
    };
  }, []);

  // Filter processes to only show configured ones with explicit type annotation
  const filterConfiguredProcesses = (): ProcessStatus[] => {
    return processes.filter((process) => configuredProcesses.includes(process.name));
  };

  const displayProcesses = filterConfiguredProcesses();

  // Render status icon based on process state
  const renderStatusIcon = (status: string) => {
    if (status === "running") {
      return <CheckmarkCircle20Regular className={mergeClasses(styles.statusIcon, styles.processRunning)} />;
    } else if (status === "stopped" || status === "not running") {
      return <ErrorCircle20Regular className={mergeClasses(styles.statusIcon, styles.processStopped)} />;
    } else {
      return <QuestionCircle20Regular className={mergeClasses(styles.statusIcon, styles.processPending)} />;
    }
  };

  // Gets display status text with proper capitalization
  const getDisplayStatus = (status: string) => {
    if (!status) return "Unknown";

    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // No processes configured
  if (configuredProcesses.length === 0) {
    return (
      <div>
        <Subtitle1>Applications</Subtitle1>
        <div className={styles.emptyState}>
          No applications configured. Add processes to monitor in the Configuration page.
        </div>
      </div>
    );
  }

  // No processes configured and not loading
  if (displayProcesses.length === 0 && configuredProcesses.length === 0 && !loading) {
    return (
      <div>
        <Subtitle1>Applications</Subtitle1>
        <div className={styles.emptyState}>
          No applications configured. Add processes to monitor in the Configuration page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Subtitle1>Applications</Subtitle1>
      <div className={styles.grid}>
        {loading
          ? configuredProcesses.map((_, index) => <SkeletonCard key={`skeleton-${index}`} variant="status" />)
          : // Show actual process status cards when loaded
            displayProcesses.map((process) => (
              <MetricCard
                key={process.name}
                label={process.displayName || process.name}
                value={renderStatusIcon(process.status)}
                suffix={getDisplayStatus(process.status)}
                description={process.description || ""}
                valueAsNode={true}
                showProgress={false}
              />
            ))}
      </div>
    </div>
  );
};
