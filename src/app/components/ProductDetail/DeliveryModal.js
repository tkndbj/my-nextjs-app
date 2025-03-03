"use client";

import React from "react";
import { FaTimes } from "react-icons/fa";

const DeliveryModal = ({ title, description, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-white rounded-lg w-11/12 max-w-md p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Close Modal"
        >
          <FaTimes size={20} />
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
};

export default DeliveryModal;
  