import { makeStyles, tokens } from "@fluentui/react-components";
import React, { ReactNode } from "react";

interface ScrollableContainerProps {
  children: ReactNode;
  height?: string | number;
  maxHeight?: string | number;
  width?: string | number;
  label?: string;
  labelId?: string;
  className?: string;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  label: {
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    width: "fit-content",
    fontWeight: tokens.fontWeightBold,
    padding: "2px 12px",
  },
  scrollable: {
    overflowY: "auto",
    boxShadow: tokens.shadow16,
    position: "relative",
    minWidth: "200px",
    minHeight: "300px",
    border: `2px solid ${tokens.colorBrandBackground}`,
    padding: "12px",
    flexGrow: 1,
    backgroundColor: tokens.colorNeutralBackground1,

    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: tokens.colorNeutralBackground3,
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: tokens.colorBrandBackground,
      borderRadius: "4px",
      "&:hover": {
        background: tokens.colorBrandBackgroundHover,
      },
    },

    // Firefox scrollbar styling
    scrollbarWidth: "thin",
    scrollbarColor: `${tokens.colorBrandBackground} ${tokens.colorNeutralBackground3}`,
  },
});

export const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  height,
  maxHeight,
  width,
  label,
  labelId,
  className,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.label} id={labelId}>
          {label}
        </div>
      )}
      <div
        role="log"
        aria-labelledby={labelId}
        className={`${styles.scrollable} ${className || ""}`}
        style={{
          height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
          maxHeight: maxHeight ? (typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight) : undefined,
          width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};
