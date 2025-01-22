// components/ProductDetail/ProductDetailSellerInfo.js

"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase"; // Keeping your import path intact
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import StarRating from "../StarRating";

const ProductDetailSellerInfo = ({ sellerId }) => {
  const [sellerInfo, setSellerInfo] = useState({
    sellerName: "",
    sellerAverageRating: 0,
    sellerTotalReviews: 0,
  });

  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (!sellerId) return;
      try {
        // Fetch seller's basic info
        const sellerRef = doc(db, "users", sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          const data = sellerSnap.data();
          setSellerInfo((prev) => ({
            ...prev,
            sellerName: data.displayName || "Unknown Seller",
          }));
        }

        // Reference to the 'reviews' subcollection
        const reviewsRef = collection(db, "users", sellerId, "reviews");

        // Listen for real-time updates in the 'reviews' subcollection
        const unsubscribeReviews = onSnapshot(reviewsRef, (snapshot) => {
          let totalRating = 0;
          snapshot.forEach((doc) => {
            const rating = doc.data().rating;
            if (typeof rating === "number") {
              totalRating += rating;
            }
          });
          const average = snapshot.size > 0 ? totalRating / snapshot.size : 0;
          setSellerInfo((prev) => ({
            ...prev,
            sellerAverageRating: average,
            sellerTotalReviews: snapshot.size,
          }));
        });

        // Cleanup listener on unmount
        return () => {
          unsubscribeReviews();
        };
      } catch (error) {
        console.error("Error fetching seller info:", error);
      }
    };

    fetchSellerInfo();
  }, [sellerId]);

  const handleSellerClick = () => {
    // Navigate to seller's profile or reviews page
    router.push(`/seller/${sellerId}`); // Adjust the route as needed
  };

  return (
    <div
      className="bg-background p-4 rounded-lg shadow-md flex items-center justify-between mt-4 cursor-pointer hover:bg-secondaryBackground transition-colors"
      onClick={handleSellerClick}
      aria-label="View Seller Information"
    >
      <div className="flex items-center">
        {/* Seller Avatar or Icon */}
        <div className="w-12 h-12 rounded-full bg-secondaryBackground flex items-center justify-center mr-4">
          {/* Placeholder Avatar */}
          <span className="text-foreground text-xl">
            {sellerInfo.sellerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {sellerInfo.sellerName}
          </h3>
          <div className="flex items-center space-x-1">
            <StarRating rating={sellerInfo.sellerAverageRating} />
            <span className="text-gray-400 text-sm">
              ({sellerInfo.sellerTotalReviews} Reviews)
            </span>
          </div>
        </div>
      </div>
      <button
        className="text-accent hover:text-accent-hover transition-colors"
        aria-label="View Seller Reviews"
      >
        {/* Optional: Add an arrow or info icon */}
        &rarr;
      </button>
    </div>
  );
};

export default ProductDetailSellerInfo;
