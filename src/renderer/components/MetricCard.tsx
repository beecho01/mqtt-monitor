import { Card, CardHeader, ProgressBar, Text, makeStyles, mergeClasses } from "@fluentui/react-components";
import { ReactElement } from "react";

interface Props {
  label: string;
  value: number;
  suffix?: string;
}

const useStyles = makeStyles({
  card: {
    maxWidth: "100%",
    height: "fit-content",
    padding: "12px 16px",
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
    width: "85%",
  },
});

export const MetricCard = ({ label, value, suffix = "%" }: Props): ReactElement => { 
   const styles = useStyles();
  return (
  <Card size="small" appearance="outline" className={ styles.card } >
    <CardHeader header={
      <div className={ mergeClasses(styles.flex, styles.spread) }>
        <Text weight="semibold">{label}</Text>
      </ div>
    } 
    />
    <footer className={mergeClasses(styles.flex, styles.spread)}>
      <ProgressBar value={value / 100} className={ styles.progressBar } />
      <span>
        <Text size={200} weight="regular">
          {value}{suffix}
        </Text>
      </span>
    </footer>
  </Card>
)};
