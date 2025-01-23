"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaCheck,
} from "react-icons/fa";
import { useMarket } from "../../../context/MarketContext";
import { useUser } from "../../../context/UserContext";
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

export default function ProductCard({ product }) {
  const {
    productName,
    price,
    originalPrice,
    discountPercentage,
    description,
    imageUrls,
    averageRating,
    colorImages,
    brandModel,
    id,
    currency,
    userId,
    isBoosted,
  } = product;

  const router = useRouter();
  const { incrementClickCount, recordProductClick } = useMarket();

  const [selectedImage, setSelectedImage] = useState(
    imageUrls && imageUrls.length > 0
      ? imageUrls[0]
      : "https://via.placeholder.com/300x200"
  );

  const user = useUser();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    if (user && id) {
      const favoritesRef = collection(db, "users", user.uid, "favorites");
      const cartRef = collection(db, "users", user.uid, "cart");

      const favDocRef = doc(favoritesRef, id);
      const cartDocRef = doc(cartRef, id);

      const unsubscribeFav = onSnapshot(favDocRef, (docSnap) => {
        setIsFavorite(docSnap.exists());
      });

      const unsubscribeCart = onSnapshot(cartDocRef, (docSnap) => {
        setIsInCart(docSnap.exists());
      });

      return () => {
        unsubscribeFav();
        unsubscribeCart();
      };
    } else {
      setIsFavorite(false);
      setIsInCart(false);
    }
  }, [user, id]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage your favorites.");
      return;
    }

    try {
      if (isFavorite) {
        await deleteDoc(doc(db, "users", user.uid, "favorites", id));
        await updateDoc(doc(db, "products", id), {
          favoritesCount: increment(-1),
        });
      } else {
        await setDoc(doc(db, "users", user.uid, "favorites", id), {
          productId: id,
          addedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "products", id), {
          favoritesCount: increment(1),
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      alert("An error occurred while updating favorites. Please try again.");
    }
  };

  const toggleCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage your cart.");
      return;
    }

    try {
      if (isInCart) {
        await deleteDoc(doc(db, "users", user.uid, "cart", id));
      } else {
        await setDoc(doc(db, "users", user.uid, "cart", id), {
          productId: id,
          addedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      alert("An error occurred while updating the cart. Please try again.");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      currencyDisplay: "symbol",
    }).format(value);
  };

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

  const handleCardClick = () => {
    incrementClickCount(id).catch((error) => {
      console.error("Error incrementing click count:", error);
    });
    recordProductClick(product).catch((error) => {
      console.error("Error recording product click:", error);
    });
    router.push(`/products/${id}`);
  };

  const displayText =
    description && description.trim() !== ""
      ? description
      : brandModel && brandModel.trim() !== ""
      ? brandModel
      : "No description available.";

  return (
    <div
      className="relative w-full sm:w-64 md:w-72 h-auto font-figtree cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="bg-background rounded-2xl shadow-md overflow-hidden border border-secondaryBackground dark:border-2 dark:border-secondaryBackground transition-transform hover:scale-105 flex flex-col h-full">
        {/* Keep a consistent aspect ratio so it nicely scales on mobile */}
        <div className="w-full relative aspect-[4/3]">
          <Image
            src={selectedImage}
            alt={productName}
            fill
            className="object-cover"
          />
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 p-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center hover:bg-secondaryBackground transition-colors z-10"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" />
            ) : (
              <FaRegHeart className="text-gray-700" />
            )}
          </button>
        </div>

        <div className="p-2 flex flex-col flex-grow">
          <h2 className="text-base font-semibold text-foreground line-clamp-1">
            {productName}
          </h2>

          <div className="flex items-center mt-1 justify-between">
            <div className="flex items-center space-x-1">
              {renderStars()}
              <span className="text-gray-400 text-xs">({roundedRating})</span>
            </div>
            {isBoosted && (
              <span className="text-xs font-semibold text-blue-500">
                Featured
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 flex-grow line-clamp-2">
            {displayText}
          </p>

          <div className="mt-1">
            {discountPercentage && discountPercentage > 0 ? (
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(price)}
                </span>
                <span className="text-xs text-gray-500 line-through">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="text-xs text-jade-green dark:text-accent font-semibold">
                  %{discountPercentage}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(price)}
              </div>
            )}
          </div>

          {colors.length > 0 && (
            <div className="flex items-center gap-1 my-1">
              {colors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  className="w-4 h-4 rounded-full border border-gray-300 hover:scale-110 transition"
                  style={{ backgroundColor: colorNameToColor(color) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorClick(color);
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={toggleCart}
        className={`absolute bottom-2 right-2 flex items-center justify-center p-1 rounded-full border-2 ${
          isInCart
            ? "bg-jade-green hover:bg-jade-green border-jade-green dark:bg-accent dark:hover:bg-accent dark:border-accent text-white dark:text-foreground"
            : "border-secondaryBackground text-foreground hover:bg-secondaryBackground hover:text-background"
        } transition`}
        aria-label={isInCart ? "Remove from cart" : "Add to cart"}
      >
        {isInCart ? <FaCheck className="text-md" /> : <FaShoppingCart className="text-md" />}
      </button>
    </div>
  );
}
