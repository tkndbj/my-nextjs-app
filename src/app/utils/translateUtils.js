// src/app/utils/translateUtils.js

/**
 * Translates the given text by calling our Next.js API route.
 * This keeps your secret key on the server side.
 *
 * @param {string} text - The text to translate.
 * @param {string} [targetLanguage="English"] - Target language. E.g., "French".
 * @returns {Promise<string>} - Translated text from the server.
 */
export async function translateText(text, targetLanguage = "English") {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.translated;
  } catch (error) {
    console.error("Error while translating:", error);
    throw error;
  }
}
