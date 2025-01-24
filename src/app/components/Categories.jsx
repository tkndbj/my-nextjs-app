// src/app/components/Categories.jsx

"use client";

import React from "react";
import Image from "next/image";
import { categories, subcategories } from "../data/categoriesData";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules"; // Correct import for Swiper v10
import "./Categories.css";

export default function Categories({
  onCategorySelect,
  onSubcategorySelect,
  selectedCategory,
  selectedSubcategory,
}) {
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
      {/* Main categories row using Swiper */}
      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView="auto"
        navigation
        className="mySwiper"
        // Optional: Customize navigation buttons
        // e.g., enable navigation buttons only on larger screens
        breakpoints={{
          640: {
            navigation: true,
          },
          0: {
            navigation: false,
          },
        }}
      >
        {categories.map((category, index) => (
          <SwiperSlide key={category.key} style={{ width: "auto" }}>
            <div className="flex flex-col items-center">
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
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Subcategories row (only visible if a category is selected) */}
      {selectedCategory && (
        <div className="mt-4 flex justify-center bg-background">
          <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerView="auto"
            navigation
            className="mySwiperSub"
            breakpoints={{
              640: {
                navigation: true,
              },
              0: {
                navigation: false,
              },
            }}
          >
            {subcategories[selectedCategory]?.map((subcat) => (
              <SwiperSlide key={subcat} style={{ width: "auto" }}>
                <button
                  onClick={() => handleSubcategoryClick(subcat)}
                  className={`
                    px-4 py-2 rounded-full border text-sm transition
                    ${
                      selectedSubcategory === subcat
                        ? "bg-jade-green dark:bg-accent text-background border-jade-green dark:border-accent"
                        : "bg-transparent border-foreground text-foreground hover:bg-jade-green hover:text-background dark:hover:bg-accent"
                    }
                  `}
                >
                  {subcat}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
