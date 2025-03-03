"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import StarRating from "../StarRating";
import { FaLanguage } from "react-icons/fa";
import AllReviewsWindow from "../AllReviewsWindow";

const ProductDetailReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [isSeeAllOpen, setIsSeeAllOpen] = useState(false);

  useEffect(() => {
    const reviewsRef = collection(db, "products", productId, "reviews");
    const q = query(reviewsRef, orderBy("timestamp", "desc"), limit(3));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviews(fetchedReviews);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSeeAll = () => {
    setIsSeeAllOpen(true);
  };

  // Dummy translate function
  const translateReview = (reviewId) => {
    alert(`Translate review ID: ${reviewId}`);
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Reviews</h2>
        <button
          onClick={handleSeeAll}
          className="text-accent hover:text-accent-dark transition-colors text-base"
        >
          See All Reviews
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-600">No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div
            key={review.id}
            className="border-t border-gray-200 pt-6 first:pt-0"
          >
            <div className="flex items-center space-x-3">
              <StarRating rating={review.rating} />
              <span className="text-gray-500 text-sm">
                {new Date(review.timestamp?.toDate()).toLocaleDateString()}
              </span>
            </div>

            <p className="text-gray-700 mt-3">{review.review}</p>

            {review.imageUrls && review.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {review.imageUrls.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Review Image ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                    onClick={() => window.open(imgUrl, "_blank")}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2 mt-4">
              <FaLanguage
                className="text-accent cursor-pointer"
                onClick={() => translateReview(review.id)}
              />
              <span
                className="text-accent cursor-pointer text-sm"
                onClick={() => translateReview(review.id)}
              >
                Translate
              </span>
            </div>
          </div>
        ))
      )}

      <AllReviewsWindow
        isOpen={isSeeAllOpen}
        onClose={() => setIsSeeAllOpen(false)}
        productId={productId}
      />
    </div>
  );
};

export default ProductDetailReviews;
