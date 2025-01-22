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

/**
 * MessagesWindow Component
 *
 * Props:
 * - userId: Current user's ID
 * - onClose: Callback to close the MessagesWindow
 * - preselectedChatId: Optional chatId to auto-open
 */
const MessagesWindow = ({ userId, onClose, preselectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);

  const windowRef = useRef(null);

  // outside click
  useOutsideAlerter([windowRef], () => {
    // Only close the window if no chat is selected
    if (!selectedChat) {
      onClose();
    }
  });

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

        // Build a map of other participant's displayName
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
                  newUsersMap[pid] =
                    userSnap.data().displayName || "Unnamed User";
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
    // intentionally omit usersMap from deps to avoid re-fetch
  }, [userId]);

  // If preselectedChatId is passed, auto-open that chat (if it’s in the list)
  useEffect(() => {
    if (!preselectedChatId || !chats.length) return;
    // Find the chat in the loaded list
    const found = chats.find((c) => c.id === preselectedChatId);
    if (found) {
      setSelectedChat(found);
    } else {
      // Possibly the doc isn't in the 20 most recent. Let's fetch it directly.
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

              // optionally, you can prepend it to your local chats if desired
              // setChats((prev) => [chatData, ...prev]);
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

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.messagesWindow} ref={windowRef}>
          <div className={styles.titleBar}>
            <h3 className={styles.title}>Inbox</h3>
          </div>
          <p className={styles.loading}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.messagesWindow} ref={windowRef}>
        {/* Title Bar */}
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

        {/* Content */}
        {selectedChat ? (
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
    </div>
  );
};

export default MessagesWindow;
