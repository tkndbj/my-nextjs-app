// src/app/components/Header.js

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../../lib/firebase"; // Ensure 'db' is exported from your firebase config
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";
import { FiMail, FiMessageSquare } from "react-icons/fi";
import { FaHeart, FaShoppingCart } from "react-icons/fa";

// Import the two windows:
import FavoritesWindow from "./FavoritesWindow";
import CartWindow from "./CartWindow";

// Import Firestore functions
import { collection, getDocs } from "firebase/firestore";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State to show/hide windows
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // State for counters
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

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

    // If logged in, fetch counts
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

          {/* If user is logged in, show Favorites & Cart & Logout */}
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
      </nav>
    </header>
  );
}
