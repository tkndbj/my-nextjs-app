// src/app/components/Portal.js

"use client";

import { useEffect } from "react";
import ReactDOM from "react-dom";

const Portal = ({ children }) => {
  const el =
    typeof document !== "undefined" ? document.createElement("div") : null;

  useEffect(() => {
    if (el) {
      document.body.appendChild(el);
      return () => {
        document.body.removeChild(el);
      };
    }
  }, [el]);

  if (el) {
    return ReactDOM.createPortal(children, el);
  }

  return null;
};

export default Portal;
