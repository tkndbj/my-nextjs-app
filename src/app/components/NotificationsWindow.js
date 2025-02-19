// src/app/components/NotificationsWindow.js

"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./NotificationsWindow.module.css";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const NotificationsWindow = ({ userId, onClose, isMobile = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const windowRef = useRef();

  useEffect(() => {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Only apply outside-click for desktop usage
  useEffect(() => {
    if (isMobile) return; // Skip outside-click on mobile

    function handleClickOutside(event) {
      if (windowRef.current && !windowRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, isMobile]);

  const content = (
    <div
      className={`${styles.notificationsWindow} ${
        isMobile ? "w-full static" : ""
      }`}
      ref={windowRef}
    >
      <h3 className={styles.title}>Notifications</h3>
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <ul className={styles.notificationList}>
          {notifications.length === 0 ? (
            <li className={styles.empty}>No notifications.</li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id} className={styles.notificationItem}>
                <p className={styles.message}>{notification.message}</p>
                <span className={styles.timestamp}>
                  {new Date(notification.timestamp?.toDate()).toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );

  // If NOT mobile, use the .overlay for PC
  if (!isMobile) {
    return <div className={styles.overlay}>{content}</div>;
  }

  // If mobile, return just the window (no overlay)
  return content;
};

export default NotificationsWindow;
