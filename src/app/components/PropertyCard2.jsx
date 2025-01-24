"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaEdit,
  FaRocket,
  FaTrash,
  FaBed,
  FaBath,
  FaRulerCombined,
} from "react-icons/fa";

/**
 * For use in the "Properties" tab.
 * Clicking anywhere (except the buttons) goes to /propertydetail/[id].
 */
export default function PropertyCard2({ property, onEdit, onBoost, onRemove }) {
  const router = useRouter();

  const {
    id,
    propertyName,
    price,
    fileUrls = [],
    isBoosted,
    region,
    saleType,
    bedrooms,
    bathrooms,
    houseSize,
    currency,
  } = property;

  const imageSrc =
    fileUrls.length > 0 ? fileUrls[0] : "https://via.placeholder.com/300x200";

  const formatPrice = (value) => {
    if (!value) return "TRY --";
    const formattedValue = Math.floor(value).toLocaleString("en-US");
    return `${currency ?? "TRY"} ${formattedValue}`;
  };

  // Navigate to /propertydetail/[id] if user clicks the card
  const handleCardClick = () => {
    router.push(`/propertydetail/${id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative w-full sm:w-64 md:w-72 h-auto font-figtree cursor-pointer"
    >
      <div className="bg-background rounded-2xl shadow-md overflow-hidden border border-secondaryBackground dark:border-2 dark:border-secondaryBackground transition-transform hover:scale-105 flex flex-col h-full">
        {/* Image container with aspect ratio */}
        <div className="w-full relative aspect-[4/3]">
          <Image
            src={imageSrc}
            alt={propertyName || "Property Image"}
            fill
            sizes="(max-width: 640px) 100vw,
                   (max-width: 768px) 50vw,
                   (max-width: 1024px) 33vw,
                   25vw"
            className="object-cover"
          />
          {isBoosted && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-3 flex flex-col flex-grow">
          <h2 className="text-lg sm:text-base font-semibold text-foreground line-clamp-1">
            {propertyName ?? "Untitled Property"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-xs line-clamp-1">
            {region ? region : ""}
            {saleType ? ` • ${saleType}` : ""}
          </p>

          {/* Icon row: bedrooms, bathrooms, houseSize */}
          <div className="flex items-center gap-4 mt-2 text-sm sm:text-xs text-foreground">
            {typeof bedrooms === "number" && (
              <div className="flex items-center gap-1">
                <FaBed className="text-gray-500" />
                <span>{bedrooms}</span>
              </div>
            )}
            {typeof bathrooms === "number" && (
              <div className="flex items-center gap-1">
                <FaBath className="text-gray-500" />
                <span>{bathrooms}</span>
              </div>
            )}
            {typeof houseSize === "number" && (
              <div className="flex items-center gap-1">
                <FaRulerCombined className="text-gray-500" />
                <span>{houseSize} m²</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-2 text-lg sm:text-base font-semibold text-foreground">
            {formatPrice(price)}
          </div>

          {/* Bottom buttons */}
          <div className="flex mt-auto gap-4">
            {/* Edit */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onEdit();
                }}
                className="p-2 rounded hover:opacity-75 transition"
                aria-label="Edit Property"
              >
                <FaEdit className="text-blue-500 w-5 h-5" />
              </button>
            )}

            {/* Boost */}
            {onBoost && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBoost();
                }}
                className={`p-2 rounded hover:opacity-75 transition ${
                  isBoosted ? "cursor-not-allowed" : ""
                }`}
                disabled={isBoosted}
                aria-label="Boost Property"
              >
                <FaRocket
                  className={`w-5 h-5 ${
                    isBoosted ? "text-gray-400" : "text-orange-500"
                  }`}
                />
              </button>
            )}

            {/* Remove */}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-2 rounded hover:opacity-75 transition"
                aria-label="Remove Property"
              >
                <FaTrash className="text-red-500 w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
