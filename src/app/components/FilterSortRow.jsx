// src/app/components/FilterSortRow.jsx

"use client";

import React, { useState } from "react";
import { useMarket } from "../../../context/MarketContext";
import { FaSort } from "react-icons/fa";
import Modal from "react-modal";

const FilterSortRow = () => {
  const {
    showDeals,
    toggleDeals,
    showFeatured,
    toggleFeatured,
    specialFilter,
    setSpecialFilter,
    sortOption,
    setSortOption,
  } = useMarket();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const filters = [
    { label: "Deals", type: "Deals" },
    { label: "Featured", type: "Featured" },
    { label: "Trending", type: "Trending" },
    { label: "5-Star", type: "5-Star" },
    { label: "Best Sellers", type: "Best Sellers" },
  ];

  // Replace this with your actual theme logic
  // CHANGED: avoid "document is not defined" on SSR by checking typeof window
  const isDarkMode =
    typeof window !== "undefined" && document.body.classList.contains("dark"); // Updated to detect actual dark mode

  const handleFilterClick = (filter) => {
    switch (filter.type) {
      case "Deals":
        toggleDeals();
        if (sortOption === "best_sellers") {
          setSortOption(null);
        }
        break;
      case "Featured":
        toggleFeatured();
        if (sortOption === "best_sellers") {
          setSortOption(null);
        }
        break;
      case "Best Sellers":
        if (sortOption !== "best_sellers") {
          setSortOption("best_sellers");
        } else {
          setSortOption(null); // Toggle off
        }
        // Reset other filters when Best Sellers is toggled
        if (showDeals) toggleDeals();
        if (showFeatured) toggleFeatured();
        if (specialFilter) setSpecialFilter(null);
        break;
      default:
        setSpecialFilter(filter.type);
        if (sortOption === "best_sellers") {
          setSortOption(null);
        }
        break;
    }
    console.log(`Filter Clicked: ${filter.type}`);
  };

  const isSelected = (filter) => {
    if (filter.type === "Deals") return showDeals;
    if (filter.type === "Featured") return showFeatured;
    if (filter.type === "Best Sellers") return sortOption === "best_sellers";
    return specialFilter === filter.type;
  };

  const openSortModal = () => {
    setIsModalOpen(true);
  };

  const closeSortModal = () => {
    setIsModalOpen(false);
  };

  const handleSortOption = (option) => {
    setSortOption(option);
    console.log("Selected Sort Option:", option);
    closeSortModal();
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Scrollable Filters */}
        <div className="flex space-x-2 overflow-x-auto">
          {filters.map((filter) => {
            const selected = isSelected(filter);
            return (
              <button
                key={filter.type}
                onClick={() => handleFilterClick(filter)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selected
                    ? "bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 text-white"
                    : `border ${isDarkMode ? "border-white" : "border-black"} ${
                        isDarkMode ? "text-white" : "text-foreground"
                      } bg-background hover:bg-secondaryBackground`
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Sort Button */}
        <button
          onClick={openSortModal}
          className="flex items-center px-4 py-2 rounded-full border border-secondaryBackground bg-background text-foreground hover:bg-secondaryBackground hover:text-background transition-colors"
        >
          <FaSort className="mr-2" />
          Sort
        </button>
      </div>

      {/* Sort Options Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeSortModal}
        contentLabel="Sort Options"
        className="max-w-md mx-auto mt-20 bg-background dark:bg-secondaryBackground rounded-lg shadow-lg p-4 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        <h2 className="text-lg font-semibold mb-4 text-foreground dark:text-white">
          Sort
        </h2>
        <ul>
          <li>
            <button
              onClick={() => handleSortOption("date")}
              className="w-full text-left px-4 py-2 hover:bg-secondaryBackground dark:hover:bg-gray-700 text-foreground dark:text-white rounded"
            >
              Date
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSortOption("alphabetical")}
              className="w-full text-left px-4 py-2 hover:bg-secondaryBackground dark:hover:bg-gray-700 text-foreground dark:text-white rounded"
            >
              Alphabetical
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSortOption("price_asc")}
              className="w-full text-left px-4 py-2 hover:bg-secondaryBackground dark:hover:bg-gray-700 text-foreground dark:text-white rounded"
            >
              Price: Low to High
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSortOption("price_desc")}
              className="w-full text-left px-4 py-2 hover:bg-secondaryBackground dark:hover:bg-gray-700 text-foreground dark:text-white rounded"
            >
              Price: High to Low
            </button>
          </li>
        </ul>
        <button
          onClick={closeSortModal}
          className="mt-4 w-full bg-accent text-foreground py-2 rounded hover:bg-accent-hover transition-colors"
        >
          Close
        </button>
      </Modal>
    </div>
  );
};

export default FilterSortRow;
