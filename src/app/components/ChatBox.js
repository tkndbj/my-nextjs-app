// src/app/components/ChatBox.js

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function ChatBox({ chat, userId, otherName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const { id: chatId, participants } = chat;
  const otherUserId = participants.find((pid) => pid !== userId);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen to messages in Firestore
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(items);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Ensure the chat document exists
  useEffect(() => {
    async function ensureChatExists() {
      if (!chatId) return;
      const chatDocRef = doc(db, "chats", chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      if (!chatDocSnap.exists()) {
        console.log("Creating chat doc for ID:", chatId);
        await setDoc(chatDocRef, {
          participants,
          visibleTo: participants,
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastTimestamp: serverTimestamp(),
          unreadCounts: {
            [userId]: 0,
            [otherUserId]: 0,
          },
          lastReadTimestamps: {
            [userId]: serverTimestamp(),
            [otherUserId]: serverTimestamp(),
          },
          initiated: false,
        });
      }
    }
    ensureChatExists();
  }, [chatId, participants, userId, otherUserId]);

  /**
   * Handle sending a message
   */
  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");

    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: userId,
        recipientId: otherUserId,
        timestamp: serverTimestamp(),
        text: trimmed,
        isRead: false,
        type: "text",
      });

      // Update the top-level chat document
      const chatDocRef = doc(db, "chats", chatId);
      await updateDoc(chatDocRef, {
        lastMessage: trimmed,
        lastTimestamp: serverTimestamp(),
        [`unreadCounts.${otherUserId}`]: 1,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card-background text-foreground rounded shadow-md">
      {/* Chat Header (sticky) */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center bg-card-background">
        <h2 className="text-base font-semibold">{otherName}</h2>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-background dark:bg-[#1a1a1a]">
        {messages.length === 0 ? (
          <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`max-w-[70%] mb-2 ${
                  isMe ? "ml-auto text-right" : "mr-auto text-left"
                }`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-lg ${
                    isMe
                      ? "bg-accent text-white"
                      : "bg-secondaryBackground text-foreground"
                  }`}
                >
                  {msg.type === "text" ? msg.text : "[Unsupported]"}
                </div>
                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  {msg.timestamp?.toDate
                    ? new Date(msg.timestamp.toDate()).toLocaleTimeString()
                    : ""}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2 bg-secondaryBackground">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type a message..."
          className="flex-1 bg-input-background text-foreground px-3 py-2 rounded outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-jade-green hover:bg-jade-green/90 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
