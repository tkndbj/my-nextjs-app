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

  useEffect(() => {
    function handleOpenMessages(e) {
      const { chatId } = e.detail;
      setPreselectedChatId(chatId);
      setShowNotifications(false);
      setShowMessages(true);
    }
    window.addEventListener("openMessagesWindow", handleOpenMessages);
    return () => {
      window.removeEventListener("openMessagesWindow", handleOpenMessages);
    };
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications((prev) => !prev);
    if (showMessages) setShowMessages(false);
  };

  const handleMessagesClick = (e) => {
    e.stopPropagation();
    setShowMessages((prev) => !prev);
    if (showNotifications) setShowNotifications(false);
    if (showMessages) setPreselectedChatId(null);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleCloseMessages = () => {
    setShowMessages(false);
    setPreselectedChatId(null);
  };

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

  const handleMyproductsClick = () => {
    if (userId) {
      router.push(`/myproducts/${userId}`);
    } else {
      router.push("/login");
    }
  };

  const handleProfileClick = () => {
    if (userId) {
      router.push(`/profile/${userId}`);
    } else {
      router.push("/login");
    }
  };

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
          <div className={styles.topSection}>
            <button
              onClick={toggleSidebar}
              className={styles.hamburger}
              aria-label="Toggle Sidebar"
            >
              <FaBars />
            </button>
          </div>

          <div className={styles.menu}>
            <div
              className={styles.menuItem}
              onClick={handleNavClick(() => router.push("/"))}
            >
              <div className={styles.icon}>
                <FaHome />
              </div>
              <span className={styles.text}>Home</span>
            </div>

            <div
              className={styles.menuItem}
              onClick={handleNavClick(() => router.push("/properties"))}
            >
              <div className={styles.icon}>
                <FaBuilding />
              </div>
              <span className={styles.text}>Properties</span>
            </div>

            <div
              className={styles.menuItem}
              onClick={handleNavClick(handleMyproductsClick)}
            >
              <div className={styles.icon}>
                <FaBoxOpen />
              </div>
              <span className={styles.text}>My Products</span>
            </div>

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
                  <MessagesWindow
                    userId={userId}
                    onClose={handleCloseMessages}
                    preselectedChatId={preselectedChatId}
                  />
                </div>
              )}
            </div>

            <div
              className={styles.menuItem}
              onClick={handleNavClick(() => router.push("/ads"))}
            >
              <div className={styles.icon}>
                <FaAd />
              </div>
              <span className={styles.text}>My Ads</span>
            </div>

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

          <div className={styles.bottomSection}>
            <div className={styles.menuItem} onClick={handleAuthAction}>
              <div className={styles.icon}>
                {userId ? <FaSignOutAlt /> : <FaSignInAlt />}
              </div>
              <span className={styles.text}>
                {userId ? "Logout" : "Login"}
              </span>
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
