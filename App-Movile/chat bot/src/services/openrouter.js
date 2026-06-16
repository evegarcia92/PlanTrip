// services/openrouter.js
import axios from "axios";
import { OPENROUTER_API_KEY } from "@env";

export async function sendMessage(messages) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://plantrip.app",
          "X-Title": "PlanTrip Chatbot",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Error OpenRouter:", error.response?.data || error.message);
    throw error;
  }
}
