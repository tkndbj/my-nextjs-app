"use client";

import React, { useEffect, useState } from "react";
import { FaTimes, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import FullScreenImage from "./FullScreenImage";
import TranslateReviewButton from "./TranslateReviewButton";
import "./AllReviewsWindow.css";

const AllReviewsWindow = ({ isOpen, onClose, productId }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!productId || !isOpen) return;

    const reviewsRef = collection(db, "products", productId, "reviews");
    const q = query(reviewsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Ensure imageUrls is always an array
        let imageUrls = [];
        if (Array.isArray(data.imageUrls)) {
          imageUrls = data.imageUrls;
        } else if (data.imageUrl) {
          imageUrls = [data.imageUrl];
        }

        return {
          id: doc.id,
          ...data,
          imageUrls,
        };
      });
      setReviews(fetchedReviews);
    });

    return () => unsubscribe();
  }, [productId, isOpen]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon" />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon" />);
    }

    return <div className="stars-container">{stars}</div>;
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === "reviews-backdrop") {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="reviews-backdrop" onClick={handleBackdropClick}>
          <div className="reviews-window">
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close Reviews Window"
            >
              <FaTimes size={24} />
            </button>
            <div className="reviews-header">
              <h2>All Reviews</h2>
            </div>
            <div className="reviews-content">
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet.</p>
              ) : (
                <ul className="reviews-list">
                  {reviews.map((review) => (
                    <li key={review.id} className="review-item">
                      <div className="review-header">
                        {renderStars(review.rating)}
                        {review.isBoosted && (
                          <span className="featured-label">Featured</span>
                        )}
                      </div>

                      {/* Instead of directly displaying review.review, we’ll let the TranslateReviewButton handle display. */}
                      <TranslateReviewButton reviewText={review.review} />

                      {/* Keep images */}
                      {review.imageUrls && review.imageUrls.length > 0 && (
                        <div className="review-images">
                          {review.imageUrls.map((imgUrl, idx) => (
                            <FullScreenImage key={idx} imageUrl={imgUrl} />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllReviewsWindow;
