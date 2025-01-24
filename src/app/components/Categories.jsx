"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { categories, subcategories } from "../data/categoriesData";

export default function Categories({
  onCategorySelect,
  onSubcategorySelect,
  selectedCategory,
  selectedSubcategory,
}) {
  const containerRef = useRef(null);
  const subcategoriesRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse events for drag-to-scroll
  const handleMouseDown = (e, ref) => {
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e, ref) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // speed factor
    ref.current.scrollLeft = scrollLeft - walk;
  };

  // Toggle the category
  const handleCategoryClick = (categoryKey) => {
    const isCurrentlySelected = selectedCategory === categoryKey;
    onCategorySelect?.(isCurrentlySelected ? null : categoryKey);
    // Clear subcategory if category is deselected
    if (isCurrentlySelected) {
      onSubcategorySelect?.(null);
    }
  };

  // Toggle the subcategory
  const handleSubcategoryClick = (subcategory) => {
    const isCurrentlySelected = selectedSubcategory === subcategory;
    onSubcategorySelect?.(isCurrentlySelected ? null : subcategory);
  };

  return (
    <div className="w-full">
      {/* Main categories row */}
      <div className="relative w-full overflow-hidden">
        <div
          ref={containerRef}
          className="
            flex items-center gap-4 
            overflow-x-auto whitespace-nowrap py-4
            hide-scrollbar cursor-grab bg-background
            snap-x snap-mandatory px-4
          "
          onMouseDown={(e) => handleMouseDown(e, containerRef)}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={(e) => handleMouseMove(e, containerRef)}
        >
          {categories.map((category, index) => (
            <div 
              key={category.key} 
              className="flex flex-col items-center flex-shrink-0 snap-center"
            >
              <button
                onClick={() => handleCategoryClick(category.key)}
                className={`
                  w-20 h-20 relative rounded-full overflow-hidden shadow-md 
                  hover:scale-105 transition-transform flex items-center justify-center
                  ${
                    selectedCategory === category.key
                      ? "border-4 border-jade-green dark:border-accent"
                      : "border border-secondaryBackground dark:border-secondaryBackground"
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
                  className="object-cover"
                  priority={index === 0}
                />
              </button>
              <span
                className={`
                  mt-2 text-center text-sm 
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
          ))}
        </div>
      </div>

      {/* Subcategories row (only visible if a category is selected) */}
      {selectedCategory && (
        <div className="relative w-full overflow-hidden mt-4">
          <div
            ref={subcategoriesRef}
            className="
              flex flex-nowrap gap-3 
              overflow-x-auto whitespace-nowrap py-2
              hide-scrollbar cursor-grab
              snap-x snap-mandatory px-4
            "
            onMouseDown={(e) => handleMouseDown(e, subcategoriesRef)}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={(e) => handleMouseMove(e, subcategoriesRef)}
          >
            {subcategories[selectedCategory]?.map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategoryClick(subcat)}
                className={`
                  px-4 py-2 rounded-full border text-sm transition
                  flex-shrink-0 snap-center
                  ${
                    selectedSubcategory === subcat
                      ? "bg-jade-green dark:bg-accent text-background border-jade-green dark:border-accent"
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