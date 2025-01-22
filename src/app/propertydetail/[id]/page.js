// src/app/(wherever)/PropertyDetailPage.js
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "../../../../lib/firebase";
// React Icons
import {
  FiArrowLeftCircle,
  FiArrowRightCircle,
  FiEye,
  FiShare2,
  FiHeart,
  FiMapPin,
  FiCheck,
  FiXCircle,
  FiMail,
  FiUser,
} from "react-icons/fi";
import { MdOutlineBed, MdOutlineShower } from "react-icons/md";
import { FaCar } from "react-icons/fa";
import { TbRulerMeasure } from "react-icons/tb";
import { CgSize } from "react-icons/cg";

function LoadingOverlay() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-lg animate-pulse">Loading property details...</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-red-500 text-xl">Property not found</p>
    </div>
  );
}

function FullScreenCarousel({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const showPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images?.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white hover:text-gray-300 transition"
      >
        <FiXCircle size={28} />
      </button>

      {images.length > 1 && (
        <button
          onClick={showPrev}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition"
        >
          <FiArrowLeftCircle size={34} />
        </button>
      )}
      <img
        src={images[currentIndex]}
        alt="fullscreen property"
        className="max-w-full max-h-full object-contain"
      />
      {images.length > 1 && (
        <button
          onClick={showNext}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition"
        >
          <FiArrowRightCircle size={34} />
        </button>
      )}
    </div>
  );
}

function HeroCarousel({ images = [], onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const showPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images.length) {
    return (
      <div className="bg-gray-300 w-full h-[50vh] flex items-center justify-center">
        <p className="text-gray-600">No images available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[75vh] overflow-hidden">
      <img
        src={images[currentIndex]}
        alt="property"
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => onImageClick(currentIndex)}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-white hover:text-gray-300 transition"
          >
            <FiArrowLeftCircle size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-white hover:text-gray-300 transition"
          >
            <FiArrowRightCircle size={28} />
          </button>
        </>
      )}
    </div>
  );
}

