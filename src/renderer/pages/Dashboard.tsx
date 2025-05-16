import { Divider, makeStyles, Title1 } from "@fluentui/react-components";
import { ApplicationMetrics } from "../components/ApplicationMetrics";
import { ServiceMetrics } from "../components/ServiceMetrics";
import { SystemMetrics } from "../components/SystemMetrics";

const useStyles = makeStyles({
  container : {
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    backgroundColor: "transparent",
  },
});

export default function Dashboard() {
  const styles = useStyles();
  return (
    <div className={ styles.container }>
      <Title1 style={{ paddingBottom: "40px" }}>Dashboard</Title1>
      <SystemMetrics />
      <Divider style={{ margin: "20px 0px" }} />
      <ApplicationMetrics />
      <Divider style={{ margin: "20px 0px" }} />
      <ServiceMetrics />
    </div>
  );
}
