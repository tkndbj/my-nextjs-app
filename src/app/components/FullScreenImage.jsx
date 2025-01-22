import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./FullScreenImage.css";

const FullScreenImage = ({ imageUrl }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={imageUrl}
        alt="Review"
        className="review-image"
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="fullscreen-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="fullscreen-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="fullscreen-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Image"
            >
              <FaTimes size={24} />
            </button>
            <img
              src={imageUrl}
              alt="Full Review"
              className="fullscreen-image"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FullScreenImage;
