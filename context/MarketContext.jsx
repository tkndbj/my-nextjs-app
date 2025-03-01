"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
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
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { useUser } from "./UserContext";
import { index } from "../src/app/algoliaClient"; // Import Algolia index
import { useDebounce } from "use-debounce"; // Import useDebounce hook
import { useRouter } from "next/navigation"; // Import useRouter from Next.js
import {
  categories as categoriesData,
  subcategories as subcategoriesData,
} from "../src/app/data/categoriesData";

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

  // Optionally, you could add an Algolia filter for verified owners if your index has that field
  // filters.push("ownerVerified:true");

  return filters.join(" AND ");
};

// Helper: Fetch all verified owner IDs from the "users" collection.
async function fetchVerifiedOwnerIds() {
  const verifiedQuery = query(
    collection(db, "users"),
    where("verified", "==", true)
  );
  const snapshot = await getDocs(verifiedQuery);
  return snapshot.docs.map((doc) => doc.id);
}

// Create a provider component
export const MarketProvider = ({ children }) => {
  const [showDeals, setShowDeals] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [specialFilter, setSpecialFilter] = useState(null); // For "Trending" and "5-Star"
  const [sortOption, setSortOption] = useState(null); // Includes "best_sellers" and other sort options
  const ownerVerificationCache = useRef({});

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
      const searchParamsObj = {
        hitsPerPage: 100, // Adjust as needed
        filters: buildAlgoliaFilters({
          showDeals,
          showFeatured,
          specialFilter,
        }),
      };

      // Determine which index to use based on sortOption
      let currentIndex = index; // Default index
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
        default:
          currentIndex = index;
          break;
      }

      // Perform the search
      const { hits } = await currentIndex.search(searchQuery, searchParamsObj);
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
   * Fetches products from Firestore based on selected category and subcategory,
   * but only from owners who are verified. Because Firestore’s “in” clause is limited
   * to 10 values, we batch the verified owner IDs.
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

      // First, fetch all verified owner IDs
      const verifiedOwnerIds = await fetchVerifiedOwnerIds();
      if (verifiedOwnerIds.length === 0) {
        setCategoryProducts([]);
        return;
      }

      let allProducts = [];

      // Batch query verified owner IDs in groups of 10
      for (let i = 0; i < verifiedOwnerIds.length; i += 10) {
        const batch = verifiedOwnerIds.slice(i, i + 10);
        let q;
        if (selectedSubcategory) {
          q = query(
            productsRef,
            where("category", "==", selectedCategory),
            where("subcategory", "==", selectedSubcategory),
            where("ownerId", "in", batch)
          );
          console.log(
            `Query: category == "${selectedCategory}" AND subcategory == "${selectedSubcategory}" AND ownerId in batch`
          );
        } else {
          q = query(
            productsRef,
            where("category", "==", selectedCategory),
            where("ownerId", "in", batch)
          );
          console.log(
            `Query: category == "${selectedCategory}" AND ownerId in batch`
          );
        }
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          allProducts.push({ id: doc.id, ...doc.data() });
        });
      }

      console.log(`Fetched ${allProducts.length} products from Firestore.`);
      setCategoryProducts(allProducts);
    } catch (error) {
      console.error("Error fetching category products:", error);
      setCategoryError(error);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  /**
   * Fetches products from Firestore with pagination and other filters,
   * but only returns products whose owner is verified.
   */
  const fetchProductsFromFirestore = async ({
    page = 0,
    limit: queryLimit = 50,
    ignoreCategory = false,
  }) => {
    // We'll accumulate products from multiple batches.
    let allProducts = [];
    let lastDocument = null; // For pagination per batch

    try {
      const productsRef = collection(db, "products");

      // Get verified owner IDs
      const verifiedOwnerIds = await fetchVerifiedOwnerIds();
      if (verifiedOwnerIds.length === 0) return; // No verified owners; return empty

      // Batch the verified owner IDs in groups of 10
      for (let i = 0; i < verifiedOwnerIds.length; i += 10) {
        const batch = verifiedOwnerIds.slice(i, i + 10);
        let q = query(productsRef, where("ownerId", "in", batch));

        if (!ignoreCategory && selectedCategory) {
          q = query(q, where("category", "==", selectedCategory));
        }
        if (!ignoreCategory && selectedSubcategory) {
          q = query(q, where("subcategory", "==", selectedSubcategory));
        }
        // (Add additional filters such as price, deals, etc. if needed)

        // Apply sorting
        switch (sortOption) {
          case "alphabetical":
            q = query(q, orderBy("productName", "asc"));
            break;
          case "price_asc":
            q = query(q, orderBy("price", "asc"));
            break;
          case "price_desc":
            q = query(q, orderBy("price", "desc"));
            break;
          case "date":
          default:
            q = query(q, orderBy("createdAt", "desc"));
            break;
        }

        // For pagination: if page > 0 and lastDocument exists, use startAfter.
        if (page > 0 && lastDocument) {
          q = query(q, startAfter(lastDocument));
        }

        // Apply limit
        q = query(q, limit(queryLimit));

        const snapshot = await getDocs(q);
        snapshot.docs.forEach((doc) => {
          allProducts.push({ id: doc.id, ...doc.data() });
        });
        if (snapshot.docs.length > 0) {
          lastDocument = snapshot.docs[snapshot.docs.length - 1];
        }
      }

      // Here, you might update your internal state (e.g. _products) accordingly.
      // For example, if page === 0, you might clear old products:
      // setCategoryProducts(allProducts);
      // (This example directly uses setCategoryProducts for simplicity.)
      setCategoryProducts(allProducts);
    } catch (error) {
      console.error("Firestore fetch error:", error);
    } finally {
      // Optionally update filtering state.
    }
  };

  /**
   * Handles search submissions.
   */
  const handleSearchSubmit = (searchTerm) => {
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm);
      router.push(`/?query=${encodeURIComponent(searchTerm)}`);
    } else {
      setSearchQuery("");
      router.push(`/`);
    }
    setSuggestions([]);
  };

  /**
   * Navigates to the product detail page.
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
        setSortOption(null);
      }
      return newShowDeals;
    });
  };

  async function fetchOwnersVerificationStatus(ownerIds) {
    const result = {};
    if (!ownerIds || ownerIds.length === 0) return result;

    const ownersToQuery = [];
    ownerIds.forEach((ownerId) => {
      if (ownerVerificationCache.current.hasOwnProperty(ownerId)) {
        result[ownerId] = ownerVerificationCache.current[ownerId];
      } else {
        ownersToQuery.push(ownerId);
      }
    });

    if (ownersToQuery.length === 0) {
      return result;
    }

    for (let i = 0; i < ownersToQuery.length; i += 10) {
      const batch = ownersToQuery.slice(i, i + 10);
      try {
        const q = query(
          collection(db, "users"),
          where("__name__", "in", batch)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const data = doc.data();
          const verified = data.verified ?? false;
          ownerVerificationCache.current[doc.id] = verified;
          result[doc.id] = verified;
        });
        batch.forEach((ownerId) => {
          if (!(ownerId in result)) {
            ownerVerificationCache.current[ownerId] = false;
            result[ownerId] = false;
          }
        });
      } catch (error) {
        console.error("Error verifying owners for batch:", batch, error);
        batch.forEach((ownerId) => {
          ownerVerificationCache.current[ownerId] = false;
          result[ownerId] = false;
        });
      }
    }
    return result;
  }

  async function fetchOwnersVerificationForProducts(products) {
    const ownerIds = Array.from(new Set(products.map((p) => p.ownerId)));
    if (ownerIds.length === 0) return;
    await fetchOwnersVerificationStatus(ownerIds);
    // Optionally trigger a state update if needed.
  }

  async function fetchBoostedProducts() {
    // This is pseudocode—replace with your actual boosted products query.
    const snapshot = await queryBoostedProducts(); // pseudocode function
    const fetchedBoosted = snapshot.docs.map((doc) => Product.fromDoc(doc));

    await fetchOwnersVerificationForProducts(fetchedBoosted);

    const filteredBoosted = fetchedBoosted.filter(
      (p) => ownerVerificationCache.current[p.ownerId] === true
    );
    // You can update boosted products state here if needed.
  }

  // Toggle Featured filter
  const toggleFeatured = () => {
    setShowFeatured((prev) => {
      const newShowFeatured = !prev;
      if (newShowFeatured) {
        setShowDeals(false);
        setSpecialFilter(null);
        setSortOption(null);
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
        setSortOption(null);
      }
      return newFilter;
    });
  };

  // Set Sort Option
  const setSortOptionHandler = (option) => {
    setSortOption(option);
    if (option !== "best_sellers") {
      setShowDeals(false);
      setShowFeatured(false);
      setSpecialFilter(null);
    }
  };

  /**
   * Increments the clickCount and dailyClickCount for a product.
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
        const userId = data.userId; // Using userId field

        console.log(
          `Product ownerId: ${userId}, CurrentUserId: ${currentUserId}`
        );

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

        const updateData = {
          clickCount: increment(1),
          lastClickDate: serverTimestamp(),
        };

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
      const categoryClicksRef = doc(
        db,
        "users",
        userId,
        "preferences",
        "categoryClicks"
      );
      await setDoc(
        categoryClicksRef,
        { [category]: increment(1) },
        { merge: true }
      );

      const subcategoryClicksRef = doc(
        db,
        "users",
        userId,
        "preferences",
        "subcategoryClicks"
      );
      await setDoc(
        subcategoryClicksRef,
        { [subcategory]: increment(1) },
        { merge: true }
      );

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
          { count: increment(1) },
          { merge: true }
        );
      }

      console.log("Successfully recorded product click preferences.");
    } catch (error) {
      if (error.code === "not-found") {
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

  useEffect(() => {
    performSearch();
  }, [searchQuery, showDeals, showFeatured, specialFilter, sortOption]);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryProducts();
    } else {
      setCategoryProducts([]);
      console.log("No category selected. Cleared categoryProducts.");
    }
  }, [selectedCategory, selectedSubcategory]);

  const value = {
    categories: categoriesData,
    subcategories: subcategoriesData,
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
    suggestions,
    isSuggestionsLoading,
    fetchSuggestions,
    inputQuery,
    setInputQuery,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    navigateToProductDetail,
    searchResults,
    isSearchLoading,
    searchError,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    categoryProducts,
    isCategoryLoading,
    categoryError,
    ownerVerificationMap: ownerVerificationCache.current,
    setCategoryProducts,
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
