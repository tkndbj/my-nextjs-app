"use client";

import React from "react";
import styles from "./SearchBar.module.css";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Optional: Implement additional search submission logic here
  };

  return (
    <div className={styles.searchBarContainer}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search products..."
          className={styles.searchInput}
        />
      </form>
    </div>
  );
};

export default SearchBar;
