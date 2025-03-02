// src/app/components/NotificationsWindow.js

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./NotificationsWindow.module.css";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import { FaTrashAlt } from "react-icons/fa";

const NotificationsWindow = ({ userId, onClose, isMobile = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const windowRef = useRef(null);
  const loaderRef = useRef(null);
  const router = useRouter();
  const limitCount = 20;

  // Load notifications with pagination
  const loadNotifications = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const notificationsRef = collection(db, "users", userId, "notifications");
      let q = query(
        notificationsRef,
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      if (lastDoc) {
        q = query(
          notificationsRef,
          orderBy("timestamp", "desc"),
          startAfter(lastDoc),
          limit(limitCount)
        );
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        const newLastDoc = docs[docs.length - 1];
        setLastDoc(newLastDoc);
        // Filter out notifications of type "message"
        const fetched = docs
          .filter((docSnap) => {
            const data = docSnap.data();
            return data.type !== "message";
          })
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        // Deduplicate: Append only new notifications not already in state
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newNotifs = fetched.filter(
            (notif) => !existingIds.has(notif.id)
          );
          return [...prev, ...newNotifs];
        });
        // Mark fetched (non‑message) notifications as read
        await markNotificationsAsRead(fetched);
        if (docs.length < limitCount) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
    setLoading(false);
  }, [userId, lastDoc, loading, hasMore]);

  // Mark notifications as read using a batch update
  const markNotificationsAsRead = async (notifs) => {
    const batch = writeBatch(db);
    notifs.forEach((notif) => {
      if (notif.isRead === false) {
        const notifRef = doc(db, "users", userId, "notifications", notif.id);
        batch.update(notifRef, { isRead: true });
      }
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Delete a notification after confirmation
  const handleDelete = async (notifId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this notification?"
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "users", userId, "notifications", notifId));
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Error deleting notification.");
    }
  };

  // Handle navigation based on notification type
  const handleNotificationClick = (notification) => {
    const type = notification.type || "general";
    switch (type) {
      case "invitation":
        if (notification.companyId) {
          router.push(
            `/company/${notification.companyId}?invitation=true&notificationId=${notification.id}`
          );
        } else {
          alert("Company info not found.");
        }
        break;
      case "boosted":
      case "boost_expired":
        if (notification.itemType === "property" && notification.propertyId) {
          router.push(`/boost/property/${notification.propertyId}`);
        } else if (
          notification.itemType === "product" &&
          notification.productId
        ) {
          router.push(`/boost/product/${notification.productId}`);
        } else if (notification.itemType === "car" && notification.carId) {
          router.push(`/boost/car/${notification.carId}`);
        } else {
          alert("Item info not found.");
        }
        break;
      case "rent_invitation":
        if (notification.propertyId) {
          router.push(`/rental/${notification.propertyId}?tab=pay_rent`);
        } else {
          alert("Property info not found.");
        }
        break;
      case "product_review":
        if (notification.productId) {
          router.push(`/product/${notification.productId}?review=true`);
        } else {
          alert("Product info not found.");
        }
        break;
      case "shipment":
        if (notification.productId && notification.transactionId) {
          router.push(
            `/shipment/${notification.productId}/${notification.transactionId}`
          );
        } else {
          alert("Product info not found.");
        }
        break;
      case "shop_approved":
        if (notification.shopId) {
          router.push(`/shop/${notification.shopId}`);
        } else {
          alert("Shop info not found.");
        }
        break;
      case "shop_disapproved":
        alert(notification.message || "Shop disapproved.");
        break;
      case "message":
        if (notification.senderId) {
          router.push(`/chat?recipientId=${notification.senderId}`);
        } else {
          alert("Chat info not found.");
        }
        break;
      case "product_sold":
        if (notification.productId && notification.transactionId) {
          router.push(
            `/sold/${notification.productId}/${notification.transactionId}`
          );
        } else {
          alert("Product info not found.");
        }
        break;
      case "seller_review":
        if (notification.sellerId) {
          router.push(`/seller/${notification.sellerId}/review`);
        } else {
          alert("Seller info not found.");
        }
        break;
      case "product_out_of_stock":
        if (notification.productId) {
          router.push(`/product/${notification.productId}`);
        } else {
          alert("Product info not found.");
        }
        break;
      default:
        // For general notifications, no navigation is defined.
        break;
    }
    onClose(); // Close the window after navigation.
  };

  // Use IntersectionObserver for infinite scroll with a lower threshold
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadNotifications();
        }
      },
      {
        root: windowRef.current,
        threshold: 0.1, // Trigger when 10% of the loader is visible
      }
    );
    observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loaderRef, loadNotifications, loading, hasMore]);

  // Outside-click handler for desktop usage
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (event) => {
      if (windowRef.current && !windowRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, isMobile]);

  // Initial load on mount (only if notifications are empty)
  useEffect(() => {
    if (userId && notifications.length === 0) {
      loadNotifications();
    }
  }, [userId, loadNotifications, notifications.length]);

  // Helper to format timestamp (dd/mm/yyyy hh:mm)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  return (
    <div
      className={`${styles.notificationsWindow} ${
        isMobile ? "w-full static" : ""
      }`}
      ref={windowRef}
      style={{ overflowY: "auto", maxHeight: "400px" }}
    >
      <h3 className={styles.title}>Notifications</h3>
      <ul className={styles.notificationList}>
        {notifications.length === 0 && !loading && (
          <li className={styles.empty}>No notifications.</li>
        )}
        {notifications.map((notification) => {
          const displayMessage =
            notification.message ||
            notification.message_en ||
            "No message available";
          return (
            <li key={notification.id} className={styles.notificationItem}>
              <div
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: "pointer" }}
              >
                <p className={styles.message}>{displayMessage}</p>
                <span className={styles.timestamp}>
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(notification.id)}
              >
                <FaTrashAlt size={16} />
              </button>
            </li>
          );
        })}
        <li ref={loaderRef} className={styles.loader}>
          {loading && hasMore && "Loading..."}
        </li>
      </ul>
    </div>
  );
};

export default NotificationsWindow;
