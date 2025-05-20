import { useEffect, useState } from "react";

type WidthCalculation = {
  percentage: number;
  offset?: number;
};

// Returns a width value based on window dimensions with an optional offset. Returns value in pixels.
export function useWindowWidth(config: number | WidthCalculation = 70): number {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    // Calculate initial width
    const calculateWidth = () => {
      const windowWidth = window.innerWidth;
      let percentage: number;
      let offset: number = 0;

      // Check if config is only the percentage value
      if (typeof config === "number") {
        percentage = config;
      } else {

        // If config is an object, get percentage and offset
        percentage = config.percentage;
        offset = config.offset || 0;
      }

      // Calculate width as percentage of window width minus the offset
      const calculatedWidth = (windowWidth * percentage) / 100 - offset;

      // Ensure that the width is not negative. If it is, set it to 0
      setWidth(calculatedWidth > 0 ? calculatedWidth : 0);
    };

    // Set initial width
    calculateWidth();

    // Add resize event listener
    window.addEventListener("resize", calculateWidth);

    return () => {

      // Cleanup: remove the event listener when the component unmounts
      window.removeEventListener("resize", calculateWidth);
    };
  }, [config]);

  // Return the calculated width
  return width;
}
