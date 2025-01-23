"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import CompactProductCard from "./CompactProductCard";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const RelatedProducts = ({ currentProduct }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!currentProduct) return;

    const relatedRef = collection(db, "products");
    const q = query(
      relatedRef,
      where("category", "==", currentProduct.category)
      // Optionally exclude the current product if needed
      // where("id", "!=", currentProduct.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Exclude current product if you wish
        .filter((p) => p.id !== currentProduct.id);

      setRelatedProducts(products);
    });

    return () => unsubscribe();
  }, [currentProduct]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: 0,
        left: -300,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: 0,
        left: 300,
        behavior: "smooth",
      });
    }
  };

  if (relatedProducts.length === 0) return null;

  return (
    <div className="bg-background p-6 rounded-lg shadow-md mt-6 overflow-hidden">
      <h2 className="text-2xl font-semibold mb-4 text-foreground">
        Related Products
      </h2>

      <div className="relative">
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-2 overflow-x-auto scrollbar-hide bg-background p-2 rounded-lg"
        >
          {relatedProducts.map((product) => (
            <CompactProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Left Scroll Button */}
        <button
          onClick={scrollLeft}
          className="hidden sm:block absolute top-1/2 left-0 transform -translate-y-1/2 bg-secondaryBackground rounded-full p-2 shadow-md hover:bg-secondaryBackground-hover transition"
          aria-label="Scroll Left"
        >
          <FaChevronLeft className="text-foreground" />
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={scrollRight}
          className="hidden sm:block absolute top-1/2 right-0 transform -translate-y-1/2 bg-secondaryBackground rounded-full p-2 shadow-md hover:bg-secondaryBackground-hover transition"
          aria-label="Scroll Right"
        >
          <FaChevronRight className="text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default RelatedProducts;
