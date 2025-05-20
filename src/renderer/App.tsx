import {
  FluentProvider,
  //Link,
  //MessageBar,
  //MessageBarBody,
  //MessageBarTitle,
  Spinner,
  webDarkTheme,
  webLightTheme,
  type Theme,
} from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { LogProvider } from "./context/LogContext";
import { MonitoringProvider } from "./context/MonitoringContext";
import Settings from "./pages/Configuration";
import Dashboard from "./pages/Dashboard";
import LogView from "./pages/LogView";

// Set the default theme based on the system preference
const shouldUseDarkColors = (): boolean =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

// Get the current theme based on the system preference
const getTheme = () => (shouldUseDarkColors() ? webDarkTheme : webLightTheme);

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    window.ContextBridge.onNativeThemeChanged(() => setTheme(getTheme()));
  }, []);

  return (
    <MonitoringProvider>
      <LogProvider>
        <FluentProvider theme={theme} style={{ height: "100vh", background: "transparent" }}>
          {isLoading ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Spinner size="huge" />
            </div>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "row",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <Sidebar theme={theme} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  gap: 20,
                  padding: 20,
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    flexGrow: 1,
                    overflowY: "auto",
                    scrollBehavior: "smooth",
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/logview" element={<LogView />} />
                    <Route path="/configuration" element={<Settings />} />
                  </Routes>
                </div>
                {/* 

                For future available update notification
                
                <MessageBar>
                  <MessageBarBody>
                    <MessageBarTitle>Update available</MessageBarTitle>
                    Click <Link>here</Link> to install.
                  </MessageBarBody>
                </MessageBar> */}
              </div>
            </div>
          )}
        </FluentProvider>
      </LogProvider>
    </MonitoringProvider>
  );
};
