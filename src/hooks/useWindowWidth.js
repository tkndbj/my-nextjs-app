// src/hooks/useWindowWidth.js

import { useState, useEffect } from "react";

const useWindowWidth = () => {
  const isClient = typeof window === "object";

  const getWidth = () => (isClient ? window.innerWidth : undefined);

  const [windowWidth, setWindowWidth] = useState(getWidth);

  useEffect(() => {
    if (!isClient) {
      return false;
    }

    const handleResize = () => {
      setWindowWidth(getWidth());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  return windowWidth;
};

export default useWindowWidth;
