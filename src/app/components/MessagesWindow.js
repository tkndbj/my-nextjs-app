// src/app/components/MessagesWindow.js

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import styles from "./MessagesWindow.module.css";
import ChatBox from "./ChatBox";
import { useOutsideAlerter } from "../../hooks/useOutsideAlerter";

const MessagesWindow = ({
  userId,
  onClose,
  preselectedChatId,
  isMobile = false,
}) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);

  const windowRef = useRef(null);

  // Only apply outside-click for desktop usage
  useEffect(() => {
    if (isMobile) return;

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

  // Fetch user chats
  useEffect(() => {
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
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setChats(items);
        setLoading(false);

        // Build map for participant displayNames
        const participantIds = new Set();
        items.forEach((c) => {
          c.participants?.forEach((pid) => {
            if (pid !== userId) participantIds.add(pid);
          });
        });

        const newUsersMap = { ...usersMap };
        const promises = [];
        participantIds.forEach((pid) => {
          if (!newUsersMap[pid]) {
            const userDocRef = doc(db, "users", pid);
            const p = getDoc(userDocRef)
              .then((userSnap) => {
                if (userSnap.exists()) {
                  newUsersMap[pid] = userSnap.data().displayName || "Unnamed User";
                } else {
                  newUsersMap[pid] = "Unknown User";
                }
              })
              .catch(() => {
                newUsersMap[pid] = "Unknown User";
              });
            promises.push(p);
          }
        });

        await Promise.all(promises);
        setUsersMap(newUsersMap);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // intentionally omit usersMap from deps (avoid re-fetch loops)
  }, [userId]);

  // Handle preselectedChatId
  useEffect(() => {
    if (!preselectedChatId || !chats.length) return;
    const found = chats.find((c) => c.id === preselectedChatId);
    if (found) {
      setSelectedChat(found);
    } else {
      // Possibly fetch doc directly
      (async () => {
        try {
          const chatDocRef = doc(db, "chats", preselectedChatId);
          const snap = await getDoc(chatDocRef);
          if (snap.exists()) {
            const chatData = { id: snap.id, ...snap.data() };
            // Make sure user is in chatData.visibleTo
            if (
              Array.isArray(chatData.visibleTo) &&
              chatData.visibleTo.includes(userId)
            ) {
              setSelectedChat(chatData);
            }
          }
        } catch (err) {
          console.error("Error fetching preselected chat doc:", err);
        }
      })();
    }
  }, [preselectedChatId, chats, userId]);

  function handleChatClick(e, chat) {
    e.stopPropagation();
    setSelectedChat(chat);
  }

  function handleBackToInbox(e) {
    e.stopPropagation();
    setSelectedChat(null);
  }

  const content = (
    <div
      className={`${styles.messagesWindow} ${isMobile ? "w-full static" : ""}`}
      ref={windowRef}
    >
      <div className={styles.titleBar}>
        {selectedChat ? (
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackToInbox}
            aria-label="Back to Inbox"
          >
            &larr; Inbox
          </button>
        ) : (
          <h3 className={styles.title}>Inbox</h3>
        )}
      </div>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : selectedChat ? (
        <ChatBox
          userId={userId}
          chat={selectedChat}
          otherName={
            usersMap[
              selectedChat.participants.find((pid) => pid !== userId)
            ] || "Unknown User"
          }
        />
      ) : (
        <ul className={styles.messagesList}>
          {chats.length === 0 ? (
            <li className={styles.empty}>No messages.</li>
          ) : (
            chats.map((chat) => {
              const otherId = chat.participants?.find((id) => id !== userId);
              const otherName = usersMap[otherId] || "Unknown User";

              return (
                <li
                  key={chat.id}
                  className={styles.messageItem}
                  onClick={(e) => handleChatClick(e, chat)}
                >
                  <h4 className={styles.recipientName}>{otherName}</h4>
                  <p className={styles.lastMessage}>
                    {chat.lastMessage?.length > 50
                      ? chat.lastMessage.substring(0, 50) + "..."
                      : chat.lastMessage || ""}
                  </p>
                  <span className={styles.timestamp}>
                    {chat.lastTimestamp?.toDate
                      ? new Date(chat.lastTimestamp.toDate()).toLocaleString()
                      : ""}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );

  // If desktop, wrap with .overlay
  if (!isMobile) {
    return <div className={styles.overlay}>{content}</div>;
  }
  // Mobile: no overlay
  return content;
};

export default MessagesWindow;
