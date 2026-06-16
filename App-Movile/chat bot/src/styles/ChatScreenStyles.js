import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  chatList: {
    padding: 12,
    paddingBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#333",
    backgroundColor: "#16213e",
  },
  input: {
    flex: 1,
    backgroundColor: "#0f3460",
    borderRadius: 20,
    paddingHorizontal: 15,
    color: "#fff",
    fontSize: 15,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#e94560",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontSize: 20,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    padding: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginVertical: 5,
  },
});
