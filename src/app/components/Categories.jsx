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

  // Touch events for mobile scrolling
  const handleTouchStart = (e, ref) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleTouchMove = (e, ref) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

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
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleCategoryClick = (categoryKey) => {
    const isCurrentlySelected = selectedCategory === categoryKey;
    onCategorySelect?.(isCurrentlySelected ? null : categoryKey);
    if (isCurrentlySelected) {
      onSubcategorySelect?.(null);
    }
  };

  const handleSubcategoryClick = (subcategory) => {
    const isCurrentlySelected = selectedSubcategory === subcategory;
    onSubcategorySelect?.(isCurrentlySelected ? null : subcategory);
  };

  return (
    <div className="w-full max-w-[100vw] overflow-hidden">
      {/* Main categories row */}
      <div className="relative">
        <div
          ref={containerRef}
          className="
            flex items-center gap-4
            overflow-x-scroll scrollbar-hide
            touch-pan-x 
            px-4 py-4
            scroll-smooth
            no-scrollbar
          "
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
          }}
          onTouchStart={(e) => handleTouchStart(e, containerRef)}
          onTouchMove={(e) => handleTouchMove(e, containerRef)}
          onMouseDown={(e) => handleMouseDown(e, containerRef)}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={(e) => handleMouseMove(e, containerRef)}
        >
          {categories.map((category, index) => (
            <div 
              key={category.key} 
              className="flex-none scroll-snap-align-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="flex flex-col items-center w-20">
                <button
                  onClick={() => handleCategoryClick(category.key)}
                  className={`
                    w-20 h-20 relative rounded-full overflow-hidden shadow-md 
                    hover:scale-105 transition-transform flex-shrink-0
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
                    sizes="80px"
                    className="object-cover"
                    priority={index === 0}
                  />
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
              overflow-x-scroll scrollbar-hide
              touch-pan-x 
              px-4 py-2
              scroll-smooth
              no-scrollbar
            "
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
            onTouchStart={(e) => handleTouchStart(e, subcategoriesRef)}
            onTouchMove={(e) => handleTouchMove(e, subcategoriesRef)}
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
                  flex-none scroll-snap-align-start whitespace-nowrap
                  ${
                    selectedSubcategory === subcat
                      ? "bg-jade-green dark:bg-accent text-background border-jade-green dark:border-accent"
                      : "bg-transparent border-foreground text-foreground hover:bg-jade-green hover:text-background dark:hover:bg-accent"
                  }
                `}
                style={{ scrollSnapAlign: 'start' }}
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