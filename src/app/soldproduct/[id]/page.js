"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { FaArrowLeft, FaClipboard } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;

/**
 * SoldProductPage:
 * Displays details of a product the current user sold, including buyer info,
 * shipping address, phone, receipt #, embedded Google map for location, etc.
 * Allows toggling shipment status from "Pending" to "Shipped".
 *
 * Path: /soldproduct/[id]
 *   -> [id] is the transactionId from the user's "transactions" sub-collection.
 *
 * Firestore structure assumption:
 *  users/{sellerId}/transactions/{transactionId} => {... buyerId, productId, ...}
 *  products/{productId} => { ... imageUrls, productName, ... }
 */
export default function SoldProductPage() {
  const router = useRouter();
  const { id: transactionId } = useParams(); // transactionId
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // Authorization
  const [unauthorized, setUnauthorized] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingShipment, setIsUpdatingShipment] = useState(false);

  // Transaction & product data
  const [shipmentStatus, setShipmentStatus] = useState("Pending");
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerPhoneNumber, setBuyerPhoneNumber] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [location, setLocation] = useState(null); // { lat, lng }
  const [product, setProduct] = useState(null); // product doc data

  useEffect(() => {
    if (!userId) {
      setUnauthorized(true);
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // 1. Get transaction doc
        const txRef = doc(db, "users", userId, "transactions", transactionId);
        const txSnap = await getDoc(txRef);

        if (!txSnap.exists()) {
          console.error("Transaction not found.");
          setIsLoading(false);
          return;
        }

        const txData = txSnap.data();

        // Extract relevant fields
        const {
          buyerId,
          shipmentStatus: sStatus = "Pending",
          receiptId,
          addressLine1 = "",
          addressLine2 = "",
          city = "",
          country = "",
          phoneNumber = "",
          productId = "",
          location: geoPoint,
        } = txData;

        setShipmentStatus(sStatus);
        setReceiptNumber(receiptId || "");
        setBuyerPhoneNumber(phoneNumber);

        // Build address string
        const addressParts = [addressLine1, addressLine2, city, country].filter(
          (part) => part && part.trim() !== ""
        );
        setBuyerAddress(addressParts.join(", "));

        // Set location if present
        if (geoPoint) {
          setLocation({ lat: geoPoint.latitude, lng: geoPoint.longitude });
        }

        // 2. Fetch buyer's displayName
        if (buyerId) {
          const buyerRef = doc(db, "users", buyerId);
          const buyerSnap = await getDoc(buyerRef);
          if (buyerSnap.exists()) {
            const buyerData = buyerSnap.data();
            setBuyerName(buyerData.displayName || "Unknown Buyer");
          } else {
            setBuyerName("Unknown Buyer");
          }
        } else {
          setBuyerName("Unknown Buyer");
        }

        // 3. Fetch product doc => "products/{productId}"
        if (productId) {
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            setProduct({ id: productId, ...productSnap.data() });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, transactionId]);

  // Toggles shipment status between "Pending" and "Shipped"
  const handleToggleShipmentStatus = async () => {
    if (isUpdatingShipment) return;

    const newStatus = shipmentStatus === "Pending" ? "Shipped" : "Pending";
    setIsUpdatingShipment(true);

    try {
      // Update Firestore
      await updateDoc(doc(db, "users", userId, "transactions", transactionId), {
        shipmentStatus: newStatus,
        updatedAt: serverTimestamp(),
      });
      setShipmentStatus(newStatus);
    } catch (error) {
      console.error("Error updating shipment status:", error);
      alert("Failed to update shipment status. Please try again.");
    } finally {
      setIsUpdatingShipment(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6">
          <p>You are not authorized to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <div className="flex-1 max-w-4xl mx-auto px-4 py-6">
        {/* Top Navigation / Back */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-foreground hover:text-blue-500 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* PRODUCT DETAILS */}
            <div className="bg-secondaryBackground p-4 rounded-xl border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">
                Sold Product Details
              </h2>

              {product ? (
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Product Image */}
                  <div className="relative w-full md:w-1/2 h-64">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.productName || "Sold Product"}
                        fill
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {product.productName || "Unnamed Product"}
                    </h3>
                    {product.averageRating !== undefined && (
                      <p className="text-sm text-gray-600">
                        Rating: {product.averageRating.toFixed(1)}
                      </p>
                    )}
                    {product.price && (
                      <p className="mt-2 text-lg font-semibold text-blue-600">
                        {product.price} {product.currency || "TRY"}
                      </p>
                    )}
                    {product.description && (
                      <p className="mt-2 text-sm text-foreground/80">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No product info.</p>
              )}
            </div>

            {/* BUYER DETAILS */}
            <div className="bg-secondaryBackground p-4 rounded-xl border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">Buyer Details</h2>
              <div className="flex flex-col gap-3">
                {/* Buyer Name */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{buyerName}</span>
                </div>

                {/* Buyer Address */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-right">{buyerAddress || "N/A"}</span>
                    {buyerAddress && (
                      <button
                        onClick={() => copyToClipboard(buyerAddress)}
                        className="text-gray-500 hover:text-blue-500 transition"
                      >
                        <FaClipboard size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Buyer Phone */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Phone:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-right">
                      {buyerPhoneNumber || "N/A"}
                    </span>
                    {buyerPhoneNumber && (
                      <button
                        onClick={() => copyToClipboard(buyerPhoneNumber)}
                        className="text-gray-500 hover:text-blue-500 transition"
                      >
                        <FaClipboard size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Receipt Number */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Receipt #:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-right">{receiptNumber || "N/A"}</span>
                    {receiptNumber && (
                      <button
                        onClick={() => copyToClipboard(receiptNumber)}
                        className="text-gray-500 hover:text-blue-500 transition"
                      >
                        <FaClipboard size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* LOCATION (Embedded Map) */}
            {location && GOOGLE_MAPS_API_KEY && (
              <div className="bg-secondaryBackground p-4 rounded-xl border border-gray-300">
                <h2 className="text-xl font-semibold mb-4">
                  Delivery Location
                </h2>
                <div className="w-full h-72 md:h-96 rounded-lg overflow-hidden">
                  <iframe
                    title="Google Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${location.lat},${location.lng}&zoom=14`}
                  />
                </div>
              </div>
            )}

            {/* SHIPMENT STATUS */}
            <div className="bg-secondaryBackground p-4 rounded-xl border border-gray-300">
              <h2 className="text-xl font-semibold mb-4">Shipment Status</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current status:</p>
                  <p className="text-lg font-semibold">{shipmentStatus}</p>
                </div>

                <button
                  onClick={handleToggleShipmentStatus}
                  disabled={isUpdatingShipment}
                  className={`px-4 py-2 rounded text-white ${
                    shipmentStatus === "Pending"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  } transition`}
                >
                  {isUpdatingShipment ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : shipmentStatus === "Pending" ? (
                    "Mark as Shipped"
                  ) : (
                    "Mark as Pending"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
