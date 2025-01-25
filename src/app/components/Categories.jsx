// src/app/components/Categories.jsx

"use client";

import React from "react";
import Image from "next/image";
import { categories, subcategories } from "../data/categoriesData";

export default function Categories({
  setSelectedCategory,
  setSelectedSubcategory,
  selectedCategory,
  selectedSubcategory,
}) {
  const handleCategoryClick = (categoryKey) => {
    const isCurrentlySelected = selectedCategory === categoryKey;
    setSelectedCategory(isCurrentlySelected ? null : categoryKey);
    if (isCurrentlySelected) {
      setSelectedSubcategory(null);
    }
  };

  const handleSubcategoryClick = (subcategory) => {
    const isCurrentlySelected = selectedSubcategory === subcategory;
    setSelectedSubcategory(isCurrentlySelected ? null : subcategory);
  };

  return (
    <div className="w-full max-w-[100vw] overflow-hidden">
      {/* Main categories row */}
      <div className="relative">
        <div
          className="
            flex items-center gap-4
            overflow-x-auto
            px-4 py-4
            no-scrollbar
            md:justify-center
          "
        >
          {categories.map((category, index) => (
            <div key={category.key} className="flex-shrink-0">
              <div className="flex flex-col items-center w-20">
                <button
                  onClick={() => handleCategoryClick(category.key)}
                  className={`
                    w-20 h-20 relative rounded-full overflow-hidden
                    shadow-md hover:shadow-lg
                    ${
                      selectedCategory === category.key
                        ? "border-4 border-jade-green dark:border-accent"
                        : "border border-gray-200 dark:border-gray-700"
                    }
                  `}
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
                <span
                  className={`
                    mt-2 text-center text-sm whitespace-nowrap
                    ${
                      selectedCategory === category.key
                        ? "text-jade-green dark:text-accent font-semibold"
                        : "text-foreground"
                    }
                  `}
                >
                  {category.key}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subcategories row */}
      {selectedCategory && subcategories[selectedCategory] && (
        <div className="relative mt-4">
          <div
            className="
              flex gap-3 
              overflow-x-auto
              px-4 py-2
              no-scrollbar
              md:justify-center
            "
          >
            {subcategories[selectedCategory].map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategoryClick(subcat)}
                className={`
                  px-4 py-2 rounded-full text-sm whitespace-nowrap
                  flex-shrink-0 border transition-all duration-200
                  ${
                    selectedSubcategory === subcat
                      ? "bg-jade-green dark:bg-accent text-white border-jade-green dark:border-accent"
                      : "bg-transparent border-gray-300 dark:border-gray-600 text-foreground hover:bg-gray-100 dark:hover:bg-transparent"
                  }
                `}
              >
                {subcat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
