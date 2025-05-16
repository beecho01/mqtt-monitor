import { SystemMetrics } from "../components/SystemMetrics";
import { ApplicationMetrics } from "../components/ApplicationMetrics";
import { ServiceMetrics } from "../components/ServiceMetrics";
import { Divider } from "@fluentui/react-components";

export default function Dashboard() {

  return (
    <div>
      <h1 style={{ margin: "20px 0px 40px 0px" }}>Dashboard</h1>
      <SystemMetrics />
      <Divider style={{ margin: "20px 0px" }} />
      <ApplicationMetrics />
      <Divider style={{ margin: "20px 0px" }} />
      <ServiceMetrics />
    </div>
  );
}
