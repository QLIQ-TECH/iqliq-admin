import { useState, useEffect } from "react";

export const useDebouncedValue = <T>(value: T, delay: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);

    // Cleanup if value changes or component unmounts
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
