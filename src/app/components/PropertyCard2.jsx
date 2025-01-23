"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

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
      className="
        relative w-full sm:w-64 md:w-72 h-auto font-figtree cursor-pointer
      "
    >
      <div
        className="
          bg-background rounded-2xl shadow-md overflow-hidden
          border border-secondaryBackground dark:border-2 dark:border-secondaryBackground
          transition-transform hover:scale-105 flex flex-col h-full
        "
      >
        {/* Image container with aspect ratio */}
        <div className="w-full relative aspect-[4/3]">
          <Image
            src={imageSrc}
            alt={propertyName || 'Property Image'}
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
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-semibold text-foreground line-clamp-1">
            {propertyName ?? "Untitled Property"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">
            {region ? region : ""}
            {saleType ? ` • ${saleType}` : ""}
          </p>

          {/* Icon row: bedrooms, bathrooms, houseSize */}
          <div className="flex items-center gap-4 mt-2 text-sm text-foreground">
            {typeof bedrooms === "number" && (
              <div className="flex items-center gap-1">
                <span className="font-semibold">Beds:</span>
                <span>{bedrooms}</span>
              </div>
            )}
            {typeof bathrooms === "number" && (
              <div className="flex items-center gap-1">
                <span className="font-semibold">Baths:</span>
                <span>{bathrooms}</span>
              </div>
            )}
            {typeof houseSize === "number" && (
              <div className="flex items-center gap-1">
                <span className="font-semibold">Size:</span>
                <span>{houseSize} m²</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-2 text-lg font-semibold text-foreground">
            {formatPrice(price)}
          </div>

          {/* Bottom buttons */}
          <div className="flex mt-auto gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // stop card click
                  onEdit();
                }}
                className="flex-1 text-center py-1 rounded text-white"
                style={{ backgroundColor: "#00A86B" }} // Jade green
              >
                Edit
              </button>
            )}

            {onBoost && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBoost();
                }}
                className={`
                  flex-1 text-center py-1 rounded text-white
                  transition
                  ${isBoosted ? "bg-gray-400 cursor-not-allowed" : "bg-[#FF7F50] hover:bg-[#FF6347]"}
                `}
                disabled={isBoosted}
              >
                Boost
              </button>
            )}

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="
                  flex-1 text-center py-1 rounded text-white
                  bg-red-600 hover:bg-red-700 transition
                "
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
