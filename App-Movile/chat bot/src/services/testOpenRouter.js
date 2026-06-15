// testOpenRouter.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Tu API key desde .env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const fetchOpenRouterResponse = async (userMessage) => {
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

    // Imprimimos toda la respuesta cruda
    console.log("Respuesta completa de OpenRouter:");
    console.log(JSON.stringify(response.data, null, 2));

    // Intentamos extraer el mensaje del asistente
    const choice = response.data.choices?.[0];
    const respMessage =
      choice?.message?.content || choice?.text || "⚠️ No se encontró contenido";

    console.log("Mensaje extraído del asistente:", respMessage);
  } catch (error) {
    console.error("Error en OpenRouter:", error.response?.data || error.message);
  }
};

// Probar la API
fetchOpenRouterResponse("Hola, probando la API de OpenRouter");
