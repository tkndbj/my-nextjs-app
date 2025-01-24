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

  const handleTouchStart = (e, ref) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleTouchMove = (e, ref) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const walk = (x - startX); // Removed multiplier for natural scrolling speed
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseDown = (e, ref) => {
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
    ref.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e, ref) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX); // Removed multiplier for natural scrolling speed
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = (ref) => {
    setIsDragging(false);
    if (ref.current) {
      ref.current.style.cursor = 'grab';
    }
  };

  const handleCategoryClick = (categoryKey) => {
    if (!isDragging) { // Only trigger click if not dragging
      const isCurrentlySelected = selectedCategory === categoryKey;
      onCategorySelect?.(isCurrentlySelected ? null : categoryKey);
      if (isCurrentlySelected) {
        onSubcategorySelect?.(null);
      }
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-hidden">
      {/* Main categories row */}
      <div className="relative">
        <div
          ref={containerRef}
          className="
            flex items-center gap-4
            overflow-x-auto
            px-4 py-4
            no-scrollbar
            cursor-grab
          "
          onTouchStart={(e) => handleTouchStart(e, containerRef)}
          onTouchMove={(e) => handleTouchMove(e, containerRef)}
          onMouseDown={(e) => handleMouseDown(e, containerRef)}
          onMouseMove={(e) => handleMouseMove(e, containerRef)}
          onMouseUp={() => handleMouseUpOrLeave(containerRef)}
          onMouseLeave={() => handleMouseUpOrLeave(containerRef)}
        >
          {categories.map((category, index) => (
            <div 
              key={category.key} 
              className="flex-shrink-0"
            >
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
      {selectedCategory && (
        <div className="relative mt-4">
          <div
            ref={subcategoriesRef}
            className="
              flex gap-3 
              overflow-x-auto
              px-4 py-2
              no-scrollbar
              cursor-grab
            "
            onTouchStart={(e) => handleTouchStart(e, subcategoriesRef)}
            onTouchMove={(e) => handleTouchMove(e, subcategoriesRef)}
            onMouseDown={(e) => handleMouseDown(e, subcategoriesRef)}
            onMouseMove={(e) => handleMouseMove(e, subcategoriesRef)}
            onMouseUp={() => handleMouseUpOrLeave(subcategoriesRef)}
            onMouseLeave={() => handleMouseUpOrLeave(subcategoriesRef)}
          >
            {subcategories[selectedCategory]?.map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategoryClick(subcat)}
                className={`
                  px-4 py-2 rounded-full text-sm whitespace-nowrap
                  flex-shrink-0 border
                  ${
                    selectedSubcategory === subcat
                      ? "bg-jade-green dark:bg-accent text-white border-jade-green dark:border-accent"
                      : "bg-transparent border-gray-300 dark:border-gray-600 text-foreground"
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