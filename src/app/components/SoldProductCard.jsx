"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * For the "Sold" products sub-tab.
 * Clicking the card => go to /soldproduct/[id].
 */
export default function SoldProductCard({ soldItem, formatDate }) {
  const router = useRouter();

  // We assume 'soldItem.productImage' is the main image
  // and 'soldItem.id' is the transaction doc id.
  const {
    id,
    productImage,
    productName,
    price,
    currency,
    timestamp,
    quantity,
    shipmentStatus,
  } = soldItem;

  const imageSrc = productImage || "https://via.placeholder.com/300x200";

  // onClick => /soldproduct/[id]
  const handleCardClick = () => {
    router.push(`/soldproduct/${id}`);
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
            alt={productName || 'Sold Product'}
            fill
            sizes="(max-width: 640px) 100vw,
                  (max-width: 768px) 50vw,
                  (max-width: 1024px) 33vw,
                  25vw"
            className="object-cover"
          />
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-semibold text-foreground line-clamp-1">
            {productName}
          </h2>

          <p className="font-semibold text-blue-600 mb-2">
            {currency} {price}
          </p>

          <p className="text-sm text-gray-500">
            Sold on: {formatDate(timestamp)}
          </p>
          <p className="text-sm text-gray-500">Quantity: {quantity || 1}</p>
          <p className="text-sm text-gray-500">
            Shipment Status: {shipmentStatus || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
