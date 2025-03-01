"use client";

import React, { Suspense, useEffect } from "react";
import { useMarket } from "../../../context/MarketContext";
import { useSearchParams } from "next/navigation";
import styles from "./DynamicMarket.module.css";
import ProductCard from "../components/ProductCard";

function DynamicMarketContent() {
  const {
    inputQuery,
    searchResults,
    isSearchLoading,
    categoryProducts,
    setCategoryProducts,
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
      setCategoryProducts([]);
    };
  }, [setSelectedCategory, setSelectedSubcategory, setCategoryProducts]);

  // Determine which products to display:
  const productsToDisplay = inputQuery.trim()
    ? searchResults
    : categoryProducts;

  // Filter products: show product if owner's verification is true or not yet determined.
  const filteredProducts = productsToDisplay.filter(
    (product) =>
      !ownerVerificationMap || ownerVerificationMap[product.ownerId] !== false
  );

  return (
    <div className={styles.dynamicMarketPage}>
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
          <p>No products found.</p>
        )}
      </main>
    </div>
  );
}

export default function DynamicMarketPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicMarketContent />
    </Suspense>
  );
}
