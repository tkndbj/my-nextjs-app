"use client";
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Adjust the path as needed
import ProductCard from "../components/ProductCard"; // Your ProductCard component
import PropertyCard from "../components/PropertyCard"; // Your PropertyCard component
import { FaEye, FaMousePointer, FaPercent } from "react-icons/fa";
import { useUser } from "../../../context/UserContext"; // Ensure this context provides the current user

// Colors
const coralColor = "#FF7F50";
const jadeColor = "#00A86B";
const blueColor = "#0000FF";

export default function PastBoosts({ filterType }) {
  const [boostHistory, setBoostHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const uid = user?.uid;

  // Fetch boost history from /users/{uid}/boostHistory where boostEndTime < now,
  // ordered descending by boostEndTime.
  useEffect(() => {
    if (!uid) return;
    const fetchBoostHistory = async () => {
      try {
        const now = new Date();
        const boostHistoryRef = collection(db, "users", uid, "boostHistory");
        const q = query(
          boostHistoryRef,
          where("boostEndTime", "<", now),
          orderBy("boostEndTime", "desc")
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setBoostHistory(docs);
      } catch (error) {
        console.error("Error fetching boost history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoostHistory();
  }, [uid]);

  if (!uid) {
    return (
      <section className="p-4 border rounded-md shadow-sm bg-background">
        <h2 className="text-xl font-semibold mb-2">Past Boosts</h2>
        <p>Please log in to view your past boosts.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="p-4 border rounded-md shadow-sm bg-background">
        <h2 className="text-xl font-semibold mb-2">Past Boosts</h2>
        <p>Loading boost history...</p>
      </section>
    );
  }

  // Filter the fetched documents based on the filterType prop.
  const filteredBoostHistory = boostHistory.filter(
    (doc) => (doc.itemType || "Unknown") === filterType
  );

  if (filteredBoostHistory.length === 0) {
    return (
      <section className="p-4 border rounded-md shadow-sm bg-background">
        <h2 className="text-xl font-semibold mb-2">Past Boosts</h2>
        <div className="h-24 flex items-center justify-center">
          <p className="text-base text-gray-500">
            No past boosts for {filterType}.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 border rounded-md shadow-sm bg-background">
      <h2 className="text-xl font-semibold mb-4">Past Boosts</h2>
      {/* Responsive grid: 1 column on small screens; 2 on sm, 3 on md, 4 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBoostHistory.map((boostDoc) => {
          const itemType = boostDoc.itemType || "Unknown";
          if (itemType === "product") {
            return (
              <PastBoostProductCard key={boostDoc.id} boostDoc={boostDoc} />
            );
          } else if (itemType === "property") {
            return (
              <PastBoostPropertyCard key={boostDoc.id} boostDoc={boostDoc} />
            );
          } else if (itemType === "car") {
            return <PastBoostCarCard key={boostDoc.id} boostDoc={boostDoc} />;
          } else {
            return (
              <FallbackPastBoostCard key={boostDoc.id} boostDoc={boostDoc} />
            );
          }
        })}
      </div>
    </section>
  );
}

/* ===============================================================
   Past Boost Product Card
   =============================================================== */
function PastBoostProductCard({ boostDoc }) {
  const [productData, setProductData] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    const itemId = boostDoc.itemId;
    if (!itemId) {
      setLoadingProduct(false);
      return;
    }
    const fetchProduct = async () => {
      try {
        const productRef = doc(db, "products", itemId);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          setProductData({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [boostDoc]);

  if (loadingProduct) {
    return (
      <div className="py-4 flex items-center justify-center">
        <span>Loading product...</span>
      </div>
    );
  }

  if (!productData) {
    return <FallbackPastBoostCard boostDoc={boostDoc} />;
  }

  const impressionsDuringBoost = boostDoc.impressionsDuringBoost || 0;
  const clicksDuringBoost = boostDoc.clicksDuringBoost || 0;
  const ctr =
    impressionsDuringBoost > 0
      ? ((clicksDuringBoost / impressionsDuringBoost) * 100).toFixed(2)
      : "0";

  return (
    <div>
      {/* Card */}
      <div className="mb-2">
        <ProductCard product={productData} />
      </div>
      {/* Metrics row underneath */}
      <MetricsRow
        impressions={impressionsDuringBoost}
        clicks={clicksDuringBoost}
        ctr={ctr}
      />
    </div>
  );
}

/* ===============================================================
   Past Boost Property Card
   =============================================================== */
function PastBoostPropertyCard({ boostDoc }) {
  const [propertyData, setPropertyData] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  useEffect(() => {
    const itemId = boostDoc.itemId;
    if (!itemId) {
      setLoadingProperty(false);
      return;
    }
    const fetchProperty = async () => {
      try {
        const propertyRef = doc(db, "properties", itemId);
        const docSnap = await getDoc(propertyRef);
        if (docSnap.exists()) {
          // Pass the whole document data to PropertyCard as "property"
          setPropertyData({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [boostDoc]);

  if (loadingProperty) {
    return (
      <div className="py-4 flex items-center justify-center">
        <span>Loading property...</span>
      </div>
    );
  }

  if (!propertyData) {
    return <FallbackPastBoostCard boostDoc={boostDoc} />;
  }

  const impressionsDuringBoost = boostDoc.impressionsDuringBoost || 0;
  const clicksDuringBoost = boostDoc.clicksDuringBoost || 0;
  const ctr =
    impressionsDuringBoost > 0
      ? ((clicksDuringBoost / impressionsDuringBoost) * 100).toFixed(2)
      : "0";

  return (
    <div>
      {/* Card */}
      <div className="mb-2">
        <PropertyCard property={propertyData} />
      </div>
      {/* Metrics row */}
      <MetricsRow
        impressions={impressionsDuringBoost}
        clicks={clicksDuringBoost}
        ctr={ctr}
      />
    </div>
  );
}

/* ===============================================================
   Past Boost Car Card
   =============================================================== */
function PastBoostCarCard({ boostDoc }) {
  const [carData, setCarData] = useState(null);
  const [loadingCar, setLoadingCar] = useState(true);

  useEffect(() => {
    const itemId = boostDoc.itemId;
    if (!itemId) {
      setLoadingCar(false);
      return;
    }
    const fetchCar = async () => {
      try {
        const carRef = doc(db, "cars", itemId);
        const docSnap = await getDoc(carRef);
        if (docSnap.exists()) {
          setCarData({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching car:", error);
      } finally {
        setLoadingCar(false);
      }
    };

    fetchCar();
  }, [boostDoc]);

  if (loadingCar) {
    return (
      <div className="py-4 flex items-center justify-center">
        <span>Loading car...</span>
      </div>
    );
  }

  if (!carData) {
    return <FallbackPastBoostCard boostDoc={boostDoc} />;
  }

  const impressionsDuringBoost = boostDoc.impressionsDuringBoost || 0;
  const clicksDuringBoost = boostDoc.clicksDuringBoost || 0;
  const ctr =
    impressionsDuringBoost > 0
      ? ((clicksDuringBoost / impressionsDuringBoost) * 100).toFixed(2)
      : "0";

  return (
    <div>
      {/* Inline Car Card */}
      <div className="mb-2 border rounded-md shadow-sm overflow-hidden">
        {carData.imageUrls && carData.imageUrls.length > 0 ? (
          <img
            src={carData.imageUrls[0]}
            alt={carData.carName || "Car"}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gray-300 flex items-center justify-center">
            <span>No Image</span>
          </div>
        )}
        <div className="p-2">
          <h3 className="text-sm font-bold truncate">
            {carData.carName || "Unnamed"}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {carData.brand || "Unknown"}
          </p>
          <p className="text-sm text-green-600">
            {carData.price ? Number(carData.price).toFixed(0) : "--"}{" "}
            {carData.currency || "TL"}
          </p>
        </div>
      </div>
      {/* Metrics row */}
      <MetricsRow
        impressions={impressionsDuringBoost}
        clicks={clicksDuringBoost}
        ctr={ctr}
      />
    </div>
  );
}

/* ===============================================================
   Fallback Past Boost Card
   =============================================================== */
function FallbackPastBoostCard({ boostDoc }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);
    return new Intl.DateTimeFormat("default", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const itemName = boostDoc.itemName || "Unnamed";
  const itemType = boostDoc.itemType || "Unknown";
  const startStr = formatDate(boostDoc.boostStartTime);
  const endStr = formatDate(boostDoc.boostEndTime);
  const impressions = boostDoc.impressionsDuringBoost || 0;
  const clicks = boostDoc.clicksDuringBoost || 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0";

  return (
    <div className="border rounded-md shadow-sm p-4 bg-white">
      <div className="mb-2 flex items-center">
        <div className="w-16 h-16 bg-gray-300 flex items-center justify-center">
          <span className="text-2xl">🖼️</span>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-bold">
            {itemType}: {itemName}
          </h3>
          <p className="text-sm">Boost Start: {startStr}</p>
          <p className="text-sm">Boost End: {endStr}</p>
        </div>
      </div>
      <MetricsRow impressions={impressions} clicks={clicks} ctr={ctr} />
    </div>
  );
}

/* ===============================================================
   MetricsRow Component
   =============================================================== */
function MetricsRow({ impressions, clicks, ctr }) {
  return (
    // Added a small negative left margin to shift the entire row slightly left.
    <div className="flex items-center justify-center text-sm text-gray-700 gap-1 -ml-1">
      <div className="flex items-center gap-1">
        <FaEye size={17} color={coralColor} />
        <span>{impressions}</span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <FaMousePointer size={17} color={jadeColor} />
        <span>{clicks}</span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <FaPercent size={17} color={blueColor} />
        <span>{ctr}%</span>
      </div>
    </div>
  );
}
