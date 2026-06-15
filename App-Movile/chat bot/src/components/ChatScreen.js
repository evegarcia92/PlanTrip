// screens/ChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import styles from "../styles/ChatScreenStyles";
import MessageBubble from "../components/MessageBubble";
import { fetchBotResponse } from "../services/openrouter";

const ChatScreen = () => {
  const [messages, setMessages] = useState([ { sender: "bot", text: "¡Hola! Soy tu asistente bot. ¿En qué puedo ayudarte?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
    setLoading(true);

    const reply = await fetchBotResponse(input);
    setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    setLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, loading]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
      >
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {loading && (
          <View style={[styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#555" />
            <Text style={{ marginLeft: 5 }}>Escribiendo...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribí algo..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={{ color: "#fff" }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/**const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  input: {
    flex: 1,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginRight: 5,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE",
    padding: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginVertical: 5,
  },
});**/

export default ChatScreen;
