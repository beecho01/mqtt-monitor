import {
  Button,
  Field,
  Input,
  Card,
  makeStyles,
  Toast,
  useToastController,
  Text,
  ToastTitle,
  Textarea,
  SpinButton,
} from "@fluentui/react-components";
import { SaveRegular } from "@fluentui/react-icons";
import { useState } from "react";
import { CustomDivider } from "../components/CustomDivider";

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
  },
  form: {
    display: "flex",
    flexDirection: "column",
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
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  }
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
    service_check: []
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
        { position: "top", intent: "success" }
      );
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          Failed to save configuration. Please try again.
        </Toast>,
        { position: "top", intent: "error" }
      );
      console.error("Error saving configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayChange = (field: keyof ConfigPayload, value: string) => {
    if (field === 'process_check' || field === 'service_check') {
      const items = value.split('\n').map(item => item.trim()).filter(item => item);
      setCfg({ ...cfg, [field]: items });
    }
  };

  return (
      <div>
        <div className={styles.header}>
          <h1>Server Configuration</h1>
        </div>
        
        <Card>
          <div className={styles.form}>

              <Text 
                size={400}
                className={styles.sectionHeader}
              >
                Device/Topic Settings
              </Text>

              <Field 
                label="Server Topic Name"
                required
                validationMessage={!cfg.topic ? "Device/Topic name is required" : undefined}  
              >
                <Input
                  value={cfg.topic}
                  onChange={(_, d) => setCfg({ ...cfg, topic: d.value })}
                />
              </Field>

              <CustomDivider />
              <Text 
                size={400}
                className={styles.sectionHeader}
              >
                MQTT Connection Settings
              </Text>
              
              <Field 
                label="MQTT Broker Host Address or IP"
                required
                validationMessage={!cfg.host ? "Host address is required" : undefined}
              >
                <Input
                  value={cfg.host}
                  onChange={(_, d) => setCfg({ ...cfg, host: d.value })}
                />
              </Field>

              <Field 
                label="MQTT Broker Port" 
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
                <Field label="MQTT Username">
                  <Input
                    value={cfg.username}
                    onChange={(_, d) => setCfg({ ...cfg, username: d.value })}
                    placeholder="Username"
                  />
                </Field>
                
                <Field label="MQTT Password">
                  <Input
                    type="password"
                    value={cfg.password}
                    onChange={(_, d) => setCfg({ ...cfg, password: d.value })}
                    placeholder="Password"
                  />
                </Field>
              </div>

              <CustomDivider />
              <Text 
                size={400}
                className={styles.sectionHeader}
              >
                Timing Configuration
              </Text>

              <div className={styles.columns}>
                <Field label="Status Update Interval (seconds)">
                  <SpinButton
                    value={cfg.status_update_interval}
                    onChange={(_, data) => setCfg({ ...cfg, status_update_interval: data.value ?? 0 })}
                    min={1}
                    max={3600}
                    step={1}
                  />
                </Field>

                <Field label="MQTT Reconnect Min Delay (seconds)">
                  <SpinButton
                    value={cfg.mqtt_reconnect_min_delay}
                    onChange={(_, data) => setCfg({ ...cfg, mqtt_reconnect_min_delay: data.value ?? cfg.mqtt_reconnect_min_delay })}
                    min={1}
                    max={60}
                    step={1}
                  />
                </Field>
                
                <Field label="MQTT Reconnect Max Delay (seconds)">
                  <SpinButton
                    value={cfg.mqtt_reconnect_max_delay}
                    onChange={(_, data) => setCfg({ ...cfg, mqtt_reconnect_max_delay: data.value ?? cfg.mqtt_reconnect_max_delay })}
                    min={10}
                    max={600}
                    step={10}
                  />
                </Field>
              </div>
              
              <CustomDivider />
              <Text 
                size={400}
                className={styles.sectionHeader}
              >
                Monitoring Configuration
              </Text>
              
              <Field label="Process Check (one per line)">
                <Textarea
                  value={cfg.process_check.join('\n')}
                  onChange={(_, data) => handleArrayChange('process_check', data.value)}
                  placeholder="Enter processes to monitor, one per line"
                  style={{ height: '120px' }}
                />
              </Field>
              
              <Field label="Service Check (one per line)">
                <Textarea
                  value={cfg.service_check.join('\n')}
                  onChange={(_, data) => handleArrayChange('service_check', data.value)}
                  placeholder="Enter services to monitor, one per line"
                  style={{ height: '120px' }}
                />
              </Field>
            </div>

            <div className={styles.buttonContainer}>
              <Button 
                appearance="primary" 
                onClick={save} 
                disabled={isSubmitting || !cfg.host || !cfg.port || !cfg.topic}
                icon={<SaveRegular />}
                className={styles.button}
              >
                {isSubmitting ? "Saving..." : "Save & Publish"}
              </Button>
            </div>
        </Card>
      </div>
  );
}
