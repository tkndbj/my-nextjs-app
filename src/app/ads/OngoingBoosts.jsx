"use client";
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../lib/firebase"; // adjust path as needed
import { useRouter } from "next/navigation";
import ProductCard from "../components/ProductCard"; // Your ProductCard component
import PropertyCard from "../components/PropertyCard"; // Your PropertyCard component
import { FaEye, FaMousePointer, FaPercent } from "react-icons/fa";
import { useUser } from "../../../context/UserContext"; // provides current user

// Colors matching your Flutter design
const coralColor = "#FF7F50";
const jadeColor = "#00A86B";
const blueColor = "#0000FF";

export default function OngoingBoosts() {
  const [ongoingBoosts, setOngoingBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const uid = user?.uid;
  const router = useRouter();

  // Fetch ongoing boosts from products, properties, and cars
  useEffect(() => {
    if (!uid) return;
    const now = new Date();
    const fetchBoosts = async () => {
      try {
        const boostItems = [];

        // PRODUCTS query:
        // Query only products that belong to the current user and have boostStartTime set.
        const productsRef = collection(db, "products");
        const qProducts = query(
          productsRef,
          where("userId", "==", uid),
          where("boostStartTime", "!=", null)
        );
        const productSnapshot = await getDocs(qProducts);
        productSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.boostStartTime && data.boostEndTime) {
            const boostEnd = data.boostEndTime.toDate();
            // Only consider active boosts (boostEndTime is in the future)
            if (boostEnd.getTime() > now.getTime()) {
              boostItems.push({
                id: docSnap.id,
                itemType: "product",
                ...data,
              });
            }
          }
        });

        // PROPERTIES query:
        const propertiesRef = collection(db, "properties");
        const qProperties = query(
          propertiesRef,
          where("userId", "==", uid),
          where("boostStartTime", "!=", null)
        );
        const propertySnapshot = await getDocs(qProperties);
        propertySnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.boostStartTime && data.boostEndTime) {
            const boostEnd = data.boostEndTime.toDate();
            if (boostEnd.getTime() > now.getTime()) {
              boostItems.push({
                id: docSnap.id,
                itemType: "property",
                ...data,
              });
            }
          }
        });

        // CARS query:
        const carsRef = collection(db, "cars");
        const qCars = query(
          carsRef,
          where("userId", "==", uid),
          where("boostStartTime", "!=", null)
        );
        const carSnapshot = await getDocs(qCars);
        carSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.boostStartTime && data.boostEndTime) {
            const boostEnd = data.boostEndTime.toDate();
            if (boostEnd.getTime() > now.getTime()) {
              boostItems.push({
                id: docSnap.id,
                itemType: "car",
                ...data,
              });
            }
          }
        });

        // Optionally, sort boostItems by boostStartTime descending:
        boostItems.sort(
          (a, b) => b.boostStartTime.toDate() - a.boostStartTime.toDate()
        );

        setOngoingBoosts(boostItems);
      } catch (error) {
        console.error("Error fetching ongoing boosts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoosts();
  }, [uid]); // "now" is defined inside so no need to add it here.

  if (!uid) {
    return (
      <section className="p-4 border rounded-md shadow-sm bg-background">
        <h2 className="text-xl font-semibold mb-2">Ongoing Boosts</h2>
        <p>Please log in to view your ongoing boosts.</p>
      </section>
    );
  }

  if (!loading && ongoingBoosts.length === 0) {
    return (
      <section className="p-4 border rounded-md shadow-sm bg-background text-center">
        <img
          src="/assets/images/noboost.gif" // ensure this asset exists
          alt="No Active Boosts"
          className="mx-auto w-36 h-36 object-contain"
        />
        <p className="mt-4 text-base text-gray-500">
          You currently have no active boosts.
        </p>
        <button
          className="mt-4 w-48 bg-[#00A86B] text-white py-2 rounded-md"
          onClick={() => router.push("/my-products")}
        >
          Boost Your Products
        </button>
      </section>
    );
  }

  return (
    <section className="p-4 border rounded-md shadow-sm bg-background">
      <h2 className="text-xl font-semibold mb-2">Ongoing Boosts</h2>
      <div className="flex flex-col gap-4">
        {ongoingBoosts.map((item) => {
          if (item.itemType === "product") {
            return (
              <div key={item.id} className="py-2">
                <OngoingBoostProductCard boostedItem={item} />
              </div>
            );
          } else if (item.itemType === "property") {
            return (
              <div key={item.id} className="py-2">
                <OngoingBoostPropertyCard boostedItem={item} />
              </div>
            );
          } else if (item.itemType === "car") {
            return (
              <div key={item.id} className="py-2">
                <OngoingBoostCarCard boostedItem={item} />
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
    </section>
  );
}

// --- Ongoing Boost Product Card ---
function OngoingBoostProductCard({ boostedItem }) {
  const ongoingImpressions = Math.max(
    (boostedItem.boostedImpressionCount || 0) -
      (boostedItem.boostImpressionCountAtStart || 0),
    0
  );
  const ongoingClicks = Math.max(
    (boostedItem.clickCount || 0) - (boostedItem.boostClickCountAtStart || 0),
    0
  );
  const ongoingCTR =
    ongoingImpressions > 0
      ? ((ongoingClicks / ongoingImpressions) * 100).toFixed(2)
      : "0";

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        {boostedItem.product ? (
          <ProductCard
            product={boostedItem.product}
            scaleFactor={1.0}
            internalScaleFactor={0.8}
            portraitImageHeight={140}
          />
        ) : (
          <div className="h-36 bg-gray-300 flex items-center justify-center">
            <span>Image Unavailable</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <MetricRow
          icon={<FaEye size={17} color={coralColor} />}
          label={`Impressions: ${ongoingImpressions}`}
        />
        <MetricRow
          icon={<FaMousePointer size={17} color={jadeColor} />}
          label={`Clicks: ${ongoingClicks}`}
        />
        <MetricRow
          icon={<FaPercent size={17} color={blueColor} />}
          label={`CTR: ${ongoingCTR}%`}
        />
      </div>
    </div>
  );
}

// --- Ongoing Boost Property Card ---
function OngoingBoostPropertyCard({ boostedItem }) {
  const [propertyData, setPropertyData] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  useEffect(() => {
    const itemId = boostedItem.id;
    if (!itemId) {
      setLoadingProperty(false);
      return;
    }
    const fetchProperty = async () => {
      try {
        const propertyRef = doc(db, "properties", itemId);
        const docSnap = await getDoc(propertyRef);
        if (docSnap.exists()) {
          setPropertyData({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoadingProperty(false);
      }
    };
    fetchProperty();
  }, [boostedItem]);

  if (loadingProperty) {
    return (
      <div className="py-4 flex items-center justify-center">
        <span>Loading property...</span>
      </div>
    );
  }

  if (!propertyData) return null;

  const ongoingImpressions = Math.max(
    (boostedItem.boostedImpressionCount || 0) -
      (boostedItem.boostImpressionCountAtStart || 0),
    0
  );
  const ongoingClicks = Math.max(
    (boostedItem.clickCount || 0) - (boostedItem.boostClickCountAtStart || 0),
    0
  );
  const ongoingCTR =
    ongoingImpressions > 0
      ? ((ongoingClicks / ongoingImpressions) * 100).toFixed(2)
      : "0";

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <PropertyCard property={propertyData} />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <MetricRow
          icon={<FaEye size={17} color={coralColor} />}
          label={`Impressions: ${ongoingImpressions}`}
        />
        <MetricRow
          icon={<FaMousePointer size={17} color={jadeColor} />}
          label={`Clicks: ${ongoingClicks}`}
        />
        <MetricRow
          icon={<FaPercent size={17} color={blueColor} />}
          label={`CTR: ${ongoingCTR}%`}
        />
      </div>
    </div>
  );
}

// --- Ongoing Boost Car Card ---
function OngoingBoostCarCard({ boostedItem }) {
  const [carData, setCarData] = useState(null);
  const [loadingCar, setLoadingCar] = useState(true);

  useEffect(() => {
    const itemId = boostedItem.id;
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
  }, [boostedItem]);

  if (loadingCar) {
    return (
      <div className="py-4 flex items-center justify-center">
        <span>Loading car...</span>
      </div>
    );
  }

  if (!carData) return null;

  const ongoingImpressions = Math.max(
    (boostedItem.boostedImpressionCount || 0) -
      (boostedItem.boostImpressionCountAtStart || 0),
    0
  );
  const ongoingClicks = Math.max(
    (boostedItem.clickCount || 0) - (boostedItem.boostClickCountAtStart || 0),
    0
  );
  const ongoingCTR =
    ongoingImpressions > 0
      ? ((ongoingClicks / ongoingImpressions) * 100).toFixed(2)
      : "0";

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="border rounded-md shadow-sm overflow-hidden">
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
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <MetricRow
          icon={<FaEye size={17} color={coralColor} />}
          label={`Impressions: ${ongoingImpressions}`}
        />
        <MetricRow
          icon={<FaMousePointer size={17} color={jadeColor} />}
          label={`Clicks: ${ongoingClicks}`}
        />
        <MetricRow
          icon={<FaPercent size={17} color={blueColor} />}
          label={`CTR: ${ongoingCTR}%`}
        />
      </div>
    </div>
  );
}

// --- MetricRow Component ---
// Centers the metrics underneath each card and nudges the group slightly left.
function MetricRow({ icon, label }) {
  return (
    <div className="flex items-center justify-center text-sm text-gray-700 gap-1 -ml-1">
      <div className="flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
