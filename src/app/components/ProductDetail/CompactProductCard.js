// src/components/ProductDetail/CompactProductCard.js

"use client"; // Mark as Client Component

import React, { useEffect, useState } from "react";
import Image from "next/image"; // Updated import
import { FaHeart, FaRegHeart, FaShoppingCart, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation"; // Correct import for Next.js 13 App Router
import { db } from "../../../../lib/firebase"; // Keeping your import path intact
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { useUser } from "../../../../context/UserContext"; // Keeping your import path intact
import StarRating from "../StarRating";

const CompactProductCard = ({ product }) => {
  const router = useRouter();
  const user = useUser();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : "https://via.placeholder.com/150"
  );

  useEffect(() => {
    if (user && product.id) {
      const favDocRef = doc(db, "users", user.uid, "favorites", product.id);
      const cartDocRef = doc(db, "users", user.uid, "cart", product.id);

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
  }, [user, product.id]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to manage your favorites.");
      return;
    }

    const favDocRef = doc(db, "users", user.uid, "favorites", product.id);
    const productRef = doc(db, "products", product.id);

    try {
      if (isFavorite) {
        await deleteDoc(favDocRef);
        await updateDoc(productRef, {
          favoritesCount: increment(-1),
        });
      } else {
        await setDoc(favDocRef, {
          productId: product.id,
          addedAt: serverTimestamp(),
        });
        await updateDoc(productRef, {
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

    const cartDocRef = doc(db, "users", user.uid, "cart", product.id);
    const productRef = doc(db, "products", product.id);

    try {
      if (isInCart) {
        await deleteDoc(cartDocRef);
        await updateDoc(productRef, {
          cartCount: increment(-1),
        });
      } else {
        await setDoc(cartDocRef, {
          productId: product.id,
          addedAt: serverTimestamp(),
        });
        await updateDoc(productRef, {
          cartCount: increment(1),
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
    }).format(value);
  };

  const handleCardClick = () => {
    // Implement click counts and user preference logic here if needed
    router.push(`/products/${product.id}`);
  };

  return (
    <div
      className="relative w-48 h-55 font-figtree cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="bg-background rounded-lg shadow-md overflow-hidden border-1 border-secondaryBackground transition-transform hover:scale-105 flex flex-col h-full">
        {/* Product Image */}
        <div className="w-full h-36 relative">
          <Image
            src={selectedImage}
            alt={product.productName}
            fill
            sizes="(max-width: 640px) 100vw, 
                   (max-width: 768px) 50vw, 
                   (max-width: 1024px) 33vw, 
                   25vw"
            className="object-cover" // Replaces objectFit
          />
          {/* Heart Icon on image */}
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 p-1 w-5 h-5 bg-secondaryBackground/80 rounded-full flex items-center justify-center hover:bg-secondaryBackground-hover transition-colors z-10"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" size={12} />
            ) : (
              <FaRegHeart className="text-gray-700" size={12} />
            )}
          </button>
        </div>

        {/* Product Info */}
        <div className="p-2 flex flex-col flex-grow">
          <h2 className="text-sm font-semibold text-foreground truncate">
            {product.productName}
          </h2>

          {/* Product Description or Brand Model */}
          <p className="text-xs text-gray-400 mt-1">
            {product.description
              ? product.description.length > 60
                ? `${product.description.slice(0, 60)}...`
                : product.description
              : product.brandModel}
          </p>

          {/* Star Rating */}
          <div className="flex items-center mt-1 space-x-1">
            <StarRating rating={product.averageRating} />
            <span className="text-gray-400 text-xs">
              ({product.averageRating.toFixed(1)})
            </span>
          </div>

          {/* Price */}
          <div className="mt-1">
            {product.discountPercentage && product.discountPercentage > 0 ? (
              <div className="flex items-center space-x-1">
                {/* Discounted Price */}
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(product.price)}
                </span>
                {/* Original Price with Strikethrough */}
                <span className="text-xs text-gray-500 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
                {/* Discount Percentage */}
                <span className="text-xs text-accent font-semibold">
                  %{product.discountPercentage}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(product.price)}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Add to Cart Button */}
      <button
        onClick={toggleCart}
        className={`absolute bottom-2 right-2 flex items-center justify-center p-1 rounded-full border-2 ${
          isInCart
            ? "border-accent bg-accent text-background hover:bg-accent-hover hover:border-accent-hover"
            : "border-secondaryBackground text-foreground hover:bg-secondaryBackground hover:text-background"
        } transition`}
        aria-label={isInCart ? "Remove from cart" : "Add to cart"}
      >
        {isInCart ? (
          <FaCheck className="text-xs" />
        ) : (
          <FaShoppingCart className="text-xs" />
        )}
      </button>
    </div>
  );
};

export default CompactProductCard;
