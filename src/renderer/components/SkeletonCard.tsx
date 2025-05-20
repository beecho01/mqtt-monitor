import { Card, makeStyles, Skeleton, SkeletonItem } from "@fluentui/react-components";

const useStyles = makeStyles({
  card: {
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
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  valueRow: {
    display: "grid",
    gridTemplateColumns: "80% 20%",
    alignItems: "center",
    marginTop: "0px",
    marginBottom: "8px",
  },
  progressItem: {
    height: "4px",
    width: "calc(100% - 16px)",
  },
  valueItem: {
    height: "20px",
  },
  description: {
    width: "100%",
    height: "12px",
    marginTop: "8px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "8px",
    marginBottom: "8px",
  },
  iconPlaceholder: {
    width: "20px",
    height: "20px",
  },
  badgePlaceholder: {
    width: "60px",
    height: "20px",
    borderRadius: "10px",
  },
  cardContent: {
    marginTop: "0",
    padding: "0",
  },
});

interface SkeletonCardProps {
  variant?: "metric" | "status";
}

export const SkeletonCard = ({ variant = "metric" }: SkeletonCardProps) => {
  const styles = useStyles();

  return (
    <Card size="small" appearance="filled" className={styles.card}>
      {variant === "metric" ? (
        <Skeleton className={styles.content}>
          <SkeletonItem shape="rectangle" className={styles.description} />
          <div className={styles.valueRow}>
            <SkeletonItem className={styles.progressItem} />
            <SkeletonItem className={styles.valueItem} />
          </div>
        </Skeleton>
      ) : (
        <Skeleton className={styles.content}>
          <SkeletonItem shape="rectangle" className={styles.description} />
          <div className={styles.statusRow}>
            <SkeletonItem shape="circle" className={styles.iconPlaceholder} />
            <SkeletonItem shape="rectangle" className={styles.badgePlaceholder} />
          </div>
        </Skeleton>
      )}
    </Card>
  );
};
