// src/app/components/SearchBar.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";
import { FaSearch, FaArrowLeft } from "react-icons/fa"; // Import FaArrowLeft
import { useMarket } from "../../../context/MarketContext";
import useIsMobile from "../../hooks/useIsMobile";
import clsx from "clsx";
import ProductCard from "./ProductCard"; // Adjust the path if necessary
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Ensure this path is correct

const SearchBar = () => {
  const {
    suggestions,
    isSuggestionsLoading,
    inputQuery,
    setInputQuery,
    handleSearchSubmit,
    navigateToProductDetail,
  } = useMarket();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [topProducts, setTopProducts] = useState([]); // New state for top products
  const searchInputRef = useRef(null);
  const isMobile = useIsMobile();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputQuery(value);
    if (value.trim() !== "") {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearchSubmit(inputQuery);
    setShowSuggestions(false);
    if (isMobile) setIsExpanded(false);
  };

  const handleSuggestionClick = (suggestion) => {
    navigateToProductDetail(suggestion.objectID);
    setShowSuggestions(false);
    if (isMobile) setIsExpanded(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        if (isMobile) setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isMobile && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isExpanded]);

  const handleFocus = () => {
    if (isMobile) {
      setIsExpanded(true);
    }
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  useEffect(() => {
    if (isMobile && isExpanded && searchInputRef.current) {
      const inputElement = searchInputRef.current.querySelector("input");
      if (inputElement) inputElement.focus();
    }
  }, [isMobile, isExpanded]);

  useEffect(() => {
    if (isMobile && isExpanded) {
      document.body.style.overflow = "hidden";
      fetchTopProducts(); // Fetch top products when expanded
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, isExpanded]);

  // Function to fetch top 20 products sorted by clickCount descending
  const fetchTopProducts = async () => {
    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("clickCount", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTopProducts(products);
    } catch (error) {
      console.error("Error fetching top products:", error);
    }
  };

  return (
    <>
      {isMobile && isExpanded && (
        <div className={styles.overlay} onClick={() => setIsExpanded(false)}>
          <div
            className={styles.overlayContent}
            onClick={(e) => e.stopPropagation()} // Prevent overlay click when interacting with content
          >
            {/* Loader inside overlay */}
            {isSuggestionsLoading && <div className={styles.loader}></div>}

            {/* Suggestions inside overlay for mobile */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className={styles.mobileSuggestionsList}>
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.objectID}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.productName || "No Name Available"}
                  </li>
                ))}
              </ul>
            )}

            {/* Most Viewed Products Section */}
            <div className={styles.mostViewedSection}>
              <h3 className={styles.mostViewedTitle}>Most Viewed Products</h3>
              <div className={styles.productCardsContainer}>
                {topProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* Future components can be rendered here */}
          </div>
        </div>
      )}

      <div
        className={clsx(styles.searchBarContainer, {
          [styles.expanded]: isMobile && isExpanded,
        })}
        ref={searchInputRef}
      >
        {/* Back Icon */}
        {isMobile && isExpanded && (
          <button
            className={styles.backButton}
            onClick={() => setIsExpanded(false)}
            aria-label="Close search"
          >
            <FaArrowLeft />
          </button>
        )}

        <form className={styles.searchForm} onSubmit={handleSubmit}>
          {/* Apply the expandedSearchIcon class conditionally */}
          <FaSearch
            className={clsx(styles.searchIcon, {
              [styles.expandedSearchIcon]: isMobile && isExpanded,
            })}
          />
          <input
            type="text"
            value={inputQuery}
            onChange={handleInputChange}
            placeholder="Search products..."
            className={clsx(styles.searchInput, {
              [styles.expandedInput]: isMobile && isExpanded,
            })}
            onFocus={handleFocus}
            aria-label="Search products"
          />
          {isSuggestionsLoading && <div className={styles.loader}></div>}
        </form>

        {/* Suggestions Dropdown for Desktop */}
        {!isMobile && showSuggestions && suggestions.length > 0 && (
          <ul className={styles.suggestionsList}>
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.objectID}
                className={styles.suggestionItem}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.productName || "No Name Available"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default SearchBar;
