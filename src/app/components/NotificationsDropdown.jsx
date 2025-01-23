// src/app/components/NotificationsDropdown.jsx

"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaEnvelope,
} from "react-icons/fa";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "./Portal";

export default function NotificationsDropdown({ userId, anchorRef }) {
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    if (!userId) {
      console.warn("NotificationsDropdown: No userId provided.");
      return;
    }

    const notificationsRef = collection(db, "users", userId, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
      },
      (error) => {
        console.error(
          "NotificationsDropdown: Error fetching notifications:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    if (!userId) {
      console.error(
        "NotificationsDropdown: Cannot mark as read without userId."
      );
      return;
    }

    try {
      const notifRef = doc(
        db,
        "users",
        userId,
        "notifications",
        notificationId
      );
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error(
        "NotificationsDropdown: Error marking notification as read:",
        error
      );
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "message":
        return <FaEnvelope className="text-blue-500" />;
      case "boost":
        return <FaExclamationCircle className="text-yellow-500" />;
      case "shipment":
        return <FaInfoCircle className="text-green-500" />;
      default:
        return <FaCheckCircle className="text-gray-500" />;
    }
  };

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="dropdown-content"
          style={{
            position: "absolute",
            top: position.top,
            left: position.left,
            width: "300px",
            backgroundColor: "var(--sidebar-color)",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
            borderRadius: "6px",
            zIndex: 1000,
          }}
          ref={dropdownRef}
        >
          <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700">
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications available.
              </div>
            ) : (
              notifications.map((notif) => {
                const message =
                  notif.message_en || "You have a new notification.";

                return (
                  <Link
                    href="#"
                    key={notif.id}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start"
                    onClick={() => markAsRead(notif.id)}
                  >
                    {/* Notification Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notif.type)}
                    </div>
                    {/* Notification Content */}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notif.title || "New Notification"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {notif.timestamp
                          ? new Date(
                              notif.timestamp.seconds * 1000
                            ).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
