"use client";

import React, { useState } from "react";
import { FaTruck, FaInfoCircle } from "react-icons/fa";
import DeliveryModal from "./DeliveryModal";

const ProductDetailDelivery = ({ deliveryOption }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deliveryDetails = {
    "Fast Delivery": {
      title: "Fast Delivery",
      description: "Get your product delivered within 2-3 business days.",
    },
    "Self Delivery": {
      title: "Self Delivery",
      description: "Pick up your product from our store at your convenience.",
    },
  };

  const { title, description } = deliveryDetails[deliveryOption] || {
    title: "Delivery Information",
    description: "Details about the delivery options.",
  };

  return (
    <div className="w-full bg-background p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between mt-4">
      <div className="flex items-center mb-2 sm:mb-0">
        <FaTruck className="text-accent text-2xl mr-2 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-foreground text-sm">{description}</p>
        </div>
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-accent hover:text-accent-dark transition-colors"
        aria-label="More Delivery Information"
      >
        <FaInfoCircle size={20} />
      </button>

      {isModalOpen && (
        <DeliveryModal
          title={title}
          description={description}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetailDelivery;
