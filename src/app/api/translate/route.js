// app/api/translate/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text, targetLanguage = "English" } = await request.json();

    // Use chat-based completions
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Translate the following text to ${targetLanguage}:\n\n${text}\n\nTranslation:`,
        },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    // The chat response content is nested in 'response.choices[x].message.content'
    const translated = response.choices[0].message.content.trim();
    return NextResponse.json({ translated });
  } catch (error) {
    console.error("Error in translation route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
