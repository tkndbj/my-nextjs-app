"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * For the "Bought" products sub-tab.
 * Clicking the card => go to /shipmentstatus/[id].
 */
export default function BoughtProductCard({ boughtItem, formatDate }) {
  const router = useRouter();

  const {
    id,
    productImage,
    productName,
    price,
    currency,
    timestamp,
    quantity,
    shipmentStatus,
  } = boughtItem;

  const imageSrc = productImage || "https://via.placeholder.com/300x200";

  // onClick => /shipmentstatus/[id]
  const handleCardClick = () => {
    router.push(`/shipmentstatus/${id}`);
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
        {/* Image */}
        <div className="w-full h-52 relative">
          <Image
            src={imageSrc}
            alt={productName || "Bought Product"}
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
            Bought on: {formatDate(timestamp)}
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
