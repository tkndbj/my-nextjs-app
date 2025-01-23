// src/app/components/Header.js

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";
import { FiMail, FiMessageSquare } from "react-icons/fi";
import { FaHeart, FaShoppingCart, FaBars } from "react-icons/fa";

import FavoritesWindow from "./FavoritesWindow";
import CartWindow from "./CartWindow";
import { collection, getDocs } from "firebase/firestore";

// 1) Import the Sidebar context so we can toggle it from the hamburger
import { useSidebar } from "../../../context/SidebarContext";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // States for Favorites/Cart windows
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Counters
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // 2) Access the sidebar context
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      // If not logged in, reset counts
      setFavoritesCount(0);
      setCartCount(0);
      return;
    }

    const fetchCounts = async () => {
      try {
        // Fetch favorites count
        const favRef = collection(db, "users", user.uid, "favorites");
        const favSnap = await getDocs(favRef);
        setFavoritesCount(favSnap.size);

        // Fetch cart count
        const cartRef = collection(db, "users", user.uid, "cart");
        const cartSnap = await getDocs(cartRef);
        setCartCount(cartSnap.size);
      } catch (error) {
        console.error("Error fetching favorites/cart counts:", error);
      }
    };

    fetchCounts();
  }, [user]);

  return (
    <header className={styles.header}>
      <nav className={styles.navContainer}>
        {/* 
          MOBILE VIEW (< md):
          - Show hamburger + search input
          - Hide everything else 
        */}
        <div className="flex md:hidden w-full items-center justify-between">
          {/* Hamburger Icon */}
          <button
            onClick={toggleSidebar}
            className="bg-transparent text-white text-xl p-2"
          >
            <FaBars />
          </button>

          {/* Search Input */}
          <div className="flex-1 ml-2">
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* 
          DESKTOP VIEW (md+):
          - Show logo, full menu, search, etc.
          - Hide on mobile
        */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* Left: Logo */}
          <div className={styles.leftContainer}>
            <Link href="/" className={styles.logo}>
              E-CTS
            </Link>
          </div>

          {/* Middle: Search box */}
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

            {/* If user is logged in, show Favorites & Cart */}
            {user ? (
              <>
                {/* Favorites Icon */}
                <li className={styles.menuItem}>
                  <button
                    className={styles.linkButton}
                    title="Favorites"
                    onClick={() => setShowFavorites(!showFavorites)}
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

                {/* Cart Icon */}
                <li className={styles.menuItem}>
                  <button
                    className={styles.linkButton}
                    title="Cart"
                    onClick={() => setShowCart(!showCart)}
                  >
                    <FaShoppingCart />
                    {cartCount > 0 && (
                      <span className={styles.badge}>{cartCount}</span>
                    )}
                  </button>
                  {showCart && (
                    <CartWindow user={user} onClose={() => setShowCart(false)} />
                  )}
                </li>
              </>
            ) : (
              // If not logged in, show a Login link
              <li className={styles.menuItem}>
                <Link href="/login" className={styles.link}>
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}
