"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDocsFromCache,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../../lib/firebase";

import ProductCard from "../../components/ProductCard";
import PropertyCard from "../../components/PropertyCard";
import { FaEnvelope, FaTimes } from "react-icons/fa";

/** JadeButton: example button */
function JadeButton({ text, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-jade-green hover:bg-jade-green/90 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
    >
      {icon && <span className="text-white">{icon}</span>}
      <span>{text}</span>
    </button>
  );
}

export default function UserProfilePage() {
  const { id } = useParams(); // userId from the URL
  const router = useRouter();

  // Auth
  const [currentUser, setCurrentUser] = useState(null);

  // Basic info
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Items
  const [userProperties, setUserProperties] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Tabs: "products" or "properties"
  const [activeTab, setActiveTab] = useState("products");

  // Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Fetch user data
  useEffect(() => {
    if (!id) return;

    async function fetchUserData() {
      try {
        setLoadingProfile(true);
        const userDocRef = doc(db, "users", id);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setUserData(null);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchUserData();
  }, [id]);

  // Fetch products & properties
  useEffect(() => {
    if (!id) return;

    async function fetchItems() {
      try {
        setLoadingItems(true);

        // 1) Properties
        const propQ = query(
          collection(db, "properties"),
          where("userId", "==", id)
        );
        const propSnap = await getDocs(propQ);
        const props = propSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // 2) Products
        const prodQ = query(
          collection(db, "products"),
          where("userId", "==", id)
        );
        const prodSnap = await getDocs(prodQ);
        const prods = prodSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setUserProperties(props);
        setUserProducts(prods);
      } catch (err) {
        console.error("Error fetching user items:", err);
      } finally {
        setLoadingItems(false);
      }
    }

    fetchItems();
  }, [id]);

  // Are we viewing our own profile?
  const isCurrentUser = currentUser && currentUser.uid === id;

  /**
   * "Send Message" -> opens the chat window with this user
   */
  async function handleSendMessage() {
    if (!currentUser) {
      alert("Please log in to message this user.");
      return;
    }
    if (isCurrentUser) {
      alert("You can't message yourself!");
      return;
    }

    try {
      // Build chatId from sorted [currentUser.uid, id]
      const sortedIds = [currentUser.uid, id].sort();
      const chatId = sortedIds.join("_");

      // Check or create doc
      const chatDocRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatDocRef);
      if (!snap.exists()) {
        // Create a new doc with all required fields
        await setDoc(chatDocRef, {
          participants: [currentUser.uid, id],
          visibleTo: [currentUser.uid, id],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastTimestamp: serverTimestamp(),
          unreadCounts: {
            [currentUser.uid]: 0,
            [id]: 0,
          },
          lastReadTimestamps: {
            [currentUser.uid]: serverTimestamp(),
            [id]: serverTimestamp(),
          },
        });
      }

      // Dispatch event so the Sidebar listens & opens chat
      window.dispatchEvent(
        new CustomEvent("openMessagesWindow", {
          detail: { chatId },
        })
      );
    } catch (err) {
      console.error("Error creating/finding chat:", err);
      alert("An error occurred while opening the chat.");
    }
  }

  // Navigation
  function handlePropertyClick(propertyId) {
    router.push(`/propertydetail/${propertyId}`);
  }
  function handleProductClick(productId) {
    router.push(`/products/${productId}`);
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-red-500">User not found</p>
      </div>
    );
  }

  const { displayName, profileImage } = userData;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* USER HEADER */}
        <div className="bg-card-background p-4 rounded-md shadow flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt="user avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white bg-gray-500">
                <span>No Image</span>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {displayName || "Unnamed User"}
            </h1>
          </div>

          {/* Send Message Button */}
          {!isCurrentUser && (
            <div className="w-full sm:w-auto">
              <JadeButton
                text="Send Message"
                icon={<FaEnvelope />}
                onClick={handleSendMessage}
              />
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex mt-6 border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-sm font-semibold
            ${
              activeTab === "products"
                ? "bg-jade-green text-white"
                : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
            }
          `}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("properties")}
            className={`px-4 py-2 text-sm font-semibold
            ${
              activeTab === "properties"
                ? "bg-jade-green text-white"
                : "bg-secondaryBackground text-foreground hover:bg-secondaryBackground/80"
            }
          `}
          >
            Properties
          </button>
        </div>

        {/* MAIN CONTENT - chosen tab */}
        <div className="mt-6">
          {loadingItems ? (
            <p className="text-gray-400">Loading items...</p>
          ) : activeTab === "products" ? (
            <>
              {userProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userProducts.map((product) => (
                    <div
                      key={product.id}
                      className="cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  This user has no products.
                </p>
              )}
            </>
          ) : (
            // PROPERTIES TAB
            <>
              {userProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userProperties.map((property) => (
                    <div
                      key={property.id}
                      className="cursor-pointer"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  This user has no properties.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
