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

  // Load config from the main process or localStorage
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
      
      // Clear any errors if config loaded successfully
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

      // Set loading to false after attempting to load config regardless of success or failure
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    // Subscribe to config updated events
    const handleConfigUpdated = () => {
      loadConfig();
    };

    // Listen for config updates from the main process
    window.api.onConfigUpdated(handleConfigUpdated);

    return () => {

      // Cleanup: remove the event listener when the component unmounts
      window.api.offConfigUpdated(handleConfigUpdated);
    };
  }, []);

  // Function to update the config
  const updateConfig = async (newConfig: ConfigPayload) => {
    try {

      // Update the config in the main process and localStorage
      await window.api.updateConfig(newConfig);
      setConfig(newConfig);
      try {
        localStorage.setItem("app-config", JSON.stringify(newConfig));
      } catch (storageError) {
        console.warn("Failed to save config to localStorage:", storageError);
      }
      return true;
    } catch (err) {

      // Handle error updating config and set error state
      setError(err instanceof Error ? err : new Error('Unknown error updating config'));
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