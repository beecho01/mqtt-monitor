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
import Settings from "./pages/Configuration";
import Dashboard from "./pages/Dashboard";
import LogView from "./pages/LogView";

const shouldUseDarkColors = (): boolean =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

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
            overflow: "hidden", // Prevents outer container from scrolling
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
              overflow: "hidden", // Prevents this container from scrolling
            }}
          >
            <div
              style={{
                flexGrow: 1,
                overflowY: "auto", // Enables vertical scrolling for content area
                scrollBehavior: "smooth",
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/logview" element={<LogView />} />
                <Route path="/configuration" element={<Settings />} />
              </Routes>
            </div>
            {/* <MessageBar>
              <MessageBarBody>
                <MessageBarTitle>Update available</MessageBarTitle>
                Click <Link>here</Link> to install.
              </MessageBarBody>
            </MessageBar> */}
          </div>
        </div>
      )}
    </FluentProvider>
  );
};
