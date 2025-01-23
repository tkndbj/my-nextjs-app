"use client";
import React, { useState } from "react";
import PastBoosts from "./PastBoosts";
import OngoingBoosts from "./OngoingBoosts";
import Chart from "./Chart";

export default function AdsPage() {
  // Maintain the selected tab state; default to "product"
  const [selectedTab, setSelectedTab] = useState("product");

  // Tab titles and corresponding itemType values
  const tabs = [
    { label: "Products", value: "product" },
    { label: "Properties", value: "property" },
    { label: "Cars", value: "car" },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ads Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`px-4 py-2 rounded ${
              selectedTab === tab.value
                ? "bg-jade-green text-white"
                : "bg-gray-200 text-gray-800"
            } focus:outline-none`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Display filtered past boosts according to selected tab */}
      <div className="grid grid-cols-1 gap-6">
        <PastBoosts filterType={selectedTab} />
        <OngoingBoosts />
        <Chart />
      </div>
    </div>
  );
}
