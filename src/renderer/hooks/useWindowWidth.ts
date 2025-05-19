import { useEffect, useState } from "react";

type WidthCalculation = {
  percentage: number;
  offset?: number; // Optional pixel offset
};

/**
 * A hook that returns a width value based on window dimensions with optional offset
 * @param config - Either a percentage (0-100) or a configuration object with percentage and offset
 * @returns The calculated width in pixels
 */
export function useWindowWidth(config: number | WidthCalculation = 70): number {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    // Calculate initial width
    const calculateWidth = () => {
      const windowWidth = window.innerWidth;
      let percentage: number;
      let offset: number = 0;

      if (typeof config === "number") {
        percentage = config;
      } else {
        percentage = config.percentage;
        offset = config.offset || 0;
      }

      // Calculate width as percentage of window width minus offset
      const calculatedWidth = (windowWidth * percentage) / 100 - offset;
      setWidth(calculatedWidth > 0 ? calculatedWidth : 0); // Ensure width is not negative
    };

    // Set initial width
    calculateWidth();

    // Add resize event listener
    window.addEventListener("resize", calculateWidth);

    // Clean up
    return () => {
      window.removeEventListener("resize", calculateWidth);
    };
  }, [config]);

  return width;
}
