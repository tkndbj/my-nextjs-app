// src/app/components/Header.js

"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

import { FaBars, FaBell, FaEnvelope, FaHeart, FaShoppingCart } from "react-icons/fa";

import FavoritesWindow from "./FavoritesWindow";
import CartWindow from "./CartWindow";
import NotificationsWindow from "./NotificationsWindow";
import MessagesWindow from "./MessagesWindow";
import { collection, getDocs } from "firebase/firestore";
import { useSidebar } from "../../../context/SidebarContext";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Show/hide windows
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Counters
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Sidebar context
  const { toggleSidebar } = useSidebar();

  // Track auth state
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

  // Toggling notifications
  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications((prev) => !prev);
    if (showMessages) setShowMessages(false);
  };

  // Toggling messages
  const handleMessagesClick = (e) => {
    e.stopPropagation();
    setShowMessages((prev) => !prev);
    if (showNotifications) setShowNotifications(false);
  };

  // Toggling favorites
  const handleFavoritesClick = (e) => {
    e.stopPropagation();
    setShowFavorites((prev) => !prev);
    if (showCart) setShowCart(false);
  };

  // Toggling cart
  const handleCartClick = (e) => {
    e.stopPropagation();
    setShowCart((prev) => !prev);
    if (showFavorites) setShowFavorites(false);
  };

  return (
    <header className={`${styles.header} relative`}>
      <nav className="max-w-full w-full px-3 py-2 flex items-center justify-between">
        {/* Left Group: Hamburger, Bell, Mail */}
        <div className="flex items-center space-x-3">
          {/* Hamburger Icon, pushed further left */}
          <button
            onClick={toggleSidebar}
            className="text-white text-2xl ml-[-10px]"
            aria-label="Toggle Sidebar"
          >
            <FaBars />
          </button>

          {/* Bell Icon (Notifications) */}
          <button
            onClick={handleNotificationsClick}
            className={`text-xl ${
              showNotifications ? "text-[#00A86B]" : "text-white"
            }`}
            aria-label="Notifications"
          >
            <FaBell />
          </button>

          {/* Mail Icon (Messages) */}
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

        {/* Center: "Ada Express" with gradient text */}
        <div className="flex-1 flex justify-center">
          <h1
            className="text-xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* Right Group: Favorites, Cart */}
        <div className="flex items-center space-x-3">
          {/* Favorites Icon */}
          <button
            onClick={handleFavoritesClick}
            className={`text-xl text-white relative`}
            title="Favorites"
          >
            <FaHeart />
            {favoritesCount > 0 && (
              <span className={styles.badge}>{favoritesCount}</span>
            )}
          </button>

          {showFavorites && (
            <FavoritesWindow
              user={user}
              onClose={() => setShowFavorites(false)}
            />
          )}

          {/* Cart Icon */}
          <button
            onClick={handleCartClick}
            className={`text-xl text-white relative`}
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
      </nav>

      {/** 
        Mobile Full-Width Windows (Notifications/Messages)
        Appear below the header (absolute) 
      */}
      {showNotifications && (
        <div className="absolute top-full left-0 right-0 bg-white text-black z-50 md:hidden">
          <NotificationsWindow
            userId={user?.uid}
            onClose={() => setShowNotifications(false)}
            isMobile
          />
        </div>
      )}
      {showMessages && (
        <div className="absolute top-full left-0 right-0 bg-white text-black z-50 md:hidden">
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
