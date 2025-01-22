// src/app/components/Sidebar.js

"use client";

import React, { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import {
  FaBars,
  FaBuilding,
  FaBoxOpen,
  FaBell,
  FaEnvelope,
  FaAd,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaSun,
  FaMoon,
  FaHome,
} from "react-icons/fa";
import { useSidebar } from "../../../context/SidebarContext";
import NotificationsWindow from "./NotificationsWindow";
import MessagesWindow from "./MessagesWindow";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [userId, setUserId] = useState(null);

  // NEW: We'll store a chatId that we want to show immediately when the messages window pops
  const [preselectedChatId, setPreselectedChatId] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const excludedPaths = ["/login", "/subscription"];
  const isExcludedPath = excludedPaths.some(
    (path) => path === pathname || pathname.startsWith(`${path}/`)
  );

  // Listen for a custom event: "openMessagesWindow"
  // detail: { chatId: "abc123" }
  useEffect(() => {
    function handleOpenMessages(e) {
      // e.detail = { chatId, sellerId, etc. }
      const { chatId } = e.detail;
      setPreselectedChatId(chatId);
      setShowNotifications(false); // close notifications if open
      setShowMessages(true); // open the messages window
    }

    window.addEventListener("openMessagesWindow", handleOpenMessages);
    return () => {
      window.removeEventListener("openMessagesWindow", handleOpenMessages);
    };
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  // Toggle notifications window
  const handleNotificationsClick = (e) => {
    e.stopPropagation(); // Prevent parent clicks
    setShowNotifications((prev) => !prev);
    if (showMessages) setShowMessages(false);
  };

  // Toggle messages window
  const handleMessagesClick = (e) => {
    e.stopPropagation(); // Prevent parent clicks
    setShowMessages((prev) => !prev);
    if (showNotifications) setShowNotifications(false);
    // If we're closing, also reset preselectedChatId
    // so next time it starts fresh
    if (showMessages) setPreselectedChatId(null);
  };

  // Close notifications
  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  // Close messages
  const handleCloseMessages = () => {
    setShowMessages(false);
    setPreselectedChatId(null);
  };

  // Auth action
  const handleAuthAction = async () => {
    if (userId) {
      try {
        await signOut(auth);
        router.push("/login");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      router.push("/login");
    }
  };

  // My Products
  const handleMyproductsClick = () => {
    if (userId) {
      router.push(`/myproducts/${userId}`);
    } else {
      router.push("/login");
    }
  };

  // Profile
  const handleProfileClick = () => {
    if (userId) {
      router.push(`/profile/${userId}`);
    } else {
      router.push("/login");
    }
  };

  // Navigation
  const handleNavClick = (navFunc) => (e) => {
    e.stopPropagation();
    navFunc();
  };

  return (
    <>
      {!isExcludedPath && (
        <div
          className={`${styles.sidebar} ${
            isCollapsed ? styles.collapsed : styles.expanded
          } ${isDarkMode ? styles.dark : styles.light}`}
        >
          {/* Top section (hamburger button) */}
          <div className={styles.topSection}>
            <button
              onClick={toggleSidebar}
              className={styles.hamburger}
              aria-label="Toggle Sidebar"
            >
              <FaBars />
            </button>
          </div>

          {/* Menu items */}
          <div className={styles.menu}>
            {/* Home */}
            <div
              className={styles.menuItem}
              onClick={handleNavClick(() => router.push("/"))}
            >
              <div className={styles.icon}>
                <FaHome />
              </div>
              <span className={styles.text}>Home</span>
            </div>

            {/* Properties */}
            <div
              className={styles.menuItem}
              onClick={handleNavClick(() => router.push("/properties"))}
            >
              <div className={styles.icon}>
                <FaBuilding />
              </div>
              <span className={styles.text}>Properties</span>
            </div>

            {/* My Products */}
            <div
              className={styles.menuItem}
              onClick={handleNavClick(handleMyproductsClick)}
            >
              <div className={styles.icon}>
                <FaBoxOpen />
              </div>
              <span className={styles.text}>My Products</span>
            </div>

            {/* Notifications */}
            <div
              className={`${styles.menuItem} ${
                showNotifications ? styles.active : ""
              }`}
              onClick={handleNotificationsClick}
            >
              <div className={styles.icon}>
                <FaBell />
              </div>
              <span className={styles.text}>Notifications</span>

              {showNotifications && userId && (
                <div
                  className={styles.popupContainer}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NotificationsWindow
                    userId={userId}
                    onClose={handleCloseNotifications}
                  />
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              className={`${styles.menuItem} ${
                showMessages ? styles.active : ""
              }`}
              onClick={handleMessagesClick}
            >
              <div className={styles.icon}>
                <FaEnvelope />
              </div>
              <span className={styles.text}>Messages</span>

              {showMessages && userId && (
                <div
                  className={styles.popupContainer}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pass preselectedChatId to auto-open that chat */}
                  <MessagesWindow
                    userId={userId}
                    onClose={handleCloseMessages}
                    preselectedChatId={preselectedChatId}
                  />
                </div>
              )}
            </div>

            {/* My Ads */}
            <div
              className={styles.menuItem}
              onClick={handleNavClick(() => router.push("/ads"))}
            >
              <div className={styles.icon}>
                <FaAd />
              </div>
              <span className={styles.text}>My Ads</span>
            </div>

            {/* Profile */}
            <div
              className={styles.menuItem}
              onClick={handleNavClick(handleProfileClick)}
            >
              <div className={styles.icon}>
                <FaUser />
              </div>
              <span className={styles.text}>Profile</span>
            </div>
          </div>

          {/* Bottom section (login/logout, dark mode) */}
          <div className={styles.bottomSection}>
            <div className={styles.menuItem} onClick={handleAuthAction}>
              <div className={styles.icon}>
                {userId ? <FaSignOutAlt /> : <FaSignInAlt />}
              </div>
              <span className={styles.text}>{userId ? "Logout" : "Login"}</span>
            </div>

            <div className={styles.menuItem} onClick={toggleDarkMode}>
              <div className={styles.icon}>
                {isDarkMode ? <FaSun /> : <FaMoon />}
              </div>
              <span className={styles.text}>
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
