// components/MessageBubble.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
      <Text style={styles.text}>{message.content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#e94560",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bot: {
    backgroundColor: "#333",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },
});

export default MessageBubble;
