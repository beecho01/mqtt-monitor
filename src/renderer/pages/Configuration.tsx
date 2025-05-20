import {
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Field,
  Input,
  makeStyles,
  SpinButton,
  Subtitle1,
  Title1,
  Toast,
  ToastTitle,
  tokens,
  Tooltip,
  useToastController,
} from "@fluentui/react-components";
import {
  AddRegular,
  CheckmarkCircleFilled,
  DeleteRegular,
  DismissCircleFilled,
  SaveRegular,
} from "@fluentui/react-icons";
import { StatusPayload } from "@shared/types";
import { useEffect, useState } from "react";
import { useConfig } from "../hooks/useConfig";

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
  processInputContainer: {
    flexGrow: 1,
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  processInput: {
    flexGrow: 1,
  },
  addButton: {
    minWidth: "unset",
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralStroke1,
    "&:hover": {
      backgroundColor: tokens.colorNeutralStroke1Hover,
    },
    "&:active": {
      backgroundColor: tokens.colorNeutralStroke1Pressed,
    },
    "&:focus-visible": {
      backgroundColor: tokens.colorNeutralStroke1Selected,
    },
    transition: "all 0.1s ease-in-out",
  },
  processList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "4px",
  },
  processItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorBrandBackground,
    border: `1px solid ${tokens.colorBrandBackground}`,
    borderRadius: "100px",
    padding: "0px 11px 2px 12px",
    gap: "8px",
    height: "28px",
    lineHeight: "28px",
  },
  deleteProcessButton: {
    paddingTop: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForeground2,
    "&:hover": {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  badge: {
    marginLeft: "16px",
    padding: "0px 11px 0px 6px",
  },
});

