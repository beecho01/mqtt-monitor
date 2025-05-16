import { makeStyles, Subtitle1, mergeClasses } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";
import { CheckmarkCircle20Regular, ErrorCircle20Regular, QuestionCircle20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
    gap: "16px",
    padding: "20px 0px",
  },
  emptyState: {
    padding: "20px 0",
    color: "gray",
    fontStyle: "italic",
  },
  serviceRunning: {
    color: "#107C10", // Green
  },
  serviceStopped: {
    color: "#A80000", // Red
  },
  servicePending: {
    color: "#797775", // Gray
  },
  statusIcon: {
    marginRight: "0px",
    verticalAlign: "middle",
  },
});

// Type to track service status
interface ServiceStatus {
  name: string;
  status: string;
  displayName?: string;
  startupType?: string;
  description?: string;
}

export const ServiceMetrics = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [configuredServices, setConfiguredServices] = useState<string[]>([]);
  const styles = useStyles();

  // Load configured services
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Add logging to help debug
        console.log("API methods available:", Object.keys(window.api));
        
        let config;
        try {
          // Since getConfig doesn't require a parameter in your implementation
          config = await window.api.getConfig();
          console.log("Config loaded:", config);
        } catch (error) {
          console.error("Error calling getConfig:", error);
          
          // Fallback to localStorage if API call fails
          const storedConfig = localStorage.getItem('app-config');
          if (storedConfig) {
            config = JSON.parse(storedConfig);
            console.log("Using config from localStorage:", config);
          }
        }
        
        if (config && config.service_check) {
          setConfiguredServices(config.service_check);
          
          // Initialize each configured service with pending status
          setServices(prev => {
            const existing = new Set(prev.map(s => s.name));
            const newServices = config.service_check
              .filter((name: string) => !existing.has(name))
              .map((name: unknown) => ({
                name,
                status: 'pending',
              }));
            
            return [...prev, ...newServices];
          });
        }
      } catch (error) {
        console.error("Error in loadConfig:", error);
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

  // Handle service status updates
  useEffect(() => {
    const handleStatus = (data: { kind: string; name: string; state: string; details?: unknown }) => {
      if (data.kind === 'service_status') {
        setServices(prev => {
          const existingIndex = prev.findIndex(s => s.name === data.name);
          
          if (existingIndex >= 0) {
            // Update existing service status
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: data.state,
              ...(data.details || {})
            };
            return updated;
          } else {
            // Add new service with status info
            return [...prev, {
              name: data.name,
              status: data.state,
              ...(data.details || {})
            }];
          }
        });
      }
    };

    // Register event handler
    window.api.onStatus(handleStatus);

    return () => {
      // If you have a way to unsubscribe, you would do it here
    };
  }, []);

  // Render status icon based on service state
  const renderStatusIcon = (status: string) => {
    if (status === 'running') {
      return <CheckmarkCircle20Regular className={mergeClasses(styles.statusIcon, styles.serviceRunning)} />;
    } else if (status === 'stopped' || status === 'not_running') {
      return <ErrorCircle20Regular className={mergeClasses(styles.statusIcon, styles.serviceStopped)} />;
    } else {
      return <QuestionCircle20Regular className={mergeClasses(styles.statusIcon, styles.servicePending)} />;
    }
  };

  // Gets display status text with proper capitalization
  const getDisplayStatus = (status: string) => {
    if (!status) return 'Unknown';
    
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // No services configured
  if (services.length === 0 && configuredServices.length === 0) {
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
        {services.map((service) => (
          <MetricCard 
            key={service.name}
            label={service.displayName || service.name}
            value={renderStatusIcon(service.status)}
            suffix={getDisplayStatus(service.status)}
            description={service.description || ''}
            valueAsNode={true}
            showProgress={false}
          />
        ))}
      </div>
    </div>
  );
};