function MapModal({ isOpen, onClose, mapSrc }) {
  if (!isOpen || !mapSrc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background w-[95vw] max-w-3xl h-[80vh] relative rounded shadow-md overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-foreground hover:text-accent transition"
        >
          <FiXCircle size={24} />
        </button>
        <iframe
          title="map"
          src={mapSrc}
          width="100%"
          height="100%"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

/** SellerCard - removed the old ChatBox logic entirely */
function SellerCard({ sellerData, sellerId }) {
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
  }, []);

  if (!sellerData) {
    return (
      <div className="bg-card-background p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2 text-foreground">
          Seller Info
        </h2>
        <p className="text-sm text-gray-300">Unknown Seller</p>
      </div>
    );
  }

  const displayName = sellerData.displayName || "Unnamed";
  const profileImage = sellerData.profileImage || null;
  const createdAtTimestamp = sellerData.createdAt;
  let createdDateStr = "N/A";
  if (createdAtTimestamp?.toDate) {
    const d = createdAtTimestamp.toDate();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    createdDateStr = `${dd}/${mm}/${yy}`;
  }

  // Go to profile
  function goToProfile() {
    router.push(`/userprofile/${sellerId}`);
  }

  async function handleSendMail() {
    if (!currentUser) {
      alert("Please log in to message the seller.");
      return;
    }
    if (currentUser.uid === sellerId) {
      alert("You are the seller—no need to message yourself!");
      return;
    }

    try {
      // Build a deterministic chat ID from the two user IDs
      const sortedIds = [currentUser.uid, sellerId].sort();
      const chatId = sortedIds.join("_");

      // Check if doc exists
      const chatDocRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatDocRef);
      if (!snap.exists()) {
        // Create it
        await setDoc(chatDocRef, {
          participants: [currentUser.uid, sellerId],
          visibleTo: [currentUser.uid, sellerId],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastTimestamp: serverTimestamp(),
          unreadCounts: {
            [currentUser.uid]: 0,
            [sellerId]: 0,
          },
          lastReadTimestamps: {
            [currentUser.uid]: serverTimestamp(),
            [sellerId]: serverTimestamp(),
          },
        });
      }

      // Now dispatch event to open messages window with this chatId
      window.dispatchEvent(
        new CustomEvent("openMessagesWindow", {
          detail: { chatId },
        })
      );
    } catch (err) {
      console.error("Error creating chat doc:", err);
      alert("Error occurred while opening the chat.");
    }
  }

  return (
    <div className="bg-card-background p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        Seller Info
      </h2>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-500 flex-shrink-0">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Seller Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white">
              <FiUser size={30} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-gray-400 mt-1">
            Joined on: {createdDateStr}
          </p>
        </div>

        {/* Icons */}
        <div className="flex flex-col items-center gap-2">
          {/* Mail => open messages window */}
          <button
            onClick={handleSendMail}
            className="text-foreground hover:text-accent transition"
            title="Send message"
          >
            <FiMail size={22} />
          </button>
          {/* Profile => userprofile */}
          <button
            onClick={goToProfile}
            className="text-foreground hover:text-accent transition"
            title="View seller profile"
          >
            <FiUser size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showMap, setShowMap] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  const [sellerData, setSellerData] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const docRef = doc(db, "properties", id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setProperty(null);
          setLoading(false);
          return;
        }
        const pData = { id: snap.id, ...snap.data() };
        setFavoriteCount(pData.favorites ?? 0);
        setProperty(pData);

        // fetch seller
        if (pData.userId) {
          const sellerDoc = doc(db, "users", pData.userId);
          const sSnap = await getDoc(sellerDoc);
          setSellerData(sSnap.exists() ? sSnap.data() : null);
        }

        // check if user has this property in favorites
        if (currentUser && currentUser.uid) {
          const favRef = doc(
            db,
            "users",
            currentUser.uid,
            "favorites",
            pData.id
          );
          const favSnap = await getDoc(favRef);
          if (favSnap.exists()) {
            setIsFavorite(true);
          }
        }
      } catch (err) {
        console.error("Error fetching property or seller:", err);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAll();
  }, [id, currentUser]);

  if (loading) return <LoadingOverlay />;
  if (!property) return <NotFound />;

  const {
    price,
    currency,
    region,
    saleType,
    houseSize,
    landSize,
    bedrooms,
    bathrooms,
    garages,
    description,
    fileUrls = [],
    extras = {},
    createdAt,
    location,
    views,
    shares,
    userId: sellerId,
  } = property;

  let createdDate = null;
  if (createdAt?.toDate) {
    createdDate = createdAt.toDate().toLocaleString();
  }

  const lat = location?.latitude;
  const lng = location?.longitude;
  const mapSrc =
    lat && lng
      ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY}&q=${lat},${lng}&zoom=15`
      : null;

  const detailItems = [
    { label: "Sale Type", value: saleType },
    { label: "Region", value: region },
    houseSize && {
      label: "House Size",
      value: `${houseSize} m²`,
      icon: <TbRulerMeasure />,
    },
    landSize && {
      label: "Land Size",
      value: `${landSize} m²`,
      icon: <CgSize />,
    },
    bedrooms && {
      label: "Bedrooms",
      value: String(bedrooms),
      icon: <MdOutlineBed />,
    },
    bathrooms && {
      label: "Bathrooms",
      value: String(bathrooms),
      icon: <MdOutlineShower />,
    },
    garages && {
      label: "Garages",
      value: String(garages),
      icon: <FaCar />,
    },
  ].filter(Boolean);

  const extrasList = Object.entries(extras)
    .filter(([_, v]) => v === true)
    .map(([k]) => k);

  function openMap() {
    setShowMap(true);
  }
  function openFullScreenCarousel(index) {
    setFullScreenIndex(index);
    setShowFullScreen(true);
  }

  async function handleToggleFavorite() {
    if (!currentUser) {
      alert("Please log in to favorite this property.");
      return;
    }
    if (!property.id) return;

    try {
      const favDocRef = doc(
        db,
        "users",
        currentUser.uid,
        "favorites",
        property.id
      );
      const propDocRef = doc(db, "properties", property.id);

      const favSnap = await getDoc(favDocRef);
      if (favSnap.exists()) {
        await deleteDoc(favDocRef);
        setIsFavorite(false);
        setFavoriteCount((p) => (p > 0 ? p - 1 : 0));
        await updateDoc(propDocRef, { favorites: increment(-1) });
      } else {
        await setDoc(favDocRef, { propertyId: property.id });
        setIsFavorite(true);
        setFavoriteCount((p) => p + 1);
        await updateDoc(propDocRef, { favorites: increment(1) });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert("Error toggling favorite.");
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MapModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        mapSrc={mapSrc}
      />
      {showFullScreen && (
        <FullScreenCarousel
          images={fileUrls}
          initialIndex={fullScreenIndex}
          onClose={() => setShowFullScreen(false)}
        />
      )}

      <HeroCarousel images={fileUrls} onImageClick={openFullScreenCarousel} />

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-gray-700">
          <div>
            {createdDate && (
              <p className="text-xs text-gray-400 mb-1">
                Listed on: {createdDate}
              </p>
            )}
            <p className="text-3xl font-extrabold text-jade-green drop-shadow-sm">
              {price ? `${price} ${currency}` : "Price not specified"}
            </p>
          </div>
          <div className="flex flex-row items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-300">
              <FiEye />
              <span>{views ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-300">
              <FiShare2 />
              <span>{shares ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-300">
              <FiHeart />
              <span>{favoriteCount}</span>
            </div>

            {/* Share */}
            <button
              className="text-foreground hover:text-accent transition"
              onClick={() => alert("Share functionality not implemented.")}
              title="Share"
            >
              <FiShare2 size={20} />
            </button>
            {/* Favorite */}
            <button
              className="text-foreground hover:text-accent transition"
              onClick={handleToggleFavorite}
              title="Favorite"
            >
              <FiHeart
                size={20}
                className={isFavorite ? "fill-red-600 text-red-600" : ""}
              />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {description && (
              <div className="bg-card-background p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  Description
                </h2>
                <p className="leading-relaxed text-sm md:text-base">
                  {description}
                </p>
              </div>
            )}
            {extrasList.length > 0 && (
              <div className="bg-card-background p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  Extras & Amenities
                </h2>
                <div className="flex flex-wrap gap-3">
                  {extrasList.map((extra) => (
                    <div
                      key={extra}
                      className="flex items-center gap-2 bg-secondaryBackground px-3 py-1.5 rounded-full text-sm"
                    >
                      <FiCheck className="text-jade-green" />
                      <span className="capitalize">{extra}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <SellerCard sellerData={sellerData} sellerId={sellerId} />
            {mapSrc && (
              <div className="bg-card-background p-4 rounded shadow flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FiMapPin size={20} />
                  Location
                </h2>
                <p className="text-sm text-gray-300">
                  {region ? `Located in ${region}` : "Location not specified"}
                </p>
                <button
                  onClick={openMap}
                  className="text-foreground hover:text-accent flex items-center gap-1"
                >
                  <FiMapPin size={18} />
                  <span>View on Map</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card-background p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Property Details
              </h2>
              <ul className="space-y-3">
                {detailItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between border-b border-gray-800 pb-2 items-center"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium text-sm">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            {createdDate && (
              <div className="bg-card-background p-4 rounded shadow">
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Listing Date
                </h3>
                <p className="text-sm text-gray-300">{createdDate}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
