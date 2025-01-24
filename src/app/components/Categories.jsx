// src/app/components/Categories.jsx

"use client";

import React from "react";
import Image from "next/image";
import { categories, subcategories } from "../data/categoriesData";

export default function Categories({
  onCategorySelect,
  onSubcategorySelect,
  selectedCategory,
  selectedSubcategory,
}) {

  // Toggle the category
  const handleCategoryClick = (categoryKey) => {
    const isCurrentlySelected = selectedCategory === categoryKey;
    onCategorySelect(isCurrentlySelected ? null : categoryKey);
    if (isCurrentlySelected) {
      onSubcategorySelect(null);
    }
  };

  // Toggle the subcategory
  const handleSubcategoryClick = (subcategory) => {
    const isCurrentlySelected = selectedSubcategory === subcategory;
    onSubcategorySelect(isCurrentlySelected ? null : subcategory);
  };

  return (
    <div className="w-full">
      {/* Main Categories Row */}
      <div
        className="
          flex flex-nowrap items-center justify-start md:justify-center gap-4 
          overflow-x-auto hide-scrollbar 
          bg-background
          px-2 sm:px-4
          max-w-full
          w-full
          min-w-0
        "
      >
        {categories.map((category, index) => (
          <div
            key={category.key}
            className="flex-shrink-0 flex flex-col items-center"
          >
            <button
              onClick={() => handleCategoryClick(category.key)}
              className={`
                w-16 h-16 sm:w-20 sm:h-20 relative rounded-full overflow-hidden shadow-md 
                hover:scale-105 transition-transform flex items-center justify-center
                box-border
                border-2 border-secondaryBackground dark:border-secondaryBackground
                ${
                  selectedCategory === category.key
                    ? "ring-2 ring-jade-green dark:ring-accent"
                    : ""
                }
              `}
            >
              <Image
                src={`/images/categories/${category.image}`}
                alt={category.key}
                fill
                sizes="(max-width: 640px) 20vw,
                       (max-width: 768px) 15vw,
                       (max-width: 1024px) 10vw,
                       5vw"
                className="object-contain"
                priority={index === 0}
              />
            </button>
            <span
              className={`
                mt-2 text-center text-xs sm:text-sm 
                ${
                  selectedCategory === category.key
                    ? "text-jade-green dark:text-accent font-semibold"
                    : "text-foreground"
                }
                max-w-full truncate
              `}
            >
              {category.key}
            </span>
          </div>
        ))}
      </div>

      {/* Subcategories Row */}
      {selectedCategory && (
        <div className="mt-4">
          <div
            className="
              flex flex-nowrap items-center justify-start md:justify-center gap-3 
              overflow-x-auto hide-scrollbar 
              bg-background
              px-2 sm:px-4
              max-w-full
              w-full
              min-w-0
            "
          >
            {subcategories[selectedCategory]?.map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategoryClick(subcat)}
                className={`
                  flex-shrink-0 px-3 sm:px-4 py-2 rounded-full border-2 border-foreground text-xs sm:text-sm transition
                  ${
                    selectedSubcategory === subcat
                      ? "bg-jade-green dark:bg-accent text-background ring-2 ring-jade-green dark:ring-accent"
                      : "bg-transparent border-foreground text-foreground hover:bg-jade-green hover:text-background dark:hover:bg-accent"
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
