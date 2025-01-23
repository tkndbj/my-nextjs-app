"use client";

import React, { createContext, useContext, useState } from "react";
import { db } from "../lib/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  updateDoc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { useUser } from "./UserContext";

// Create the context
const MarketContext = createContext();

// Utility function to sanitize field names
const sanitizeFieldName = (fieldName) => {
  return fieldName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
};

// Create a provider component
export const MarketProvider = ({ children }) => {
  const [showDeals, setShowDeals] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [specialFilter, setSpecialFilter] = useState(null); // For "Trending" and "5-Star"
  const [sortOption, setSortOption] = useState(null); // Includes "best_sellers" and other sort options

  // Access the authenticated user from UserContext
  const user = useUser();

  // Toggle Deals filter
  const toggleDeals = () => {
    setShowDeals((prev) => {
      const newShowDeals = !prev;
      if (newShowDeals) {
        setShowFeatured(false);
        setSpecialFilter(null);
        setSortOption(null); // Reset sort when a filter is applied
      }
      console.log("Toggled Deals:", newShowDeals);
      return newShowDeals;
    });
  };

  // Toggle Featured filter
  const toggleFeatured = () => {
    setShowFeatured((prev) => {
      const newShowFeatured = !prev;
      if (newShowFeatured) {
        setShowDeals(false);
        setSpecialFilter(null);
        setSortOption(null); // Reset sort when a filter is applied
      }
      console.log("Toggled Featured:", newShowFeatured);
      return newShowFeatured;
    });
  };

  // Set Special Filter ("Trending" or "5-Star")
  const setSpecialFilterType = (type) => {
    setSpecialFilter((prev) => {
      const newFilter = prev === type ? null : type;
      if (newFilter) {
        setShowDeals(false);
        setShowFeatured(false);
        setSortOption(null); // Reset sort when a filter is applied
      }
      console.log("Set Special Filter:", newFilter);
      return newFilter;
    });
  };

  // Set Sort Option
  const setSortOptionHandler = (option) => {
    setSortOption(option);
    // Reset filters when a sort option is selected, except for "best_sellers"
    if (option !== "best_sellers") {
      setShowDeals(false);
      setShowFeatured(false);
      setSpecialFilter(null);
    }
    console.log("Set Sort Option:", option);
  };

  /**
   * Increments the clickCount and dailyClickCount for a product.
   * Ensures that the user is not the owner of the product.
   * @param {string} productId - The ID of the product.
   */
  const incrementClickCount = async (productId) => {
    if (!user) {
      console.log("User not logged in. Skipping click count increment.");
      return;
    }

    const currentUserId = user.uid;
    const productRef = doc(db, "products", productId);

    try {
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error("Product does not exist!");
        }

        const data = productDoc.data();
        const userId = data.userId; // Changed from ownerId to userId

        console.log(
          `Product ownerId: ${userId}, CurrentUserId: ${currentUserId}`
        );

        // Skip if current user is the product owner
        if (userId && userId === currentUserId) {
          console.log("User is the product owner. Skipping increment.");
          return;
        }

        const lastClickTimestamp = data.lastClickDate;
        const nowUtc = new Date();
        let isSameDay = false;

        if (lastClickTimestamp) {
          const lastClickDate = lastClickTimestamp.toDate();
          isSameDay =
            lastClickDate.getUTCFullYear() === nowUtc.getUTCFullYear() &&
            lastClickDate.getUTCMonth() === nowUtc.getUTCMonth() &&
            lastClickDate.getUTCDate() === nowUtc.getUTCDate();
        }

        console.log(`Is same day: ${isSameDay}`);

        // Prepare update object
        const updateData = {
          clickCount: increment(1),
          lastClickDate: serverTimestamp(),
        };

        // Adjust daily click count based on date
        if (isSameDay) {
          updateData.dailyClickCount = increment(1);
        } else {
          updateData.dailyClickCount = 1;
        }

        console.log("Update data:", updateData);

        transaction.update(productRef, updateData);
      });

      
    } catch (error) {
      console.error("Error incrementing click count:", error);
      throw error;
    }
  };

  /**
   * Records the product click into the user's preferences.
   * Updates categoryClicks, subcategoryClicks, and discountClicks.
   * @param {Object} product - The product object.
   */
  const recordProductClick = async (product) => {
    if (!user) {
      console.log("User not logged in. Skipping preference recording.");
      return;
    }

    const userId = user.uid;
    const category = sanitizeFieldName(product.category ?? "Unknown");
    const subcategory = sanitizeFieldName(product.subcategory ?? "Unknown");
    const hasDiscount = (product.discountPercentage ?? 0) > 0;

    try {
      // Category Clicks
      const categoryClicksRef = doc(
        db,
        "users",
        userId,
        "preferences",
        "categoryClicks"
      );
      await setDoc(
        categoryClicksRef,
        {
          [category]: increment(1),
        },
        { merge: true } // Correct usage with setDoc
      );

      // Subcategory Clicks
      const subcategoryClicksRef = doc(
        db,
        "users",
        userId,
        "preferences",
        "subcategoryClicks"
      );
      await setDoc(
        subcategoryClicksRef,
        {
          [subcategory]: increment(1),
        },
        { merge: true } // Correct usage with setDoc
      );

      // Discount Clicks
      if (hasDiscount) {
        const discountClicksRef = doc(
          db,
          "users",
          userId,
          "preferences",
          "discountClicks"
        );
        await setDoc(
          discountClicksRef,
          {
            count: increment(1),
          },
          { merge: true } // Correct usage with setDoc
        );
      }

      console.log("Successfully recorded product click preferences.");
    } catch (error) {
      if (error.code === "not-found") {
        // If document doesn't exist, create it
        try {
          const categoryClicksRef = doc(
            db,
            "users",
            userId,
            "preferences",
            "categoryClicks"
          );
          const subcategoryClicksRef = doc(
            db,
            "users",
            userId,
            "preferences",
            "subcategoryClicks"
          );
          const discountClicksRef = doc(
            db,
            "users",
            userId,
            "preferences",
            "discountClicks"
          );

          await setDoc(categoryClicksRef, { [category]: 1 }, { merge: true });
          await setDoc(
            subcategoryClicksRef,
            { [subcategory]: 1 },
            { merge: true }
          );

          if (hasDiscount) {
            await setDoc(discountClicksRef, { count: 1 }, { merge: true });
          }

          console.log(
            "Successfully created and recorded product click preferences."
          );
        } catch (setError) {
          console.error("Error creating preference documents:", setError);
        }
      } else {
        console.error("Error updating user preferences:", error);
      }
    }
  };

  const value = {
    showDeals,
    toggleDeals,
    showFeatured,
    toggleFeatured,
    specialFilter,
    setSpecialFilter: setSpecialFilterType,
    sortOption,
    setSortOption: setSortOptionHandler,
    incrementClickCount,
    recordProductClick,
  };

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useMarket = () => {
  return useContext(MarketContext);
};