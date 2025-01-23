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
import { useMarket } from "../../context/MarketContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomePageContent() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { showDeals, showFeatured, specialFilter, sortOption } = useMarket();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Retrieve 'query' from URL if available
    const queryParam = searchParams.get("query") || "";
    setSearchQuery(queryParam);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        let qRef = collection(db, "products");
        let qConstraints = [];

        // Simple text-based filter
        if (searchQuery.trim()) {
          qConstraints.push(where("name", ">=", searchQuery));
          qConstraints.push(where("name", "<=", searchQuery + "\uf8ff"));
        }

        // Deals
        if (showDeals) {
          qConstraints.push(where("discountPercentage", ">", 0));
        }

        // Featured
        if (showFeatured) {
          qConstraints.push(where("isBoosted", "==", true));
        }

        // Special filter
        if (specialFilter) {
          if (specialFilter === "Trending") {
            qConstraints.push(where("dailyClickCount", ">", 10));
          } else if (specialFilter === "5-Star") {
            qConstraints.push(where("averageRating", "==", 5));
          }
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
  }, [searchQuery, showDeals, showFeatured, specialFilter, sortOption]);

  return (
    <div className="px-2 py-4 min-h-screen">
      {products.length === 0 ? (
        <p className="text-center text-foreground">No products found.</p>
      ) : (
        <div className="mx-auto w-full max-w-7xl">
          {/* 
            On mobile (<md): 2 cols, gap-x-2, gap-y-2
            On md+ screens: 4 cols, gap-x-1 (smaller horizontal gap), gap-y-2
          */}
          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-x-2
              gap-y-2
              md:gap-x-1
              justify-items-center
            "
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
