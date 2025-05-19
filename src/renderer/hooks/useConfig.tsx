import { ConfigPayload } from "@shared/types";
import { useEffect, useState } from "react";

export const useConfig = () => {
  const [config, setConfig] = useState<ConfigPayload>({
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
    cpu_enabled: true,
    memory_enabled: true,
    disk_enabled: true,
    uptime_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const savedConfig = await window.api.getConfig();
      console.log("Config loaded:", savedConfig);
      
      // Type guard to ensure we have a valid config
      if (savedConfig && typeof savedConfig === "object") {
        setConfig({
          ...config,
          ...savedConfig,
        });
      }
      
      setError(null);
    } catch (err) {
      console.error("Error loading configuration:", err);
      setError(err instanceof Error ? err : new Error('Unknown error loading config'));
      
      // Try to load from localStorage as fallback
      const storedConfig = localStorage.getItem("app-config");
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig);
          setConfig((prev) => ({
            ...prev,
            ...parsedConfig,
          }));
        } catch (parseError) {
          console.error("Error parsing stored config:", parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    // Subscribe to config updated events
    const handleConfigUpdated = () => {
      loadConfig();
    };

    window.api.onConfigUpdated(handleConfigUpdated);

    return () => {
      window.api.offConfigUpdated(handleConfigUpdated);
    };
  }, []);

  const updateConfig = async (newConfig: ConfigPayload) => {
    try {
      await window.api.updateConfig(newConfig);
      setConfig(newConfig);
      
      // Also update localStorage
      try {
        localStorage.setItem("app-config", JSON.stringify(newConfig));
      } catch (storageError) {
        console.warn("Failed to save config to localStorage:", storageError);
      }
      
      return true;
    } catch (err) {
      console.error("Error updating config:", err);
      return false;
    }
  };

  return {
    config,
    updateConfig,
    loading,
    error,
    reload: loadConfig,
  };
};