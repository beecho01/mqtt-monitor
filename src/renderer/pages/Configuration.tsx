import {
  Button,
  Card,
  Field,
  Input,
  makeStyles,
  SpinButton,
  Subtitle1,
  Textarea,
  Title1,
  Toast,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { SaveRegular } from "@fluentui/react-icons";
import { useState } from "react";

export interface ConfigPayload {
  host: string;
  port: number;
  topic: string;
  username: string;
  password: string;
  status_update_interval: number;
  mqtt_reconnect_min_delay: number;
  mqtt_reconnect_max_delay: number;
  process_check: string[];
  service_check: string[];
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
    gap: "12px",
    paddingLeft: "20px",
  },
  field: {
    marginTop: "16px",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "transparent",
    marginRight: "20px",
    padding: "20px",
    flexGrow: 1,
    gap: "30px",
  },
  card: {
    padding: "32px",
    borderRadius: "12px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  button: {
    minWidth: "120px",
  },
  sectionHeader: {
    marginBottom: "20px",
    fontWeight: "bold",
    fontSize: "24px",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
});

export default function Configuration() {
  const styles = useStyles();
  const { dispatchToast } = useToastController();

  const [cfg, setCfg] = useState<ConfigPayload>({
    host: "",
    port: 1883,
    username: "",
    password: "",
    topic: "",
    status_update_interval: 15,
    mqtt_reconnect_min_delay: 1,
    mqtt_reconnect_max_delay: 120,
    process_check: [],
    service_check: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
    try {
      setIsSubmitting(true);
      await window.api.updateConfig(cfg);
      dispatchToast(
        <Toast>
          <ToastTitle>Success</ToastTitle>
          Configuration saved and published successfully
        </Toast>,
        { position: "top", intent: "success" },
      );
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          Failed to save configuration. Please try again.
        </Toast>,
        { position: "top", intent: "error" },
      );
      console.error("Error saving configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayChange = (field: keyof ConfigPayload, value: string) => {
    if (field === "process_check" || field === "service_check") {
      const items = value
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item);
      setCfg({ ...cfg, [field]: items });
    }
  };

  return (
    <div className={styles.container}>
      <Title1>Server Configuration</Title1>

        <Card className={styles.card}>
          <Subtitle1>Device/Topic Settings</Subtitle1>

          <Field
            className={styles.field}
            label="Server Topic Name"
            size="medium"
            required
            validationMessage={!cfg.topic ? "Device/Topic name is required" : undefined}
          >
            <Input value={cfg.topic} onChange={(_, d) => setCfg({ ...cfg, topic: d.value })} />
          </Field>
        </Card>

        <Card className={styles.card}>
          <Subtitle1>MQTT Connection Settings</Subtitle1>
          <Field
            className={styles.field}
            label="MQTT Broker Host Address or IP"
            size="medium"
            required
            validationMessage={!cfg.host ? "Host address is required" : undefined}
          >
            <Input value={cfg.host} onChange={(_, d) => setCfg({ ...cfg, host: d.value })} />
          </Field>

          <Field
            className={styles.field}
            label="MQTT Broker Port"
            size="medium"
            required
            validationMessage={!cfg.port ? "Port is required" : undefined}
          >
            <Input
              type="number"
              value={String(cfg.port)}
              onChange={(_, d) => setCfg({ ...cfg, port: Number(d.value) })}
              placeholder="1883"
            />
          </Field>

          <div className={styles.columns}>
            <Field className={styles.field} label="MQTT Username" size="medium">
              <Input
                value={cfg.username}
                onChange={(_, d) => setCfg({ ...cfg, username: d.value })}
                placeholder="Username"
              />
            </Field>

            <Field className={styles.field} label="MQTT Password" size="medium">
              <Input
                type="password"
                value={cfg.password}
                onChange={(_, d) => setCfg({ ...cfg, password: d.value })}
                placeholder="Password"
              />
            </Field>
          </div>
        </Card>

        <Card className={styles.card}>
          <Subtitle1>Timing Configuration</Subtitle1>
          <div className={styles.columns}>
            <Field className={styles.field} label="Status Update Interval (seconds)" size="medium">
              <SpinButton
                value={cfg.status_update_interval}
                onChange={(_, data) => setCfg({ ...cfg, status_update_interval: data.value ?? 0 })}
                min={1}
                max={3600}
                step={1}
              />
            </Field>

            <Field className={styles.field} label="MQTT Reconnect Min Delay (seconds)" size="medium">
              <SpinButton
                value={cfg.mqtt_reconnect_min_delay}
                onChange={(_, data) =>
                  setCfg({ ...cfg, mqtt_reconnect_min_delay: data.value ?? cfg.mqtt_reconnect_min_delay })
                }
                min={1}
                max={60}
                step={1}
              />
            </Field>

            <Field className={styles.field} label="MQTT Reconnect Max Delay (seconds)" size="medium">
              <SpinButton
                value={cfg.mqtt_reconnect_max_delay}
                onChange={(_, data) =>
                  setCfg({ ...cfg, mqtt_reconnect_max_delay: data.value ?? cfg.mqtt_reconnect_max_delay })
                }
                min={10}
                max={600}
                step={10}
              />
            </Field>
          </div>
        </Card>

        <Card className={styles.card}>
          <Subtitle1>Monitoring Configuration</Subtitle1>
          <Field className={styles.field} label="Process Check (one per line)" size="medium">
            <Textarea
              value={cfg.process_check.join("\n")}
              onChange={(_, data) => handleArrayChange("process_check", data.value)}
              placeholder="Enter processes to monitor, one per line"
              style={{ height: "120px" }}
            />
          </Field>

          <Field className={styles.field} label="Service Check (one per line)" size="medium">
            <Textarea
              value={cfg.service_check.join("\n")}
              onChange={(_, data) => handleArrayChange("service_check", data.value)}
              placeholder="Enter services to monitor, one per line"
              style={{ height: "120px" }}
            />
          </Field>
        </Card>

        <div className={styles.buttonContainer}>
          <Button
            appearance="primary"
            onClick={save}
            disabled={isSubmitting || !cfg.host || !cfg.port || !cfg.topic}
            icon={<SaveRegular />}
            className={styles.button}
            size="large"
          >
            {isSubmitting ? "Saving..." : "Save & Publish"}
          </Button>
        </div>
      </div>
  );
}
