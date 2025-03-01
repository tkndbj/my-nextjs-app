"use client";

import React, { useEffect } from "react";
import { useMarket } from "../../../context/MarketContext";
import { useSearchParams } from "next/navigation";
import styles from "./DynamicMarket.module.css"; // Ensure this file exists
import ProductCard from "../components/ProductCard"; // Adjust the path if needed

export default function DynamicMarketPage() {
  const {
    inputQuery,
    searchResults,
    isSearchLoading,
    categoryProducts,
    setCategoryProducts, // Exposed setter from context
    selectedCategory,
    selectedSubcategory,
    setSelectedCategory,
    setSelectedSubcategory,
    navigateToProductDetail,
    subcategories,
    ownerVerificationMap,
  } = useMarket();

  // When the page loads, check for a category in the URL query and update context.
  const searchParams = useSearchParams();
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, setSelectedCategory]);

  // Clear old products immediately when the selected category changes.
  useEffect(() => {
    return () => {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setCategoryProducts([]); // Optional: also clear the product list
    };
  }, [setSelectedCategory, setSelectedSubcategory, setCategoryProducts]);

  // Determine which products to display:
  // If a search query is active, use searchResults; otherwise, use categoryProducts.
  const productsToDisplay = inputQuery.trim()
    ? searchResults
    : categoryProducts;

  // Filter products: only show product if owner's verification is either true or not yet set.
  const filteredProducts = productsToDisplay.filter(
    (product) =>
      !ownerVerificationMap || ownerVerificationMap[product.ownerId] !== false
  );

  return (
    <div className={styles.dynamicMarketPage}>
      {/* Subcategories Row (if a category is selected) */}
      {selectedCategory && subcategories && subcategories[selectedCategory] && (
        <div className={styles.subcategories}>
          {subcategories[selectedCategory].map((subcat) => (
            <button
              key={subcat}
              onClick={() =>
                setSelectedSubcategory(
                  selectedSubcategory === subcat ? null : subcat
                )
              }
              className={
                selectedSubcategory === subcat
                  ? styles.selectedSubcategoryButton
                  : styles.subcategoryButton
              }
            >
              {subcat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <main className={styles.productList}>
        {isSearchLoading ? (
          <p>Loading products...</p>
        ) : filteredProducts && filteredProducts.length ? (
          <div className="mx-auto w-full max-w-7xl">
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigateToProductDetail(product.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p></p>
        )}
      </main>
    </div>
  );
}
