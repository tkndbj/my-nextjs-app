// src/app/components/ChatsDropdown.jsx

"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { FaEnvelopeOpenText, FaTrash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "./ChatWindow";
import { toast } from "react-toastify";
import Portal from "./Portal";
import { useOutsideAlerter } from "../../hooks/useOutsideAlerter";

export default function ChatsDropdown({ userId, anchorRef, onClose }) {
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Set the position of the dropdown based on the anchorRef
  useEffect(() => {
    if (anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorRef]);

  // Subscribe to chats relevant to the user
  useEffect(() => {
    if (!userId) {
      console.warn("ChatsDropdown: No userId provided.");
      return;
    }

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("visibleTo", "array-contains", userId),
      orderBy("lastTimestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatsData);

        // Extract unique other user IDs from chats
        const otherUserIds = [
          ...new Set(
            chatsData
              .map((chat) => chat.participants.find((id) => id !== userId))
              .filter((id) => id)
          ),
        ];

        // Identify which user data needs to be fetched
        const usersToFetch = otherUserIds.filter((id) => !users[id]);

        if (usersToFetch.length > 0) {
          try {
            const userPromises = usersToFetch.map((id) =>
              getDoc(doc(db, "users", id))
            );
            const userSnapshots = await Promise.all(userPromises);
            const newUsers = {};
            userSnapshots.forEach((snap) => {
              if (snap.exists()) {
                newUsers[snap.id] = snap.data();
              }
            });
            setUsers((prev) => ({ ...prev, ...newUsers }));
          } catch (error) {
            console.error("ChatsDropdown: Error fetching user data:", error);
            toast.error("Failed to fetch user data.");
          }
        }
      },
      (error) => {
        console.error("ChatsDropdown: Error fetching chats:", error);
        toast.error("Failed to fetch chats.");
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userId]); // Ensure 'users' is not in dependencies

  // Function to mark a chat as read
  const markAsRead = async (chatId) => {
    if (!userId) {
      console.error("ChatsDropdown: Cannot mark as read without userId.");
      return;
    }

    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, { [`unreadCounts.${userId}`]: 0 });
    } catch (error) {
      console.error("ChatsDropdown: Error marking chat as read:", error);
      toast.error("Failed to mark chat as read.");
    }
  };

  // Function to delete a chat
  const deleteChat = async (chatId) => {
    if (!userId) {
      console.error("ChatsDropdown: Cannot delete chat without userId.");
      return;
    }

    const confirmDeletion = confirm(
      "Are you sure you want to delete this chat?"
    );
    if (!confirmDeletion) return;

    try {
      await deleteDoc(doc(db, "chats", chatId));
      toast.success("Chat deleted successfully.");
    } catch (error) {
      console.error("ChatsDropdown: Error deleting chat:", error);
      toast.error("Failed to delete chat.");
    }
  };

  // Handle clicking on a chat to select it
  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    markAsRead(chat.id);
  };

  // Handle closing the chat window
  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  // Use the updated useOutsideAlerter with both dropdownRef and anchorRef
  useOutsideAlerter([dropdownRef, anchorRef], onClose);

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
            width: "400px",
            backgroundColor: "var(--sidebar-color)",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
            borderRadius: "6px",
            zIndex: 1000,
          }}
          ref={dropdownRef}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700">
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Chats
            </span>
            {selectedChat && (
              <button
                onClick={handleCloseChat}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close Chat"
                onMouseDown={(e) => e.stopPropagation()} // Prevent event propagation
              >
                &times;
              </button>
            )}
          </div>

          {/* Chat List or Chat Window */}
          <div className="max-h-80 overflow-y-auto">
            {!selectedChat ? (
              chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No new messages.
                </div>
              ) : (
                chats.map((chat) => {
                  const otherUserId = chat.participants.find(
                    (id) => id !== userId
                  );
                  const otherUser = users[otherUserId] || {};

                  return (
                    <div
                      key={chat.id}
                      className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <button
                        onClick={() => handleChatClick(chat)}
                        className="flex items-center flex-1 text-left"
                        onMouseDown={(e) => e.stopPropagation()} // Prevent event propagation
                      >
                        {/* Chat Icon */}
                        <FaEnvelopeOpenText className="text-xl text-gray-600 dark:text-gray-300 mr-3" />
                        {/* Chat Content */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {otherUser.displayName || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {chat.lastMessage || "You have a new message."}
                          </p>
                        </div>
                      </button>
                      {/* Trash Icon */}
                      <button
                        onClick={() => deleteChat(chat.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        aria-label="Delete Chat"
                        onMouseDown={(e) => e.stopPropagation()} // Prevent event propagation
                      >
                        <FaTrash />
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              <ChatWindow
                chat={selectedChat}
                userId={userId}
                onClose={handleCloseChat}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
