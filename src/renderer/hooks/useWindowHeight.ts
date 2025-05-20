import { useEffect, useState } from "react";

type HeightCalculation = {
  percentage: number;
  offset?: number;
};

// Returns a height value based on window dimensions with an optional offset. Returns value in pixels.
export function useWindowHeight(config: number | HeightCalculation = 70): number {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    // Calculate initial height
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
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

      // Calculate height as percentage of window height minus the offset
      const calculatedHeight = (windowHeight * percentage) / 100 - offset;

      // Ensure that the height is not negative. If it is, set it to 0
      setHeight(calculatedHeight > 0 ? calculatedHeight : 0);
    };

    // Set initial height
    calculateHeight();

    // Add resize event listener
    window.addEventListener("resize", calculateHeight);

    return () => {

      // Cleanup: remove the event listener when the component unmounts
      window.removeEventListener("resize", calculateHeight);
    };
  }, [config]);

  // Return the calculated height
  return height;
}
