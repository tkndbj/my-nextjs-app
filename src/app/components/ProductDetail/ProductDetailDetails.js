"use client";

import React from "react";
import PropTypes from "prop-types";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const ProductDetailDetails = ({ product }) => {
  const { brandModel, condition, quantity, returnEligibility } = product;

  const detailItems = [
    { label: "Brand/Model", value: brandModel },
    { label: "Condition", value: condition },
    { label: "Quantity", value: quantity },
    {
      label: "Return Eligibility",
      value: returnEligibility ? "Eligible" : "Not Eligible",
      icon: returnEligibility ? (
        <FaCheckCircle className="text-accent inline ml-2" />
      ) : (
        <FaTimesCircle className="text-error inline ml-2" />
      ),
    },
  ];

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-semibold mb-5 text-foreground">
        Product Details
      </h2>
      <ul className="space-y-4">
        {detailItems.map((item, index) => (
          <li key={index} className="flex justify-between items-center">
            <span className="text-lg font-medium text-foreground">
              {item.label}:
            </span>
            <span className="text-lg text-foreground flex items-center">
              {item.value}
              {item.icon && item.icon}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

ProductDetailDetails.propTypes = {
  product: PropTypes.shape({
    brandModel: PropTypes.string.isRequired,
    condition: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    returnEligibility: PropTypes.bool.isRequired,
  }).isRequired,
};

export default ProductDetailDetails;
