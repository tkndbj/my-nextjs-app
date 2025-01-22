// src/components/ChatWindow.jsx

"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc, // <-- Added
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { FaPaperPlane, FaPaperclip } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

export default function ChatWindow({ chat, userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat) return;

    const messagesRef = collection(db, "chats", chat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
        scrollToBottom();
      },
      (error) => {
        console.error("ChatWindow: Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [chat]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const messagesRef = collection(db, "chats", chat.id, "messages");
    const chatRef = doc(db, "chats", chat.id); // Now 'doc' is defined

    try {
      await addDoc(messagesRef, {
        senderId: userId,
        recipientId: chat.participants.find((id) => id !== userId),
        timestamp: serverTimestamp(),
        text: input,
        isRead: false,
        type: "text",
      });

      await updateDoc(chatRef, {
        lastMessage: input,
        lastTimestamp: serverTimestamp(),
        [`unreadCounts.${chat.participants.find((id) => id !== userId)}`]: 1,
      });

      setInput("");
      scrollToBottom();
    } catch (error) {
      console.error("ChatWindow: Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700">
        <span className="text-lg font-semibold">
          {chat.otherUser?.displayName || "Chat"}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <IoMdClose size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${
                msg.senderId === userId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === userId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-xs mt-1 block">
                  {msg.timestamp?.toDate().toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t dark:border-gray-700 flex items-center">
        <button className="mr-2 text-gray-500 hover:text-gray-700">
          <FaPaperclip />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          className="ml-2 text-blue-500 hover:text-blue-700"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
