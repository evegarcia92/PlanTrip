import axios from "axios";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

export const fetchBotResponse = async (
  userMessage: string,
  systemContext?: string,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  try {
    const messages = [];
    if (systemContext) {
      messages.push({ role: "system", content: systemContext });
    } else {
      messages.push({ role: "system", content: "Eres un asistente útil especializado en organizar viajes." });
    }

    // Limitar historial a los últimos 10 mensajes para ahorrar tokens y mantener foco
    const historyLimit = 10;
    const historyToUse = chatHistory.slice(-historyLimit);
    for (const msg of historyToUse) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
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
