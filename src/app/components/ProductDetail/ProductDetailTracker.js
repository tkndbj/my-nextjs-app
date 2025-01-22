// components/ProductDetail/ProductDetailTracker.js

"use client";

import React from "react";
import { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import StarRating from "../StarRating";

const ProductDetailTracker = ({ productId }) => {
  const [trackers, setTrackers] = useState({
    clickCount: 0,
    purchaseCount: 0,
    cartCount: 0,
    favoritesCount: 0,
  });

  useEffect(() => {
    const productRef = doc(db, "products", productId);

    const unsubscribe = onSnapshot(productRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTrackers({
          clickCount: data.clickCount || 0,
          purchaseCount: data.purchaseCount || 0,
          cartCount: data.cartCount || 0,
          favoritesCount: data.favoritesCount || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [productId]);

  const trackerItems = [
    { label: "Clicks", count: trackers.clickCount },
    { label: "Purchases", count: trackers.purchaseCount },
    { label: "In Cart", count: trackers.cartCount },
    { label: "Favorites", count: trackers.favoritesCount },
  ];

  return (
    <div className="bg-background p-4 rounded-lg shadow-md flex justify-around mt-4">
      {trackerItems.map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <span className="text-xl font-bold text-accent">{item.count}</span>
          <span className="text-sm text-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ProductDetailTracker;
