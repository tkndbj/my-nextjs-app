// context/MarketContext.jsx

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  doc,
  setDoc,
  collection,
  increment,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useUser } from "./UserContext";
import { index } from "../src/app/algoliaClient"; // Import Algolia index
import { useDebounce } from "use-debounce"; // Import useDebounce hook
import { useRouter } from "next/navigation"; // Import useRouter from Next.js

// Create the context
const MarketContext = createContext();

// Utility function to sanitize field names
const sanitizeFieldName = (fieldName) => {
  return fieldName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
};

// Helper function to build Algolia filters (excluding category and subcategory)
const buildAlgoliaFilters = ({ showDeals, showFeatured, specialFilter }) => {
  const filters = [];

  if (showDeals) {
    filters.push("discountPercentage > 0");
  }

  if (showFeatured) {
    filters.push("isBoosted:true"); // Correct syntax for boolean
  }

  if (specialFilter) {
    if (specialFilter === "Trending") {
      filters.push("dailyClickCount > 10");
    } else if (specialFilter === "5-Star") {
      filters.push("averageRating:5"); // Correct syntax for equality
    }
  }

  // Removed category and subcategory filters

  return filters.join(" AND ");
};

// Create a provider component
export const MarketProvider = ({ children }) => {
  const [showDeals, setShowDeals] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [specialFilter, setSpecialFilter] = useState(null); // For "Trending" and "5-Star"
  const [sortOption, setSortOption] = useState(null); // Includes "best_sellers" and other sort options

  // States for category and subcategory
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // States for Firestore-based category products
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  // Access the authenticated user from UserContext
  const user = useUser();

  // States for search suggestions and queries
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const [inputQuery, setInputQuery] = useState(""); // For search bar input and suggestions
  const [searchQuery, setSearchQuery] = useState(""); // For actual search submissions

  // Debounce the input query to reduce API calls for suggestions
  const [debouncedInputQuery] = useDebounce(inputQuery, 300);

  // States for Algolia search results
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Initialize Next.js router for navigation
  const router = useRouter();

  /**
   * Fetches search suggestions from Algolia based on the user's input query.
   * @param {string} searchInput - The input query from the search bar.
   */
  const fetchSuggestions = async (searchInput) => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSuggestionsLoading(true);
    try {
      const { hits } = await index.search(searchInput, {
        hitsPerPage: 5, // Number of suggestions to fetch
        attributesToRetrieve: ["objectID", "productName"], // Ensure these fields are in your Algolia index
        // You can customize other search parameters as needed
      });
      setSuggestions(hits);
    } catch (error) {
      console.error("Error fetching Algolia suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // useEffect to fetch suggestions when debouncedInputQuery changes
  useEffect(() => {
    if (debouncedInputQuery) {
      fetchSuggestions(debouncedInputQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedInputQuery]);

  /**
   * Performs a search using Algolia with the current search query and applied filters.
   * Updates the searchResults state with the fetched products.
   */
  const performSearch = async () => {
    try {
      setIsSearchLoading(true);
      const searchParams = {
        hitsPerPage: 100, // Adjust as needed
        filters: buildAlgoliaFilters({
          showDeals,
          showFeatured,
          specialFilter,
          // Removed selectedCategory and selectedSubcategory
        }),
      };

      // Determine which index to use based on sortOption
      let currentIndex = index; // Default index

      // Example: If sortOption is "price_asc", use the "products_price_asc" replica
      // You need to create these replicas in your Algolia dashboard
      switch (sortOption) {
        case "price_asc":
          currentIndex = index.clone("products_price_asc");
          break;
        case "price_desc":
          currentIndex = index.clone("products_price_desc");
          break;
        case "best_sellers":
          currentIndex = index.clone("products_best_sellers");
          break;
        // Add more cases as needed for other sort options
        default:
          currentIndex = index; // Default to the main index
      }

      // Perform the search
      const { hits } = await currentIndex.search(searchQuery, searchParams);
      setSearchResults(hits);
      setSearchError(null);
    } catch (error) {
      console.error("Error performing Algolia search:", error);
      setSearchResults([]);
      setSearchError(error);
    } finally {
      setIsSearchLoading(false);
    }
  };

  /**
   * Fetches products from Firestore based on selected category and subcategory.
   * This function operates independently from Algolia's search functionality.
   */
  const fetchCategoryProducts = async () => {
    if (!selectedCategory) {
      setCategoryProducts([]);
      console.log("No category selected. Cleared categoryProducts.");
      return;
    }

    setIsCategoryLoading(true);
    setCategoryError(null);
    console.log(
      `Fetching products for Category: ${selectedCategory}, Subcategory: ${selectedSubcategory}`
    );

    try {
      const productsRef = collection(db, "products");
      let q;

      if (selectedSubcategory) {
        q = query(
          productsRef,
          where("category", "==", selectedCategory),
          where("subcategory", "==", selectedSubcategory)
        );
        console.log(
          `Query: category == "${selectedCategory}" AND subcategory == "${selectedSubcategory}"`
        );
      } else {
        q = query(productsRef, where("category", "==", selectedCategory));
        console.log(`Query: category == "${selectedCategory}"`);
      }

      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });

      console.log(`Fetched ${products.length} products from Firestore.`);
      setCategoryProducts(products);
    } catch (error) {
      console.error("Error fetching category products:", error);
      setCategoryError(error);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  /**
   * Handles search submissions, such as pressing Enter.
   * Sets the searchQuery which will trigger the product list update.
   * Optionally updates the URL's query parameter.
   * @param {string} searchTerm - The search term to query.
   */
  const handleSearchSubmit = (searchTerm) => {
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm);
      // Optionally, update the URL's query parameter for bookmarking/sharing
      router.push(`/?query=${encodeURIComponent(searchTerm)}`);
    } else {
      setSearchQuery("");
      router.push(`/`);
    }
    setSuggestions([]); // Optionally hide suggestions after search
  };

  /**
   * Navigates to the product detail page based on the product ID.
   * @param {string} productId - The ID of the product to navigate to.
   */
  const navigateToProductDetail = (productId) => {
    if (productId) {
      router.push(`/products/${productId}`);
    }
  };

  // Toggle Deals filter
  const toggleDeals = () => {
    setShowDeals((prev) => {
      const newShowDeals = !prev;
      if (newShowDeals) {
        setShowFeatured(false);
        setSpecialFilter(null);
        setSortOption(null); // Reset sort when a filter is applied
      }
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

  /**
   * useEffect to perform search whenever searchQuery or relevant filters change.
   */
  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    showDeals,
    showFeatured,
    specialFilter,
    sortOption,
    // Removed selectedCategory and selectedSubcategory
  ]);

  /**
   * useEffect to fetch category products whenever selectedCategory or selectedSubcategory changes.
   */
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryProducts();
    } else {
      setCategoryProducts([]); // Clear category products if no category is selected
      console.log("No category selected. Cleared categoryProducts.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory]);

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
    suggestions, // Added for search suggestions
    isSuggestionsLoading, // Added for loading state of suggestions
    fetchSuggestions, // Added to allow manual fetching if needed
    inputQuery, // Added to manage the search input state
    setInputQuery, // Added to allow updating the search input from components
    searchQuery, // Added to manage the submitted search query
    setSearchQuery, // Added to allow setting the search query from components
    handleSearchSubmit, // Renamed to reflect its purpose
    navigateToProductDetail, // Added to navigate to product detail programmatically
    searchResults, // Added to provide search results from Algolia
    isSearchLoading, // Added to provide loading state for search
    searchError, // Added to provide error state for search
    selectedCategory, // Exposed selectedCategory
    setSelectedCategory, // Exposed setter for selectedCategory
    selectedSubcategory, // Exposed selectedSubcategory
    setSelectedSubcategory, // Exposed setter for selectedSubcategory
    categoryProducts, // Exposed categoryProducts
    isCategoryLoading, // Exposed loading state for category products
    categoryError, // Exposed error state for category products
    // Include other states and functions as needed
  };

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useMarket = () => {
  return useContext(MarketContext);
};
