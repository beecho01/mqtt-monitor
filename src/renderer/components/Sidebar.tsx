import { makeStyles, mergeClasses, Tab, TabList, type Theme } from "@fluentui/react-components";
import { BugRegular, HomeRegular, SettingsRegular } from "@fluentui/react-icons";
import { useLocation, useNavigate } from "react-router-dom";

const useStyles = makeStyles({
  card: {
    maxWidth: "100%",
    height: "fit-content",
    padding: "12px 16px",
  },

  flex: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    gap: "8px",
  },

  spread: {
    justifyContent: "space-between",
  },

  progressBar: {
    width: "85%",
  },
});

export const Sidebar = ({ theme }: { theme: Theme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const styles = useStyles();

  const handleTabSelect = (selectedTab: string) => {
    navigate(selectedTab);
  };

  return (
    <div
      style={{
        height: "100%",
        width: 200,
        display: "flex",
        flexDirection: "column",
        borderRightWidth: 1,
        borderRightColor: theme.colorNeutralStroke3,
        borderRightStyle: "solid",
        gap: 10,
        padding: 20,
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <div style={{ flexGrow: 1 }}>
        <TabList
          vertical
          selectedValue={location.pathname}
          onTabSelect={(_, data) => handleTabSelect(data.value as string)}
          appearance="subtle"
          className={mergeClasses(styles.flex, styles.spread)}
        >
          <div>
            <Tab icon={<HomeRegular />} value="/">
              Dashboard
            </Tab>
            <Tab icon={<BugRegular />} value="/logview">
              Log View
            </Tab>
          </div>
          <Tab icon={<SettingsRegular />} value="/configuration">
            Configuration
          </Tab>
        </TabList>
      </div>
    </div>
  );
};
