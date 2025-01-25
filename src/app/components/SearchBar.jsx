// src/app/components/SearchBar.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";
import { FaSearch } from "react-icons/fa";
import { useMarket } from "../../../context/MarketContext";

const SearchBar = () => {
  const {
    suggestions,
    isSuggestionsLoading,
    inputQuery,
    setInputQuery,
    handleSearchSubmit, // Updated to use the new search submission handler
    navigateToProductDetail,
  } = useMarket();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

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
    handleSearchSubmit(inputQuery); // Use the context's search submission handler
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    // Navigate to the product detail page using objectID
    navigateToProductDetail(suggestion.objectID);
    setShowSuggestions(false);
  };

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.searchBarContainer} ref={searchInputRef}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          value={inputQuery}
          onChange={handleInputChange}
          placeholder="Search products..."
          className={styles.searchInput}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          aria-label="Search products"
        />
        {isSuggestionsLoading && <div className={styles.loader}></div>}
      </form>
      {showSuggestions && suggestions.length > 0 && (
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
  );
};

export default SearchBar;