export default function Configuration() {
  const styles = useStyles();
  const { dispatchToast } = useToastController();
  const { config, updateConfig } = useConfig();
  const [cfg, setCfg] = useState(config);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProcess, setNewProcess] = useState("");
  const [newService, setNewService] = useState("");
  const [mqttStatus, setMqttStatus] = useState<{
    connected: boolean;
    lastError?: string;
  }>({ connected: false });

  // Update the local state when the config changes
  useEffect(() => {
    setCfg(config);
  }, [config]);

  // Function to add a process or service to the list
  const addProcess = (field: "process_check" | "service_check", value: string) => {
    if (!value.trim()) return;

    setCfg((prev) => {
      const current = prev[field];
      if (current.includes(value.trim())) return prev;

      return {
        ...prev,
        [field]: [...current, value.trim()],
      };
    });
  };

  // Function to remove a process or service from the list
  const removeProcess = (field: "process_check" | "service_check", index: number) => {
    setCfg((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    const handleMqttStatus = (data: StatusPayload) => {
      if (data.kind === "mqtt") {
        setMqttStatus({
          connected: data.state === "connected",
          lastError: data.details?.lastError as string | undefined,
        });
      }
    };

    // Subscribe to the MQTT status event
    window.api.onStatus(handleMqttStatus);

    return () => {
      // Cleanup the event listener when the component unmounts
      window.api.offStatus(handleMqttStatus);
    };
  }, []);

  const save = async () => {
    setIsSubmitting(true);
    const success = await updateConfig(cfg);

    if (success) {
      dispatchToast(
        <Toast>
          <ToastTitle>Success</ToastTitle>
          Configuration saved and published successfully
        </Toast>,
        { position: "top", intent: "success" },
      );
    } else {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          Failed to save configuration. Please try again.
        </Toast>,
        { position: "top", intent: "error" },
      );
    }

    setIsSubmitting(false);
  };

  const renderConnectionStatus = () => {
    if (mqttStatus.connected) {
      return (
        <Badge
          className={styles.badge}
          appearance="filled"
          color="success"
          icon={<CheckmarkCircleFilled />}
          size="large"
        >
          Connected
        </Badge>
      );
    } else {
      return (
        <Tooltip content={mqttStatus.lastError || "Not connected to MQTT broker"} relationship="label">
          <Badge
            className={styles.badge}
            appearance="filled"
            color="danger"
            icon={<DismissCircleFilled />}
            size="large"
          >
            Disconnected
          </Badge>
        </Tooltip>
      );
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
        <CardHeader header={<Subtitle1>MQTT Connection Settings</Subtitle1>} action={renderConnectionStatus()} />
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
            required
          />
        </Field>

        <div className={styles.columns}>
          <Field
            required
            className={styles.field}
            label="MQTT Username"
            size="medium"
            validationMessage={!cfg.username ? "Username is required" : undefined}
          >
            <Input
              value={cfg.username}
              onChange={(_, d) => setCfg({ ...cfg, username: d.value })}
              placeholder="Username"
              required
            />
          </Field>

          <Field
            required
            className={styles.field}
            label="MQTT Password"
            size="medium"
            validationMessage={!cfg.password ? "Password is required" : undefined}
          >
            <Input
              type="password"
              value={cfg.password}
              onChange={(_, d) => setCfg({ ...cfg, password: d.value })}
              placeholder="Password"
              required
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

        <Field className={styles.field} label="System Metrics" size="medium">
          <Checkbox
            label="CPU Usage"
            checked={cfg.cpu_enabled}
            onChange={(_, data) => setCfg({ ...cfg, cpu_enabled: !!data.checked })}
          />
          <Checkbox
            label="Memory Usage"
            checked={cfg.memory_enabled}
            onChange={(_, data) => setCfg({ ...cfg, memory_enabled: !!data.checked })}
          />
          <Checkbox
            label="Disk Usage"
            checked={cfg.disk_enabled}
            onChange={(_, data) => setCfg({ ...cfg, disk_enabled: !!data.checked })}
          />
        </Field>

        <Field className={styles.field} label="Process Check" size="medium">
          <div className={styles.processInputContainer}>
            <Input
              className={styles.processInput}
              placeholder="Enter process name (e.g., notepad.exe)"
              value={newProcess}
              onChange={(_, data) => setNewProcess(data.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newProcess.trim()) {
                  e.preventDefault();
                  addProcess("process_check", newProcess.trim());
                  setNewProcess("");
                }
              }}
            />
            <Tooltip content="Add process" relationship="label">
              <Button
                className={styles.addButton}
                icon={<AddRegular />}
                onClick={() => {
                  if (newProcess.trim()) {
                    addProcess("process_check", newProcess.trim());
                    setNewProcess("");
                  }
                }}
              />
            </Tooltip>
          </div>

          <div className={styles.processList}>
            {cfg.process_check.length === 0 ? (
              <span style={{ color: "gray", fontStyle: "italic" }}>
                No processes configured. Add processes to monitor.
              </span>
            ) : (
              cfg.process_check.map((process, index) => (
                <div key={index} className={styles.processItem}>
                  <span>{process}</span>
                  <span className={styles.deleteProcessButton} onClick={() => removeProcess("process_check", index)}>
                    <DeleteRegular fontSize={12} />
                  </span>
                </div>
              ))
            )}
          </div>
        </Field>

        <Field className={styles.field} label="Service Check" size="medium">
          <div className={styles.processInputContainer}>
            <Input
              className={styles.processInput}
              placeholder="Enter service name"
              value={newService}
              onChange={(_, data) => setNewService(data.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newService.trim()) {
                  e.preventDefault();
                  addProcess("service_check", newService.trim());
                  setNewService("");
                }
              }}
            />
            <Tooltip content="Add service" relationship="label">
              <Button
                className={styles.addButton}
                icon={<AddRegular />}
                onClick={() => {
                  if (newService.trim()) {
                    addProcess("service_check", newService.trim());
                    setNewService("");
                  }
                }}
              />
            </Tooltip>
          </div>

          <div className={styles.processList}>
            {cfg.service_check.length === 0 ? (
              <span style={{ color: "gray", fontStyle: "italic" }}>
                No services configured. Add services to monitor.
              </span>
            ) : (
              cfg.service_check.map((service, index) => (
                <div key={index} className={styles.processItem}>
                  <span>{service}</span>
                  <span className={styles.deleteProcessButton} onClick={() => removeProcess("service_check", index)}>
                    <DeleteRegular fontSize={12} />
                  </span>
                </div>
              ))
            )}
          </div>
        </Field>
      </Card>

      <div className={styles.buttonContainer}>
        <Button
          appearance="primary"
          onClick={save}
          disabled={isSubmitting || !cfg.host || !cfg.port || !cfg.topic || !cfg.username || !cfg.password}
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
