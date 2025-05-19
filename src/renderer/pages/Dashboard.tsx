import { Divider, makeStyles, Title1 } from "@fluentui/react-components";
import { ApplicationMetrics } from "../components/ApplicationMetrics";
import { ServiceMetrics } from "../components/ServiceMetrics";
import { SystemMetrics } from "../components/SystemMetrics";
import { useEffect } from "react";
import { useConfig } from "../hooks/useConfig";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    backgroundColor: "transparent",
  },
});

export default function Dashboard() {
  const styles = useStyles();
  const { config } = useConfig();
  
  useEffect(() => {
    const requestAllUpdates = async () => {
      try {

        // Request system metrics
        await window.api.requestSystemMetrics();
        
        // Request process status if configured
        if (config.process_check && config.process_check.length > 0) {
          await window.api.requestProcessStatus(config.process_check);
        }
        
        // Request service status if configured
        if (config.service_check && config.service_check.length > 0) {
          await window.api.requestServiceStatus(config.service_check);
        }
        
      } catch (err) {
        console.error("Failed to request updates:", err);
      }
    };
    
    requestAllUpdates();
  }, [config]);
  
  return (
    <div className={styles.container}>
      <Title1 style={{ paddingBottom: "40px" }}>Dashboard</Title1>
      <SystemMetrics />
      <Divider style={{ margin: "20px 0px" }} />
      <ApplicationMetrics />
      <Divider style={{ margin: "20px 0px" }} />
      <ServiceMetrics />
    </div>
  );
}
