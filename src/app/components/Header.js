// src/app/components/Header.js

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";
import { FiMail, FiMessageSquare } from "react-icons/fi";
import {
  FaHeart,
  FaShoppingCart,
  FaBars,
  FaBell,
  FaEnvelope,
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Favorites & Cart windows
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Mobile Notifications & Messages
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

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

  // Toggle mobile notifications
  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications((prev) => !prev); // Toggle
    if (showMessages) setShowMessages(false); // Close other window
  };

  // Toggle mobile messages
  const handleMessagesClick = (e) => {
    e.stopPropagation();
    setShowMessages((prev) => !prev); // Toggle
    if (showNotifications) setShowNotifications(false);
  };

  return (
    // Make the header "relative" so we can position mobile windows absolute inside it
    <header className={`${styles.header} relative`}>
      <nav className={styles.navContainer}>
        {/* MOBILE VIEW (< md) */}
        <div className="flex md:hidden w-full items-center justify-between">
          {/* Left group: Hamburger, Bell, Mail */}
          <div className="flex items-center space-x-3">
            {/* Hamburger */}
            <button
              onClick={toggleSidebar}
              className="bg-transparent text-white text-2xl p-2 ml-[-4px]"
              aria-label="Toggle Sidebar"
            >
              <FaBars />
            </button>

            {/* Bell Icon (Notifications) - highlight jade if open */}
            {user && (
              <button
                onClick={handleNotificationsClick}
                className={`bg-transparent text-xl p-2 ${
                  showNotifications ? "text-[#00A86B]" : "text-white"
                }`}
                aria-label="Notifications"
              >
                <FaBell />
              </button>
            )}

            {/* Mail Icon (Messages) - highlight jade if open */}
            {user && (
              <button
                onClick={handleMessagesClick}
                className={`bg-transparent text-xl p-2 ${
                  showMessages ? "text-[#00A86B]" : "text-white"
                }`}
                aria-label="Messages"
              >
                <FaEnvelope />
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="ml-2 mr-2">
            <input
              type="text"
              placeholder="Search..."
              className={`${styles.searchInput} w-44`}
            />
          </div>

          {/* Favorites & Cart (or Login) */}
          <div className="flex items-center space-x-5 mr-1">
            {user ? (
              <>
                {/* Favorites Icon */}
                <button
                  className={`${styles.linkButton} text-xl`}
                  title="Favorites"
                  onClick={() => setShowFavorites((prev) => !prev)}
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
                  className={`${styles.linkButton} text-xl`}
                  title="Cart"
                  onClick={() => setShowCart((prev) => !prev)}
                >
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className={styles.badge}>{cartCount}</span>
                  )}
                </button>
                {showCart && (
                  <CartWindow user={user} onClose={() => setShowCart(false)} />
                )}
              </>
            ) : (
              <Link href="/login" className={styles.link}>
                Login
              </Link>
            )}
          </div>
        </div>

        {/* DESKTOP VIEW (md+) */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* Left: Logo */}
          <div className={styles.leftContainer}>
            <Link href="/" className={styles.logo}>
              E-CTS
            </Link>
          </div>

          {/* Middle: Full Search box */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>

          {/* Right side menu items */}
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              <Link href="/solutions" className={styles.link}>
                Solutions
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link href="/pricing" className={styles.link}>
                Pricing
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link href="/doc" className={styles.link}>
                Doc
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link href="/vlog" className={styles.link}>
                Vlog
              </Link>
            </li>

            {/* Support with dropdown */}
            <li
              className={styles.menuItem}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                className={styles.linkButton}
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                Support
              </button>
              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <Link href="/support/email" className={styles.dropdownItem}>
                    <FiMail className={styles.icon} />
                    Contact via email
                  </Link>
                  <Link href="/support/live" className={styles.dropdownItem}>
                    <FiMessageSquare className={styles.icon} />
                    Live support
                  </Link>
                </div>
              )}
            </li>

            {/* Favorites & Cart if logged in */}
            {user ? (
              <>
                <li className={styles.menuItem}>
                  <button
                    className={styles.linkButton}
                    title="Favorites"
                    onClick={() => setShowFavorites((prev) => !prev)}
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
                </li>

                <li className={styles.menuItem}>
                  <button
                    className={styles.linkButton}
                    title="Cart"
                    onClick={() => setShowCart((prev) => !prev)}
                  >
                    <FaShoppingCart />
                    {cartCount > 0 && (
                      <span className={styles.badge}>{cartCount}</span>
                    )}
                  </button>
                  {showCart && (
                    <CartWindow
                      user={user}
                      onClose={() => setShowCart(false)}
                    />
                  )}
                </li>
              </>
            ) : (
              <li className={styles.menuItem}>
                <Link href="/login" className={styles.link}>
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/** 
        MOBILE FULL-WIDTH WINDOWS
        We attach them "absolute" to the header, so top is exactly the bottom edge of nav.
        'relative' on header ensures these are anchored below.
      */}
      {user && showNotifications && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white text-black z-50">
          <NotificationsWindow
            userId={user.uid}
            onClose={() => setShowNotifications(false)}
            isMobile
          />
        </div>
      )}

      {user && showMessages && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white text-black z-50">
          <MessagesWindow
            userId={user.uid}
            onClose={() => setShowMessages(false)}
            isMobile
          />
        </div>
      )}
    </header>
  );
}
