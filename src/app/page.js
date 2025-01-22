// src/app/page.jsx

"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import ProductCard from "./components/ProductCard";
import Header from "./components/Header";
import Categories from "./components/Categories";
import MarketBanner from "./components/MarketBanner";
import FilterSortRow from "./components/FilterSortRow";
import { useMarket } from "../../context/MarketContext";
import Sidebar from "./components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { FaPlus } from "react-icons/fa";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Access Market Context
  const { showDeals, showFeatured, specialFilter, sortOption } = useMarket();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams(); // Initialize useSearchParams

  useEffect(() => {
    // Get the 'query' parameter from the URL
    const queryParam = searchParams.get("query") || "";
    setSearchQuery(queryParam);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      let qRef = collection(db, "products");
      let qConstraints = [];

      // Search Query Filter using Algolia
      if (searchQuery.trim()) {
        // Ideally, perform a client-side search using Algolia
        // For demonstration, we'll filter products where 'name' contains the query
        // Note: Firestore doesn't support full-text search. For production, consider integrating Algolia search results.
        qConstraints.push(where("name", ">=", searchQuery));
        qConstraints.push(where("name", "<=", searchQuery + "\uf8ff"));
      }

      // Category Filter
      if (selectedCategory) {
        qConstraints.push(where("category", "==", selectedCategory));
      }

      // Subcategory Filter
      if (selectedSubcategory) {
        qConstraints.push(where("subcategory", "==", selectedSubcategory));
      }

      // Deals Filter
      if (showDeals) {
        qConstraints.push(where("discountPercentage", ">", 0));
      }

      // Featured Filter
      if (showFeatured) {
        qConstraints.push(where("isBoosted", "==", true));
      }

      // Special Filters
      if (specialFilter) {
        if (specialFilter === "Trending") {
          qConstraints.push(where("dailyClickCount", ">", 10));
        } else if (specialFilter === "5-Star") {
          qConstraints.push(where("averageRating", "==", 5));
        }
      }

      // Apply sorting based on sortOption
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

      try {
        const qFinal = query(qRef, ...qConstraints);
        const querySnapshot = await getDocs(qFinal);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // **1. Sort products: isBoosted:true first**
        const boostedProducts = items.filter((product) => product.isBoosted);
        const otherProducts = items.filter((product) => !product.isBoosted);
        const sortedProducts = [...boostedProducts, ...otherProducts];

        setProducts(sortedProducts);
        console.log("Fetched and Sorted Products:", sortedProducts); // Debugging
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    }
    fetchProducts();
  }, [
    selectedCategory,
    selectedSubcategory,
    showDeals,
    showFeatured,
    specialFilter,
    sortOption,
    searchQuery, // Add searchQuery as a dependency
  ]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    console.log("Selected Category:", category);
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    console.log("Selected Subcategory:", subcategory);
  };

  const handleListProduct = () => {
    // Navigate to the List Product page
    router.push("/listproduct");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <Header />

        {/* Main Content */}
        <main className="pt-16 sm:pt-20 p-4 sm:p-6 mx-auto max-w-7xl bg-background">
          {/* Categories */}
          <Categories
            onCategorySelect={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
          />

          {/* Market Banner */}
          <MarketBanner />

          {/* Gap between MarketBanner and FilterSortRow */}
          <div className="my-4">
            <FilterSortRow />
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <p className="text-center text-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-2 justify-items-center">
              {/* CHANGED: pass a fallback if p.id might be blank. */}
              {products.map((p, index) => (
                <ProductCard
                  key={p.id || `product-${index}`} // Ensure a non-empty, unique key
                  product={p}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleListProduct}
        className="fixed bottom-6 right-6 bg-jade-green hover:scale-105 transition-transform text-white p-4 rounded-md shadow-lg flex items-center justify-center"
        aria-label="List a Product"
      >
        <FaPlus size={20} />
      </button>
    </div>
  );
}
