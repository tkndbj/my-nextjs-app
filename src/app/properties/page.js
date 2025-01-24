// src/app/pages/properties/PropertiesPage.jsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { FaPlus } from "react-icons/fa";
import PropertyCard from "../components/PropertyCard";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function PropertiesPage() {
  const router = useRouter(); // Initialize the router
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const q = query(
          collection(db, "properties"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Boosted properties first
        const boosted = items.filter((prop) => prop.isBoosted);
        const notBoosted = items.filter((prop) => !prop.isBoosted);
        const sorted = [...boosted, ...notBoosted];
        setProperties(sorted);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
      }
    }

    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <div className="flex-1 transition-all duration-300 bg-background">
        {/* Fixed Header */}
        <Header />

        {/* Main Content */}
        <main className="pt-16 sm:pt-20 p-4 sm:p-6 mx-auto max-w-7xl bg-background">
          {properties.length === 0 ? (
            <p className="text-center text-foreground">No properties found.</p>
          ) : (
            <div className="mx-auto w-full max-w-7xl">
              {/* Responsive Grid Layout */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {properties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating "+" Button */}
      <button
        onClick={() => router.push("/listproperty")}
        className="fixed bottom-6 right-6 bg-jade-green hover:scale-105 transition-transform text-white p-4 rounded-md shadow-lg flex items-center justify-center"
        aria-label="List a new property"
      >
        <FaPlus size={20} />
      </button>
    </div>
  );
}
