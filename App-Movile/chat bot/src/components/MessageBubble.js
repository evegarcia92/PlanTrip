// components/MessageBubble.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MessageBubble = ({ message }) => {
  const isUser = message.sender === "user";

  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  bot: {
    backgroundColor: "#EEE",
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 16,
  },
});

export default MessageBubble;
