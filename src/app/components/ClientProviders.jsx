// src/app/components/ClientProviders.jsx

"use client";

import React, { useEffect } from "react";
import { MarketProvider } from "../../../context/MarketContext"; // Adjust the path as needed
import { UserProvider } from "../../../context/UserContext"; // Adjust the path as needed
import Modal from "react-modal";

const ClientProviders = ({ children }) => {
  useEffect(() => {
    // Directly set the app element to body
    Modal.setAppElement("body");
  }, []);

  return (
    <UserProvider>
      <MarketProvider>{children}</MarketProvider>
    </UserProvider>
  );
};

export default ClientProviders;
