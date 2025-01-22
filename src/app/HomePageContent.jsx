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
import { useRouter, useSearchParams } from "next/navigation"; // This hook is used here
import { FaPlus } from "react-icons/fa";

export default function HomePageContent() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Access contexts and navigation
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

      // Sorting based on sortOption
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

        // Sort products: boosted products first
        const boostedProducts = items.filter((product) => product.isBoosted);
        const otherProducts = items.filter((product) => !product.isBoosted);
        const sortedProducts = [...boostedProducts, ...otherProducts];

        setProducts(sortedProducts);
        console.log("Fetched and Sorted Products:", sortedProducts);
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
    searchQuery,
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

          {/* Gap */}
          <div className="my-4">
            <FilterSortRow />
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <p className="text-center text-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-2 justify-items-center">
              {products.map((p, index) => (
                <ProductCard
                  key={p.id || `product-${index}`}
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
