"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Image from "next/image";
import { FaTimes, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

export default function CartWindow({ user, onClose }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  <div
  style={{
    position: 'fixed',
    top: 0,
    right: 0,
    width: '80vw', // Adjust width as needed
    height: '100vh',
    // ... other styles ...
  }}
></div>

  useEffect(() => {
    if (!user) return;
    const fetchCartItems = async () => {
      setLoading(true);
      try {
        const cartRef = collection(db, "users", user.uid, "cart");
        const cartSnapshot = await getDocs(query(cartRef));
        const items = [];
        for (const docSnap of cartSnapshot.docs) {
          const productDoc = await getDoc(doc(db, "products", docSnap.id));
          if (productDoc.exists()) {
            items.push({ id: docSnap.id, ...productDoc.data() });
          }
        }
        setCartItems(items);
      } catch (error) {
        console.error("Error fetching cart items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, [user]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const truncate = (str, length = 80) => {
    if (!str) return "";
    return str.length > length ? str.slice(0, length) + "..." : str;
  };

  const renderStars = (rating) => {
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
    return stars;
  };

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0),
    0
  );

  return (
    <div
      className={`fixed top-0 right-0 w-80 sm:w-96 h-full bg-[var(--background)] text-[var(--foreground)] shadow-xl z-50 overflow-hidden transform transition-all duration-300 flex flex-col ${
        isClosing ? "animate-slideOut" : "animate-slideIn"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-bold">My Cart</h2>
        <button onClick={handleClose} className="p-2 hover:text-accent">
          <FaTimes />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <p>Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex space-x-4 bg-[var(--secondary-background)] p-3 rounded-lg"
              >
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <Image
                      src={item.imageUrls[0]}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-base mb-1">
                    {item.productName}
                  </p>
                  {item.brandModel && (
                    <p className="text-gray-500">Model: {item.brandModel}</p>
                  )}
                  {item.averageRating !== undefined && (
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
                  <p className="text-sm font-medium mt-1">
                    {item.price?.toFixed(2)} TRY
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom section with total and checkout */}
      {cartItems.length > 0 && !loading && (
        <div className="border-t border-gray-300 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Total:</span>
            <span className="font-bold">{totalPrice.toFixed(2)} TRY</span>
          </div>
          <button
            className="w-full py-2 rounded bg-[#00A86B] text-white font-semibold hover:bg-green-700 transition"
            // Add any checkout logic here if needed
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
