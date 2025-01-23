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

  // Toggle logic for mobile icons
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
      {/* 
        MOBILE SECTION (< md):
        Hamburger - Bell - Mail - Ada Express - Favorites - Cart
      */}
      <div className="flex md:hidden w-full items-center justify-between px-2 py-2">
        {/* GROUP 1: Hamburger, Bell, Mail */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Icon (left) */}
          <button
            onClick={toggleSidebar}
            className="text-white text-2xl ml-[-8px]"
            aria-label="Toggle Sidebar"
          >
            <FaBars />
          </button>

          {/* Bell (Notifications) */}
          <button
            onClick={handleNotificationsClick}
            className={`text-xl ${
              showNotifications ? "text-[#00A86B]" : "text-white"
            }`}
            aria-label="Notifications"
          >
            <FaBell />
          </button>

          {/* Mail (Messages) */}
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

        {/* GROUP 2: "Ada Express" (center) */}
        <div className="flex-1 flex justify-center">
          <h1
            className="text-lg font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* GROUP 3: Favorites, Cart (right) */}
        <div className="flex items-center space-x-4">
          {/* Favorites Icon */}
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

          {/* Cart Icon */}
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

      {/* 
        DESKTOP SECTION (md+):
        Just "Ada Express" centered, Favorites + Cart on the right (more space)
      */}
      <div className="hidden md:flex items-center justify-center w-full px-4 py-2">
        {/* "Ada Express" in center */}
        <div className="flex-1 flex justify-center">
          <h1
            className="text-xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* Right group: Favorites + Cart (with extra space) */}
        <div className="flex items-center space-x-6">
          {/* Favorites icon */}
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

          {/* Cart icon */}
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

      {/* MOBILE Full-Width Windows for Notifications/Messages */}
      {showNotifications && (
        <div className="absolute top-[80px] left-0 right-0 bg-white text-black z-50 md:hidden">
          <NotificationsWindow
            userId={user?.uid}
            onClose={() => setShowNotifications(false)}
            isMobile
          />
        </div>
      )}
      {showMessages && (
        <div className="absolute top-[80px] left-0 right-0 bg-white text-black z-50 md:hidden">
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
