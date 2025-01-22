// src/app/openai.js

export const translateText = async (text, targetLanguage) => {
  try {
    const response = await fetch("/api/openai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to translate text");
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};
