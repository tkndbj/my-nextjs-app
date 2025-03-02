"use client";

import React, { Suspense, useEffect, useRef } from "react";
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

  const subcategoriesRef = useRef(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, setSelectedCategory]);

  useEffect(() => {
    return () => {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setCategoryProducts([]);
    };
  }, [setSelectedCategory, setSelectedSubcategory, setCategoryProducts]);

  const productsToDisplay = inputQuery.trim()
    ? searchResults
    : categoryProducts;

  const filteredProducts = productsToDisplay.filter(
    (product) =>
      !ownerVerificationMap || ownerVerificationMap[product.ownerId] !== false
  );

  // Scroll to active subcategory when it changes
  useEffect(() => {
    if (selectedSubcategory && subcategoriesRef.current) {
      const selectedButton = subcategoriesRef.current.querySelector(
        `.${styles.selectedSubcategoryButton}`
      );
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedSubcategory]);

  return (
    <div className={styles.dynamicMarketPage}>
      {selectedCategory && subcategories && subcategories[selectedCategory] && (
        <div className={styles.subcategories} ref={subcategoriesRef}>
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
