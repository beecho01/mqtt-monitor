import { Badge, Card, CardHeader, ProgressBar, Text, makeStyles, mergeClasses } from "@fluentui/react-components";
import { ReactElement, ReactNode } from "react";

interface Props {
  label: string;
  value: number | ReactNode;
  suffix?: string;
  valueAsNode?: boolean;
  description?: string;
  showProgress?: boolean;
}

const useStyles = makeStyles({
  card: {
    width: "100%",
    minWidth: "240px",
    maxWidth: "100%",
    height: "fit-content",
    padding: "12px 16px",
    borderRadius: "8px",
  },
  flex: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  spread: {
    justifyContent: "space-between",
  },
  progressBar: {
    width: "80%",
  },
  valueContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "8px",
    marginBottom: "8px",
  },
  statusValue: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  description: {
    fontSize: "12px",
    color: "gray",
    marginTop: "8px",
    display: "block",
  },
});

export const MetricCard = ({
  label,
  value,
  suffix = "%",
  valueAsNode = false,
  description = "",
  showProgress = true,
}: Props): ReactElement => {
  const styles = useStyles();

  // Function to determine FluentUI badge appearance based on status
  const getBadgeAppearance = (status: string) => {
    status = status.toLowerCase();
    if (status === "running") return "filled";
    if (status === "stopped" || status === "not running") return "tint";
    if (status === "pending" || status === "starting") return "ghost";
    return "outline";
  };

  return (
    <Card size="small" appearance="filled" className={styles.card}>
      <CardHeader
        header={
          <div className={mergeClasses(styles.flex, styles.spread)}>
            <Text weight="semibold">{label}</Text>
          </div>
        }
      />

      {valueAsNode ? (
        <div className={styles.valueContainer}>
          <div className={styles.statusValue}>
            {value}
            {suffix && <Badge appearance={getBadgeAppearance(suffix)}>{suffix}</Badge>}
          </div>
        </div>
      ) : (
        <div className={mergeClasses(styles.flex, styles.spread)}>
          {showProgress && <ProgressBar value={Number(value) / 100} className={styles.progressBar} />}
          <span>
            <Text size={200} weight="regular">
              {typeof value === "number" ? value.toFixed(1) : value}
              {suffix}
            </Text>
          </span>
        </div>
      )}

      {description && <Text className={styles.description}>{description}</Text>}
    </Card>
  );
};
