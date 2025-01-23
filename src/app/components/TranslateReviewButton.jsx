"use client";

import React, { useState } from "react";
import { translateText } from "../utils/translateUtils";

function TranslateReviewButton({ reviewText }) {
  // By default, show the original text
  const [isOriginal, setIsOriginal] = useState(true);
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggle = async () => {
    // If we're currently showing original and have NOT fetched a translation yet:
    if (isOriginal && !translatedText) {
      setLoading(true);
      setError("");
      try {
        // You can adjust the target language: "French", "Spanish", etc.
        const result = await translateText(reviewText, "English");
        setTranslatedText(result);
      } catch (err) {
        console.error(err);
        setError("An error occurred while translating.");
      } finally {
        setLoading(false);
      }
    }

    // Toggle state: if it was original, now show translated; if it was translated, show original.
    setIsOriginal(!isOriginal);
  };

  return (
    <div className="translate-review">
      <p className="review-text">
        {
          loading
            ? "Translating..."
            : isOriginal
            ? reviewText // original text
            : translatedText // translated text
        }
      </p>

      <button onClick={handleToggle} disabled={loading}>
        {loading ? "..." : isOriginal ? "Translate" : "Show Original"}
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default TranslateReviewButton;
