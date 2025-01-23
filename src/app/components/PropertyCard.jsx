"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaBed,
  FaBath,
  FaRulerCombined,
} from "react-icons/fa";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useUser } from "../../../context/UserContext";

export default function PropertyCard({ property }) {
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
  } = property;

  const router = useRouter();
  const user = useUser();

  // Select the first image or fallback
  const [selectedImage] = useState(
    fileUrls.length > 0 ? fileUrls[0] : "https://via.placeholder.com/300x200"
  );

  // Favorite logic
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user && user.uid && id) {
      const favoritesRef = collection(db, "users", user.uid, "favorites");
      const favDocRef = doc(favoritesRef, id);

      const unsubscribeFav = onSnapshot(favDocRef, (docSnap) => {
        setIsFavorite(docSnap.exists());
      });

      return () => {
        unsubscribeFav();
      };
    } else {
      setIsFavorite(false);
    }
  }, [user, id]);

  const toggleFavorite = async (e) => {
    e.stopPropagation(); // prevent card-click navigation
    if (!user || !user.uid) {
      alert("Please log in to manage your favorites.");
      return;
    }

    try {
      const propertyRef = doc(db, "properties", id);
      const favoriteDocRef = doc(db, "users", user.uid, "favorites", id);

      if (isFavorite) {
        await deleteDoc(favoriteDocRef);
        await updateDoc(propertyRef, {
          favorites: increment(-1),
        });
      } else {
        await setDoc(favoriteDocRef, {
          propertyId: id,
          addedAt: serverTimestamp(),
        });
        await updateDoc(propertyRef, {
          favorites: increment(1),
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      alert("An error occurred while updating favorites. Please try again.");
    }
  };

  // Format price: no decimals, with commas, prefixed by TRY
  const formatPrice = (value) => {
    if (!value) return "TRY --";
    const formattedValue = Math.floor(value).toLocaleString("en-US");
    return `TRY ${formattedValue}`;
  };

  // Navigate to the new property detail page
  const handleCardClick = () => {
    // Updated path: /propertydetail/[id]
    router.push(`/propertydetail/${id}`);
  };

  return (
    <div
      className="relative w-72 h-[400px] font-figtree cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="bg-background rounded-2xl shadow-md overflow-hidden border border-secondaryBackground dark:border-2 dark:border-secondaryBackground transition-transform hover:scale-105 flex flex-col h-full">
        {/* Property Image */}
        <div className="w-full h-52 relative">
          <Image
            src={selectedImage}
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

        {/* Property Info */}
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-semibold text-foreground line-clamp-1">
            {propertyName ?? "Untitled Property"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">
            {region ? region : ""}
            {saleType ? ` • ${saleType}` : ""}
          </p>

          {/* Icon Row: Bedrooms, Bathrooms, House Size */}
          <div className="flex items-center gap-4 mt-2">
            {typeof bedrooms === "number" && (
              <div className="flex items-center gap-1 text-sm">
                <FaBed className="text-jade-green" />
                <span className="text-foreground">{bedrooms}</span>
              </div>
            )}
            {typeof bathrooms === "number" && (
              <div className="flex items-center gap-1 text-sm">
                <FaBath className="text-jade-green" />
                <span className="text-foreground">{bathrooms}</span>
              </div>
            )}
            {typeof houseSize === "number" && (
              <div className="flex items-center gap-1 text-sm">
                <FaRulerCombined className="text-jade-green" />
                <span className="text-foreground">{houseSize} m²</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-2 text-lg font-semibold text-foreground">
            {formatPrice(price)}
          </div>
        </div>
      </div>

      {/* Favorite Button (Bottom-right) */}
      <button
        onClick={toggleFavorite}
        className={`absolute bottom-3 right-3 flex items-center justify-center p-2 rounded-full border-2 ${
          isFavorite
            ? "bg-jade-green hover:bg-jade-green border-jade-green text-white"
            : "border-secondaryBackground text-foreground hover:bg-secondaryBackground hover:text-background"
        } transition`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? <FaHeart /> : <FaRegHeart />}
      </button>
    </div>
  );
}
