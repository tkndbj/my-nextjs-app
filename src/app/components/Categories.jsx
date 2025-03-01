"use client";

import React from "react";
import Image from "next/image";
import { useMarket } from "../../../context/MarketContext";
import { useRouter } from "next/navigation";
import posthog from "posthog-js"; // Ensure PostHog is initialized in your app

export default function Categories() {
  const router = useRouter();
  const { categories, selectedCategory, setSelectedCategory } = useMarket();

  const handleCategoryClick = async (categoryKey) => {
    // Capture PostHog event for this category click
    posthog.capture("CategorySelected", {
      rawKey: categoryKey,
      localizedName: categoryKey, // Replace with localized name if available
    });

    // Update selected category (if different)
    if (selectedCategory !== categoryKey) {
      await setSelectedCategory(categoryKey);
    }
    // Navigate to dynamic market page with the selected category in the URL query
    router.push(`/dynamicmarket?category=${encodeURIComponent(categoryKey)}`);
  };

  return (
    <div className="w-full max-w-[100vw] overflow-hidden">
      {/* Main Categories Row */}
      <div className="relative">
        <div className="flex items-center gap-4 overflow-x-auto px-4 py-4 no-scrollbar md:justify-center">
          {categories.map((category, index) => (
            <div key={category.key} className="flex-shrink-0">
              <div className="flex flex-col items-center w-20">
                <button
                  onClick={() => handleCategoryClick(category.key)}
                  className="w-20 h-20 relative rounded-full overflow-hidden shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <Image
                      src={`/images/categories/${category.image}`}
                      alt={category.key}
                      fill
                      sizes="80px"
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                </button>
                <span className="mt-2 text-center text-sm whitespace-nowrap text-foreground">
                  {category.key}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
