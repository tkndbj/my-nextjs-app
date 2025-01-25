// src/app/components/Header.js

"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

import {
  HiMenu, // Replaces TbMenu
  HiBell, // Replaces TbBell
  HiMail, // Replaces TbMail
  HiHeart, // Replaces TbHeart
  HiShoppingCart, // Replaces TbShoppingCart
} from "react-icons/hi";

import FavoritesWindow from "./FavoritesWindow";
import CartWindow from "./CartWindow";
import NotificationsWindow from "./NotificationsWindow";
import MessagesWindow from "./MessagesWindow";
import { collection, onSnapshot, doc } from "firebase/firestore";
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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Sidebar context
  const { toggleSidebar } = useSidebar();

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch and listen to favorites and cart counts
  useEffect(() => {
    let favoritesUnsubscribe;
    let cartUnsubscribe;

    if (user) {
      const favRef = collection(db, "users", user.uid, "favorites");
      favoritesUnsubscribe = onSnapshot(
        favRef,
        (favSnap) => {
          setFavoritesCount(favSnap.size);
        },
        (error) => {
          console.error("Error listening to favorites:", error);
        }
      );

      const cartRef = collection(db, "users", user.uid, "cart");
      cartUnsubscribe = onSnapshot(
        cartRef,
        (cartSnap) => {
          setCartCount(cartSnap.size);
        },
        (error) => {
          console.error("Error listening to cart:", error);
        }
      );
    } else {
      setFavoritesCount(0);
      setCartCount(0);
    }

    return () => {
      if (favoritesUnsubscribe) favoritesUnsubscribe();
      if (cartUnsubscribe) cartUnsubscribe();
    };
  }, [user]);

  // Listen to unread notifications and messages counts
  useEffect(() => {
    let userDocUnsubscribe;

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      userDocUnsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUnreadNotificationsCount(data.unreadNotifications || 0);
            setUnreadMessagesCount(data.unreadMessages || 0);
          } else {
            setUnreadNotificationsCount(0);
            setUnreadMessagesCount(0);
          }
        },
        (error) => {
          console.error("Error listening to user document:", error);
        }
      );
    } else {
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
    }

    return () => {
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
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
    <header className={styles.header}>
      {/* MOBILE SECTION (< md) */}
      <div
        className={`flex md:hidden items-center w-full py-2 px-2 ${styles.mobileSection}`}
      >
        {/* LEFT GROUP: Hamburger, Bell, Mail */}
        <div className="flex items-center space-x-5">
          <button
            onClick={toggleSidebar}
            className="text-2xl" // Removed 'text-white'
            aria-label="Toggle Sidebar"
          >
            <HiMenu className={styles.iconWithBorder} />
          </button>

          <button
            onClick={handleNotificationsClick}
            className="relative text-xl" // Added 'relative' for badge positioning
            aria-label="Notifications"
          >
            <HiBell className={styles.iconWithBorder} />
            {unreadNotificationsCount > 0 && (
              <span className={styles.badge}>{unreadNotificationsCount}</span>
            )}
          </button>

          <button
            onClick={handleMessagesClick}
            className="relative text-xl" // Added 'relative' for badge positioning
            aria-label="Messages"
          >
            <HiMail className={styles.iconWithBorder} />
            {unreadMessagesCount > 0 && (
              <span className={styles.badge}>{unreadMessagesCount}</span>
            )}
          </button>
        </div>

        {/* CENTER: Ada Express */}
        <div className="flex-1 flex justify-center">
          <h1
            className="text-lg font-bold bg-clip-text text-transparent
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* RIGHT GROUP: Favorites, Cart */}
        <div className="flex items-center space-x-5 mr-2">
          <button
            onClick={handleFavoritesClick}
            className="relative" // Removed 'text-xl text-white'
            title="Favorites"
          >
            <HiHeart className={styles.iconWithBorder} />
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

          <button
            onClick={handleCartClick}
            className="relative" // Removed 'text-xl text-white'
            title="Cart"
          >
            <HiShoppingCart className={styles.iconWithBorder} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </button>
          {showCart && (
            <CartWindow user={user} onClose={() => setShowCart(false)} />
          )}
        </div>
      </div>

      {/* DESKTOP SECTION (md+) */}
      <div className="hidden md:flex items-center w-full py-2 px-4 relative">
        {/* LEFT spacer (could remain empty) */}
        <div className="flex-1"></div>

        {/* CENTER: Ada Express */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1
            className="text-xl font-bold bg-clip-text text-transparent 
                       bg-gradient-to-r from-red-500 to-orange-500"
          >
            Ada Express
          </h1>
        </div>

        {/* RIGHT: Favorites + Cart */}
        <div className="ml-auto flex items-center space-x-8">
          <button
            onClick={handleFavoritesClick}
            className="relative" // Removed 'text-xl text-white'
            title="Favorites"
          >
            <HiHeart className={styles.iconWithBorder} />
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

          <button
            onClick={handleCartClick}
            className="relative" // Removed 'text-xl text-white'
            title="Cart"
          >
            <HiShoppingCart className={styles.iconWithBorder} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
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
