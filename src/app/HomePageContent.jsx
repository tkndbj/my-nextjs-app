// src/app/components/HomePageContent.jsx

"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import ProductCard from "./components/ProductCard";
import Header from "./components/Header";
import Categories from "./components/Categories";
import { useMarket } from "../../context/MarketContext";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./components/HomePageContent.module.css"; // Import the CSS module

export default function HomePageContent() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // State for categories
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const { showDeals, showFeatured, specialFilter, sortOption } = useMarket();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryParam = searchParams.get("query") || "";
    setSearchQuery(queryParam);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const qRef = collection(db, "products");
        const qConstraints = [];

        // Text-based search
        if (searchQuery.trim()) {
          qConstraints.push(where("name", ">=", searchQuery));
          qConstraints.push(where("name", "<=", searchQuery + "\uf8ff"));
        }

        // Deals / Featured / Special filter
        if (showDeals) {
          qConstraints.push(where("discountPercentage", ">", 0));
        }
        if (showFeatured) {
          qConstraints.push(where("isBoosted", "==", true));
        }
        if (specialFilter) {
          if (specialFilter === "Trending") {
            qConstraints.push(where("dailyClickCount", ">", 10));
          } else if (specialFilter === "5-Star") {
            qConstraints.push(where("averageRating", "==", 5));
          }
        }

        // Category / Subcategory filters
        if (selectedCategory) {
          qConstraints.push(where("category", "==", selectedCategory));
        }
        if (selectedSubcategory) {
          qConstraints.push(where("subcategory", "==", selectedSubcategory));
        }

        // Sorting
        if (sortOption) {
          switch (sortOption) {
            case "date":
              qConstraints.push(orderBy("createdAt", "desc"));
              break;
            case "alphabetical":
              qConstraints.push(orderBy("name", "asc"));
              break;
            case "price_asc":
              qConstraints.push(orderBy("price", "asc"));
              break;
            case "price_desc":
              qConstraints.push(orderBy("price", "desc"));
              break;
            case "best_sellers":
              qConstraints.push(orderBy("purchaseCount", "desc"));
              break;
            default:
              break;
          }
        }

        // Execute Firestore query
        const qFinal = query(qRef, ...qConstraints);
        const querySnapshot = await getDocs(qFinal);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Boosted products first
        const boostedProducts = items.filter((p) => p.isBoosted);
        const otherProducts = items.filter((p) => !p.isBoosted);
        const sortedProducts = [...boostedProducts, ...otherProducts];

        setProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    }

    fetchProducts();
  }, [
    searchQuery ?? "",
    showDeals ?? false,
    showFeatured ?? false,
    specialFilter ?? "",
    sortOption ?? "",
    selectedCategory ?? "",
    selectedSubcategory ?? "",
  ]);

  return (
    <>
      <Header />

      {/* Categories Section */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto overflow-hidden">
          <Categories
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategorySelect={setSelectedCategory}
            onSubcategorySelect={setSelectedSubcategory}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-2 py-4 min-h-screen">
        {products.length === 0 ? (
          <p className="text-center text-foreground">No products found.</p>
        ) : (
          <div className="mx-auto w-full max-w-7xl">
            <div className={styles.productGrid}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
