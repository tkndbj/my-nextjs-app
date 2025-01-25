// src/app/components/HomePageContent.jsx

"use client";

import React, { useEffect } from "react"; // Import useEffect
import ProductCard from "./components/ProductCard";
import Categories from "./components/Categories";
import SecondHeader from "./components/SecondHeader"; // Import the SecondHeader component
import SearchBar from "./components/SearchBar"; // Import the SearchBar component
import { useMarket } from "../../context/MarketContext";
import { useSearchParams } from "next/navigation";
import styles from "./components/HomePageContent.module.css"; // Import the CSS module

export default function HomePageContent() {
  // Access search-related states and results from MarketContext
  const {
    searchResults, // Products fetched from Algolia
    isSearchLoading,
    searchError,
    showDeals,
    showFeatured,
    specialFilter,
    sortOption,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    categoryProducts, // Products fetched based on category
    isCategoryLoading,
    categoryError,
  } = useMarket();

  const searchParams = useSearchParams();

  useEffect(() => {
    const queryParam = searchParams.get("query") || "";
    // Optionally, handle loading search from URL parameters here
    // For debugging, log the query parameter
    console.log(`URL Query Parameter: ${queryParam}`);
  }, [searchParams]);

  // Debugging: Log selectedCategory and categoryProducts
  useEffect(() => {
    console.log(`Selected Category: ${selectedCategory}`);
    console.log(`Selected Subcategory: ${selectedSubcategory}`);
    console.log(`Category Products Count: ${categoryProducts.length}`);
  }, [selectedCategory, selectedSubcategory, categoryProducts]);

  return (
    <>
      {/* Second Header */}
      <SecondHeader />

      {/* Search Bar */}
      <SearchBar />

      {/* Categories Section */}
      <div className="w-full" style={{ marginTop: "60px" }}>
        {/* Adjust margin to account for Header (38px), SecondHeader (38px), and SearchBar (38px) */}
        <div className="max-w-7xl mx-auto overflow-hidden">
          <Categories
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={setSelectedSubcategory}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-2 py-4 min-h-screen">
        {/* Determine which product list to display */}
        {isSearchLoading || isCategoryLoading ? (
          <p className="text-center text-foreground">Loading products...</p>
        ) : searchError ? (
          <p className="text-center text-red-500">
            Error fetching search results. Please try again later.
          </p>
        ) : categoryError ? (
          <p className="text-center text-red-500">
            Error fetching category products. Please try again later.
          </p>
        ) : searchResults.length > 0 ? (
          /* Display Algolia search results */
          <div className="mx-auto w-full max-w-7xl">
            <div className={styles.productGrid}>
              {searchResults.map((p) => (
                <ProductCard key={p.objectID} product={p} />
              ))}
            </div>
          </div>
        ) : selectedCategory ? (
          /* Display category-based products */
          categoryProducts.length > 0 ? (
            <div className="mx-auto w-full max-w-7xl">
              <div className={styles.productGrid}>
                {categoryProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-foreground">
              No products found in this category.
            </p>
          )
        ) : (
          /* Default view when no search or category is selected */
          <p className="text-center text-foreground">
            Please enter a search term or select a category to view products.
          </p>
        )}
      </div>
    </>
  );
}
