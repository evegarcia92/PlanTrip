import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ChatScreen from "./src/components/ChatScreen";
import CoverScreen from "./src/components/CoverScreen";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        {started ? (
          <ChatScreen />
        ) : (
          <CoverScreen onStart={() => setStarted(true)} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
});
