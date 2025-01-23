// src/app/components/Header.js

"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

import {
  FaBars,
  FaBell,
  FaEnvelope,
  FaHeart,
  FaShoppingCart,
} from "react-icons/fa";

import FavoritesWindow from "./FavoritesWindow";
import CartWindow from "./CartWindow";
import NotificationsWindow from "./NotificationsWindow";
import MessagesWindow from "./MessagesWindow";
import { collection, getDocs } from "firebase/firestore";
import { useSidebar } from "../../../context/SidebarContext";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // States for toggling windows
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Counters
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Sidebar context
  const { toggleSidebar } = useSidebar();

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch favorites/cart counts
  useEffect(() => {
    if (!user) {
      setFavoritesCount(0);
      setCartCount(0);
      return;
    }
    const fetchCounts = async () => {
      try {
        const favRef = collection(db, "users", user.uid, "favorites");
        const favSnap = await getDocs(favRef);
        setFavoritesCount(favSnap.size);

        const cartRef = collection(db, "users", user.uid, "cart");
        const cartSnap = await getDocs(cartRef);
        setCartCount(cartSnap.size);
      } catch (error) {
        console.error("Error fetching favorites/cart counts:", error);
      }
    };
    fetchCounts();
  }, [user]);

  // Toggle handlers
  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications((prev) => !prev);
    if (showMessages) setShowMessages(false);
  };
  const handleMessagesClick = (e) => {
    e.stopPropagation();
    setShowMessages((prev) => !prev);
    if (showNotifications) setShowNotifications(false);
  };
  const handleFavoritesClick = (e) => {
    e.stopPropagation();
    setShowFavorites((prev) => !prev);
    if (showCart) setShowCart(false);
  };
  const handleCartClick = (e) => {
    e.stopPropagation();
    setShowCart((prev) => !prev);
    if (showFavorites) setShowFavorites(false);
  };

  return (
    <header className={`${styles.header} relative`}>
      {/* MOBILE SECTION (< md) */}
      <div className="flex md:hidden items-center w-full py-2 px-2">
        {/* LEFT GROUP: Hamburger, Bell, Mail */}
        <div className="flex items-center space-x-5">
          <button
            onClick={toggleSidebar}
            className="text-white text-2xl"
            aria-label="Toggle Sidebar"
          >
            <FaBars />
          </button>

          <button
            onClick={handleNotificationsClick}
            className={`text-xl ${
              showNotifications ? "text-[#00A86B]" : "text-white"
            }`}
            aria-label="Notifications"
          >
            <FaBell />
          </button>

          <button
            onClick={handleMessagesClick}
            className={`text-xl ${
              showMessages ? "text-[#00A86B]" : "text-white"
            }`}
            aria-label="Messages"
          >
            <FaEnvelope />
          </button>
        </div>

        {/* CENTER: Ada Express (no extra negative margin) */}
        <div className="flex-1 flex justify-center">
          <h1
            className="text-lg font-bold bg-clip-text text-transparent
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* RIGHT GROUP: Favorites, Cart (slightly more left so not off-screen) */}
        <div className="flex items-center space-x-5 mr-2">
          <button
            onClick={handleFavoritesClick}
            className="text-xl text-white relative"
            title="Favorites"
          >
            <FaHeart />
            {favoritesCount > 0 && (
              <span className={styles.badge}>{favoritesCount}</span>
            )}
          </button>
          {showFavorites && (
            <FavoritesWindow user={user} onClose={() => setShowFavorites(false)} />
          )}

          <button
            onClick={handleCartClick}
            className="text-xl text-white relative"
            title="Cart"
          >
            <FaShoppingCart />
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
          </button>
          {showCart && (
            <CartWindow user={user} onClose={() => setShowCart(false)} />
          )}
        </div>
      </div>

      {/* DESKTOP SECTION (md+) */}
      <div className="hidden md:flex items-center w-full py-2 px-4 relative">
        {/* Approach: use 3 sections for perfect centering */}

        {/* LEFT spacer (could remain empty) */}
        <div className="flex-1"></div>

        {/* CENTER: Ada Express (exact center horizontally) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1
            className="text-xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* RIGHT: Favorites + Cart with some spacing */}
        <div className="ml-auto flex items-center space-x-8">
          <button
            onClick={handleFavoritesClick}
            className="text-xl text-white relative"
            title="Favorites"
          >
            <FaHeart />
            {favoritesCount > 0 && (
              <span className={styles.badge}>{favoritesCount}</span>
            )}
          </button>
          {showFavorites && (
            <FavoritesWindow user={user} onClose={() => setShowFavorites(false)} />
          )}

          <button
            onClick={handleCartClick}
            className="text-xl text-white relative"
            title="Cart"
          >
            <FaShoppingCart />
            {cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
          </button>
          {showCart && (
            <CartWindow user={user} onClose={() => setShowCart(false)} />
          )}
        </div>
      </div>

      {/* MOBILE: Full-Width Windows (attached via top-full) */}
      {showNotifications && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white text-black z-50">
          <NotificationsWindow
            userId={user?.uid}
            onClose={() => setShowNotifications(false)}
            isMobile
          />
        </div>
      )}
      {showMessages && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white text-black z-50">
          <MessagesWindow
            userId={user?.uid}
            onClose={() => setShowMessages(false)}
            isMobile
          />
        </div>
      )}
    </header>
  );
}
