// services/openrouter.js
import axios from "axios";

import { OPENROUTER_API_KEY } from "@env";

export const fetchBotResponse = async (userMessage) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un asistente útil." },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      }
    );

    return response.data.choices?.[0]?.message?.content || "⚠️ No se encontró contenido";
  } catch (error) {
    console.error("❌ Error en OpenRouter:", error.response?.data || error.message);
    return "⚠️ Error al conectar con la API de OpenRouter.";
  }
};
