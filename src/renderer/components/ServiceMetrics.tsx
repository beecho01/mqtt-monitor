import { makeStyles, mergeClasses, Subtitle1 } from "@fluentui/react-components";
import {
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  PauseFilled,
  QuestionCircle20Regular,
} from "@fluentui/react-icons";
import { ServiceStatus } from "@shared/types";
import { useEffect, useState } from "react";
import { useMonitoring } from "../context/MonitoringContext";
import { MetricCard } from "./MetricCard";
import { SkeletonCard } from "./SkeletonCard";

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
    gap: "16px",
    padding: "20px 0px 0px 0px",
  },
  emptyState: {
    paddingTop: "20px",
    color: "gray",
    fontStyle: "italic",
  },
  serviceRunning: {
    color: "#107C10",
  },
  serviceStopped: {
    color: "#A80000",
  },
  servicePending: {
    color: "#797775",
  },
  servicePaused: {
    color: "#F7630C",
  },
  statusIcon: {
    marginRight: "0px",
    verticalAlign: "middle",
  },
});

export const ServiceMetrics = () => {
  const { services } = useMonitoring();
  const [configuredServices, setConfiguredServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useStyles();

  // Load configured services
  useEffect(() => {
    const loadConfig = async () => {
      try {
        let config;
        try {
          config = await window.api.getConfig();
        } catch (error) {

          // Handle error calling getConfig from the main process
          console.error("Error calling getConfig:", error);

          // Fallback to localStorage if API call fails
          const storedConfig = localStorage.getItem("app-config");
          if (storedConfig) {
            config = JSON.parse(storedConfig);
            console.log("Using config from localStorage:", config);
          }
        }

        // Check if config is valid
        if (config && config.service_check) {
          setConfiguredServices(config.service_check);
        }
      } catch (error) {
        console.error("Error in loadConfig:", error);
      } finally {

        // Set loading to false
        setLoading(false);
      }
    };

    // Load config on component mount
    loadConfig();

    // Listen for config updates
    const handleConfigUpdate = () => {
      loadConfig();
    };

    // Register event listener for config updates
    window.api.onConfigUpdated(handleConfigUpdate);

    return () => {};
  }, []);

  // Render status icon based on service state
  const renderStatusIcon = (status: string) => {
    if (status === "running") {
      return <CheckmarkCircle20Regular className={mergeClasses(styles.statusIcon, styles.serviceRunning)} />;
    } else if (status === "stopped") {
      return <ErrorCircle20Regular className={mergeClasses(styles.statusIcon, styles.serviceStopped)} />;
    } else if (status === "paused") {
      return <PauseFilled className={mergeClasses(styles.statusIcon, styles.servicePaused)} />;
    } else {
      return <QuestionCircle20Regular className={mergeClasses(styles.statusIcon, styles.servicePending)} />;
    }
  };

  // Gets display status text with proper capitalisation
  const getDisplayStatus = (status: string) => {
    if (!status) return "Unknown";

    // Capitalise first letter
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Use the ServiceStatus type in a filter function
  const filterConfiguredServices = (): ServiceStatus[] => {
    return services.filter((service) => configuredServices.includes(service.name));
  };

  // Get the list of services to display
  const displayServices = filterConfiguredServices();

  // Then use displayServices instead of services in your rendering
  if (configuredServices.length === 0) {
    return (
      <div>
        <Subtitle1>Windows Services</Subtitle1>
        <div className={styles.emptyState}>
          No services configured. Add services to monitor in the Configuration page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Subtitle1>Windows Services</Subtitle1>
      <div className={styles.grid}>
        {loading
          ? configuredServices.map((_, index) => <SkeletonCard key={`skeleton-${index}`} variant="status" />)
          : displayServices.map((service) => (
              <MetricCard
                key={service.name}
                label={service.displayName || service.name}
                value={renderStatusIcon(service.status)}
                suffix={getDisplayStatus(service.status)}
                description={service.description || ""}
                valueAsNode={true}
                showProgress={false}
              />
            ))}
      </div>
    </div>
  );
};
