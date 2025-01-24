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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse events for drag-to-scroll
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // speed factor
    containerRef.current.scrollLeft = scrollLeft - walk;
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
    <div className="px-4">
      {/* Main categories row */}
      <div
        ref={containerRef}
        className="
          flex flex-nowrap items-center gap-4 
          overflow-x-auto hide-scrollbar cursor-grab bg-background
          touch-pan-x
        "
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        // Optional: Add touch events for better mobile support
        onTouchStart={(e) => {
          setIsDragging(true);
          setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
          setScrollLeft(containerRef.current.scrollLeft);
        }}
        onTouchEnd={handleMouseUp}
        onTouchMove={(e) => {
          if (!isDragging) return;
          const x = e.touches[0].pageX - containerRef.current.offsetLeft;
          const walk = (x - startX) * 2; // speed factor
          containerRef.current.scrollLeft = scrollLeft - walk;
        }}
      >
        {categories.map((category, index) => (
          <div key={category.key} className="flex flex-col items-center">
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
                layout="fill"
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

      {/* Subcategories row (only visible if a category is selected) */}
      {selectedCategory && (
        <div className="mt-4 flex justify-center bg-background">
          <div
            className="
              flex flex-nowrap justify-center gap-3 
              overflow-x-auto hide-scrollbar cursor-grab
            "
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            // Optional: Add touch events for better mobile support
            onTouchStart={(e) => {
              setIsDragging(true);
              setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
              setScrollLeft(containerRef.current.scrollLeft);
            }}
            onTouchEnd={handleMouseUp}
            onTouchMove={(e) => {
              if (!isDragging) return;
              const x = e.touches[0].pageX - containerRef.current.offsetLeft;
              const walk = (x - startX) * 2; // speed factor
              containerRef.current.scrollLeft = scrollLeft - walk;
            }}
          >
            {subcategories[selectedCategory]?.map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategoryClick(subcat)}
                className={`
                  px-4 py-2 rounded-full border text-sm transition
                  ${
                    selectedSubcategory === subcat
                      ? // Selected style
                        "bg-jade-green dark:bg-accent text-background border-jade-green dark:border-accent"
                      : // Unselected style
                        "bg-transparent border-foreground text-foreground hover:bg-jade-green hover:text-background dark:hover:bg-accent"
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
