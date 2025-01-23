"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

// 1. Import the Countdown component
import Countdown from "../components/Countdown";

/**
 * For use in the "Listed" products sub-tab.
 * Clicking anywhere (except the buttons) goes to /products/[id].
 */
export default function ProductCard2({ product, onEdit, onBoost, onRemove }) {
  const router = useRouter();

  const {
    id,
    productName,
    price,
    originalPrice,
    discountPercentage,
    description,
    imageUrls,
    averageRating,
    colorImages,
    brandModel,
    isBoosted,
    boostEndTime, // <-- We'll access this to pass into Countdown
  } = product;

  // For color swatches
  const [selectedImage, setSelectedImage] = useState(
    imageUrls && imageUrls.length > 0
      ? imageUrls[0]
      : "https://via.placeholder.com/300x200"
  );

  // Rating calculation
  const rating = averageRating !== undefined ? averageRating : 0.0;
  const roundedRating = rating.toFixed(1);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-500" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-500" />);
    }
    return stars;
  };

  const colors = colorImages ? Object.keys(colorImages) : [];

  const colorNameToColor = (colorName) => {
    switch (colorName.toLowerCase()) {
      case "red":
        return "red";
      case "yellow":
        return "yellow";
      case "green":
        return "green";
      case "blue":
        return "blue";
      case "purple":
        return "purple";
      case "orange":
        return "orange";
      case "black":
        return "black";
      case "white":
        return "white";
      case "pink":
        return "pink";
      case "gray":
      case "grey":
        return "gray";
      case "brown":
        return "brown";
      case "dark blue":
        return "indigo";
      default:
        return "gray";
    }
  };

  const handleColorClick = (color) => {
    const colorImageUrls = colorImages[color];
    if (colorImageUrls && colorImageUrls.length > 0) {
      setSelectedImage(colorImageUrls[0]);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      currencyDisplay: "symbol",
    }).format(value);
  };

  const displayText =
    description && description.trim() !== ""
      ? description
      : brandModel && brandModel.trim() !== ""
      ? brandModel
      : "No description available.";

  // Navigate to /products/[id] if user clicks anywhere but the buttons
  const handleCardClick = () => {
    router.push(`/products/${id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="
        relative w-72 h-[420px] font-figtree flex flex-col
        transition-transform hover:scale-105 cursor-pointer
      "
    >
      <div className="bg-background rounded-2xl shadow-md overflow-hidden border border-secondaryBackground dark:border-2 dark:border-secondaryBackground flex flex-col h-full">
        {/* Image container: position is relative for the countdown */}
        <div className="w-full h-52 relative">
          <Image
            src={selectedImage}
            alt={productName}
            fill
            sizes="(max-width: 640px) 100vw,
                  (max-width: 768px) 50vw,
                  (max-width: 1024px) 33vw,
                  25vw"
            className="object-cover"
          />

          {/* If boosted, show the "Featured" label */}
          {isBoosted && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}

          {/* 2. If boosted and we have a boostEndTime, show the Countdown at bottom-right */}
          {isBoosted && boostEndTime && (
            <Countdown boostEndTime={boostEndTime} />
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-semibold text-foreground line-clamp-1">
            {productName}
          </h2>

          {/* Rating */}
          <div className="flex items-center mt-1">
            {renderStars()}
            <span className="text-gray-400 text-sm ml-1">
              ({roundedRating})
            </span>
          </div>

          {/* Description / brandModel */}
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 flex-grow line-clamp-2">
            {displayText}
          </p>

          {/* Price row */}
          <div className="mt-2">
            {discountPercentage && discountPercentage > 0 ? (
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(price)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="text-sm text-jade-green font-semibold">
                  %{discountPercentage}
                </span>
              </div>
            ) : (
              <div className="text-lg font-semibold text-foreground">
                {formatCurrency(price)}
              </div>
            )}
          </div>

          {/* Color swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1 my-2">
              {colors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  className="w-4 h-4 rounded-full border border-gray-300 hover:scale-110 transition"
                  style={{ backgroundColor: colorNameToColor(color) }}
                  onClick={(e) => {
                    e.stopPropagation(); // Stop from navigating
                    handleColorClick(color);
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          )}

          {/* Bottom buttons: Edit / Boost / Remove */}
          <div className="flex mt-auto gap-2">
            {/* Edit */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="flex-1 text-center py-1 rounded text-white"
              style={{ backgroundColor: "#00A86B" }} // Jade green
            >
              Edit
            </button>

            {/* Boost */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBoost?.();
              }}
              className={`flex-1 text-center py-1 rounded text-white ${
                isBoosted
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#FF7F50] hover:bg-[#FF6347]"
              } transition`}
              disabled={isBoosted}
            >
              Boost
            </button>

            {/* Remove */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="flex-1 text-center py-1 rounded text-white bg-red-600 hover:bg-red-700 transition"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
