// screens/ChatScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import MessageBubble from "./MessageBubble";
import { sendMessage } from "../services/openrouter";
import styles from "../styles/ChatScreenStyles";

const SYSTEM_PROMPT = `Sos un asistente de viajes argentino llamado PlanTrip 🧳.
Tu objetivo es ayudar al usuario a planificar un viaje paso a paso.
Primero preguntá: destino, fechas, presupuesto, cantidad de acompañantes.
Después armá un itinerario con alojamiento, actividades y transporte.
Sé amigable, usá lenguaje informal argentino y emojis.
Respondé siempre en español.`;

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Soy PlanTrip, tu asistente de viajes.\n\n¿A dónde te gustaría viajar? Contame destino, fechas, presupuesto y cuántos van 🧳",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const history = [{ role: "system", content: SYSTEM_PROMPT }, ...updated];
      const reply = await sendMessage(history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error al contactar al asistente." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {loading && (
        <View style={styles.loadingBubble}>
          <ActivityIndicator size="small" color="#e94560" />
          <Text style={{ marginLeft: 8, color: "#888" }}>Escribiendo...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribí tu mensaje..."
          placeholderTextColor="#888"
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
