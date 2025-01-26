// src/app/components/SearchBar.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";
import { FaSearch, FaArrowLeft } from "react-icons/fa"; // Import FaArrowLeft
import { useMarket } from "../../../context/MarketContext";
import useIsMobile from "../../hooks/useIsMobile";
import clsx from "clsx";

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
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, isExpanded]);

  return (
    <>
      {isMobile && isExpanded && (
        <div
          className={styles.overlay}
          onClick={() => setIsExpanded(false)}
        ></div>
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
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            value={inputQuery}
            onChange={handleInputChange}
            placeholder="Search products..."
            className={styles.searchInput}
            onFocus={handleFocus}
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
    </>
  );
};

export default SearchBar;
