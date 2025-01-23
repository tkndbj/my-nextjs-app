// src/app/components/Categories.jsx

"use client";

import React, { useRef, useState } from "react";
import Image from "next/image"; // Updated import
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
    const walk = (x - startX) * 2; // Scroll-fast
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCategoryClick = (categoryKey) => {
    const newActive = selectedCategory === categoryKey ? null : categoryKey;
    onCategorySelect(newActive);
    if (newActive === null) {
      onSubcategorySelect(null);
    }
  };

  const handleSubcategoryClick = (subcategory) => {
    onSubcategorySelect(subcategory);
  };

  return (
    <div className="px-4">
      {/* Categories Container */}
      <div
        ref={containerRef}
        className="flex items-center justify-center gap-4 overflow-x-auto hide-scrollbar cursor-grab bg-background"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {categories.map((category, index) => (
          <div key={category.key} className="flex flex-col items-center">
            <button
              onClick={() => handleCategoryClick(category.key)}
              className={`w-20 h-20 relative rounded-full overflow-hidden shadow-md hover:scale-105 transition-transform flex items-center justify-center ${
                selectedCategory === category.key
                  ? "border-4 border-jade-green dark:border-accent"
                  : "border border-secondaryBackground dark:border-secondaryBackground"
              }`}
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
                priority={index === 0} // Adds priority to the first image
              />
            </button>
            {/* Category Name */}
            <span
              className={`mt-2 text-center text-sm ${
                selectedCategory === category.key
                  ? "text-jade-green dark:text-accent font-semibold"
                  : "text-foreground"
              }`}
            >
              {category.key}
            </span>
          </div>
        ))}
      </div>

      {/* Subcategories */}
      {selectedCategory && (
        <div className="mt-4 flex justify-center bg-background">
          <div
            className="flex flex-nowrap justify-center gap-3 overflow-x-auto hide-scrollbar cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {subcategories[selectedCategory].map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategoryClick(subcat)}
                className={`px-4 py-2 rounded-full border text-sm transition ${
                  selectedSubcategory === subcat
                    ? "bg-jade-green dark:bg-accent text-background border-jade-green dark:border-accent"
                    : "bg-secondaryBackground text-foreground border-secondaryBackground hover:bg-jade-green dark:hover:bg-accent hover:text-background"
                }`}
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
