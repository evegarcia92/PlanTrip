import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CoverScreen({ onStart }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧳 PlanTrip</Text>
      <Text style={styles.subtitle}>Tu asistente de viajes con IA</Text>
      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Comenzar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#e94560",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
