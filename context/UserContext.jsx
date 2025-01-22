// ./src/context/UserContext.jsx

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../lib/firebase"; // Adjust path if necessary
import { onAuthStateChanged } from "firebase/auth";

// Create the context
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

// Custom hook for easy access to the context
export const useUser = () => {
  return useContext(UserContext);
};
