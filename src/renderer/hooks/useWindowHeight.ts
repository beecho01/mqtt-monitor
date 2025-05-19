import { useEffect, useState } from "react";

type HeightCalculation = {
  percentage: number;
  offset?: number; // Optional pixel offset
};

/**
 * A hook that returns a height value based on window dimensions with optional offset
 * @param config - Either a percentage (0-100) or a configuration object with percentage and offset
 * @returns The calculated height in pixels
 */
export function useWindowHeight(config: number | HeightCalculation = 70): number {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    // Calculate initial height
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      let percentage: number;
      let offset: number = 0;

      if (typeof config === "number") {
        percentage = config;
      } else {
        percentage = config.percentage;
        offset = config.offset || 0;
      }

      // Calculate height as percentage of window height minus offset
      const calculatedHeight = (windowHeight * percentage) / 100 - offset;
      setHeight(calculatedHeight > 0 ? calculatedHeight : 0); // Ensure height is not negative
    };

    // Set initial height
    calculateHeight();

    // Add resize event listener
    window.addEventListener("resize", calculateHeight);

    // Clean up
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, [config]);

  return height;
}
