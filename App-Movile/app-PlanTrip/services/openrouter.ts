import axios from "axios";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export const fetchBotResponse = async (userMessage: string, systemContext?: string): Promise<string> => {
  try {
    const messages = [];
    if (systemContext) {
      messages.push({ role: "system", content: systemContext });
    } else {
      messages.push({ role: "system", content: "Eres un asistente útil especializado en organizar viajes." });
    }
    messages.push({ role: "user", content: userMessage });

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      }
    );

    return response.data.choices?.[0]?.message?.content || "⚠️ No se encontró contenido";
  } catch (error: any) {
    console.error("❌ Error en OpenRouter:", error.response?.data || error.message);
    return "⚠️ Error al conectar con la API de OpenRouter.";
  }
};
