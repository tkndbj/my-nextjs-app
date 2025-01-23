"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Image from "next/image";
import {
  FaTimes,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaBoxOpen,
  FaHome,
} from "react-icons/fa";

/**
 * CartWindow (FavoritesWindow) with Tabs for Products & Properties
 *
 * - We do ONE fetch from "users/{uid}/favorites" subcollection.
 * - Each doc has either productId or propertyId.
 * - We then fetch the relevant doc from "products" or "properties".
 * - Store them in separate arrays so user can switch tabs easily.
 */
export default function CartWindow({ user, onClose }) {
  // Tabs: "products" or "properties"
  const [activeTab, setActiveTab] = useState("products");

  // Fetched items
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteProperties, setFavoriteProperties] = useState([]);

  // We only fetch once. If you prefer separate fetches, you can do that, but this is simpler.
  const [alreadyFetched, setAlreadyFetched] = useState(false);
  const [loading, setLoading] = useState(false);

  // For closing animation
  const [isClosing, setIsClosing] = useState(false);

  
  // On mount or when user changes, load all favorites if not already
  useEffect(() => {
    if (!user || alreadyFetched) return;

    async function fetchAllFavorites() {
      setLoading(true);
      try {
        const favoritesRef = collection(db, "users", user.uid, "favorites");
        const snap = await getDocs(query(favoritesRef));

        const productArray = [];
        const propertyArray = [];

        // Go through each doc in "favorites"
        for (const favDoc of snap.docs) {
          const favData = favDoc.data();
          // If it has productId => fetch from "products"
          if (favData.productId) {
            const productRef = doc(db, "products", favData.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              productArray.push({ id: productSnap.id, ...productSnap.data() });
            }
          }
          // If it has propertyId => fetch from "properties"
          else if (favData.propertyId) {
            const propRef = doc(db, "properties", favData.propertyId);
            const propSnap = await getDoc(propRef);
            if (propSnap.exists()) {
              propertyArray.push({ id: propSnap.id, ...propSnap.data() });
            }
          }
        }

        setFavoriteProducts(productArray);
        setFavoriteProperties(propertyArray);
        setAlreadyFetched(true);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllFavorites();
  }, [user, alreadyFetched]);

  // Close with animation
  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }

  // Helper: Truncate text
  function truncate(str, length = 80) {
    if (!str) return "";
    return str.length > length ? str.slice(0, length) + "..." : str;
  }

  // Helper: Render star rating
  function renderStars(rating) {
    if (rating === undefined) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="text-yellow-500 inline-block" />
      );
    }
    if (halfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="text-yellow-500 inline-block" />
      );
    }
    const totalDisplayed = halfStar ? fullStars + 1 : fullStars;
    for (let i = totalDisplayed; i < 5; i++) {
      stars.push(
        <FaRegStar
          key={`empty-${i}`}
          className="text-yellow-500 inline-block"
        />
      );
    }
    return <>{stars}</>;
  }

  // Decide which list to show
  let currentItems = [];
  if (activeTab === "products") {
    currentItems = favoriteProducts;
  } else {
    currentItems = favoriteProperties;
  }

  const loadingCurrent = loading;

  return (
    <div
    className={`fixed top-0 right-0 w-80 sm:w-96 h-[100dvh] min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] shadow-xl z-50 overflow-hidden transform transition-all duration-300 flex flex-col ${
      isClosing ? "animate-slideOut" : "animate-slideIn"
    }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-bold">Favorites</h2>
        <button onClick={handleClose} className="p-2 hover:text-accent">
          <FaTimes />
        </button>
      </div>

      {/* Tabs (top) */}
      <div className="flex">
        {/* Products Tab */}
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-2 text-center cursor-pointer transition-colors duration-200
            ${
              activeTab === "products"
                ? "bg-jade-green text-white"
                : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
            }`}
        >
          <div className="inline-flex items-center gap-1 justify-center">
            <FaBoxOpen />
            <span>Products</span>
          </div>
        </button>

        {/* Properties Tab */}
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 py-2 text-center cursor-pointer transition-colors duration-200
            ${
              activeTab === "properties"
                ? "bg-jade-green text-white"
                : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
            }`}
        >
          <div className="inline-flex items-center gap-1 justify-center">
            <FaHome />
            <span>Properties</span>
          </div>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loadingCurrent ? (
          <p>Loading your favorites...</p>
        ) : currentItems.length === 0 ? (
          <p>No {activeTab} found in favorites.</p>
        ) : (
          <div className="space-y-4">
            {currentItems.map((item) => {
              // If tab is "products," we display product-specific fields
              // If tab is "properties," we display property-specific fields
              const isProduct = activeTab === "products";

              // Decide image URLs
              let imageUrls = isProduct ? item.imageUrls : item.fileUrls;
              let title = isProduct
                ? item.productName || "Untitled Product"
                : item.propertyName || "Untitled Property";

              return (
                <div
                  key={item.id}
                  className="flex space-x-4 bg-[var(--secondary-background)] p-3 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                    {imageUrls && imageUrls.length > 0 ? (
                      <Image
                        src={imageUrls[0]}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-base mb-1">{title}</p>

                    {isProduct && item.brandModel && (
                      <p className="text-gray-500">Model: {item.brandModel}</p>
                    )}
                    {isProduct && item.averageRating !== undefined && (
                      <div className="flex items-center space-x-1">
                        {renderStars(item.averageRating)}
                        <span className="text-gray-500">
                          ({item.averageRating.toFixed(1)})
                        </span>
                      </div>
                    )}

                    {item.description && (
                      <p className="text-gray-500">
                        {truncate(item.description)}
                      </p>
                    )}

                    {/* Price */}
                    {isProduct && item.price != null && (
                      <p className="text-sm font-medium mt-1">
                        {item.price.toFixed(2)} TRY
                      </p>
                    )}
                    {!isProduct && item.price != null && (
                      <p className="text-sm font-medium mt-1">
                        {item.price} {item.currency || "TRY"}
                      </p>
                    )}

                    {/* Region if property */}
                    {!isProduct && item.region && (
                      <p className="text-gray-500 capitalize">
                        Location: {item.region}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
