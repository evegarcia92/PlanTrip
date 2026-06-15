import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

const MessageBubble = ({ message }: { message: { sender: string, text: string } }) => {
  const isBot = message.sender === 'bot';

  return (
    <View style={[styles.bubbleContainer, isBot ? styles.botBubble : styles.userBubble]}>
      <Text style={[styles.text, isBot ? styles.botText : styles.userText]}>{message.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 5,
  },
  botBubble: {
    backgroundColor: Theme.colors.surfaceLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  userBubble: {
    backgroundColor: Theme.colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: Theme.colors.textMain,
  },
  userText: {
    color: Theme.colors.textLight,
  },
});

export default MessageBubble;
