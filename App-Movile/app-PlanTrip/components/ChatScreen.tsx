import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { BlurView } from 'expo-blur';
import { router } from "expo-router";
import MessageBubble from "./MessageBubble";
import { processUserMessage } from "../services/orchestrator";
import { useTrip } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { IconSymbol } from './ui/icon-symbol';
import { Theme } from '@/constants/theme';

const TAB_BAR_HEIGHT = 60;

function itemIcon(type: string): string {
  switch (type) {
    case 'Accommodation': return 'bed.double.fill';
    case 'Meal': return 'fork.knife';
    case 'Activity': return 'figure.walk';
    default: return 'dollarsign.circle';
  }
}

const ChatScreen = () => {
  const { user } = useAuth();
  const { tripParams, itinerary, pendingItems, addPendingItems, finalizeTrip } = useTrip();
  const botName = user?.username || 'viajero';
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    (async () => {
      if (!tripParams.destination) {
        setMessages([{ sender: 'bot', text: `¡Hola ${botName}! 👋 Antes de buscar opciones, configurá tu viaje desde la pantalla **Inicio** (destino, presupuesto, fechas y pasajeros). Después volvé y te mostraré las mejores opciones.` }]);
        setInitialLoading(false);
        return;
      }
      const msg = `Hola, soy ${botName}. Mostrame los destinos disponibles.`;
      const { text } = await processUserMessage(msg, tripParams, itinerary, user?.username);
      setMessages([{ sender: 'bot', text }]);
      setInitialLoading(false);
    })();
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setLoading(true);

    const { text, newItinerary } = await processUserMessage(userText, tripParams, itinerary, user?.username);
    
    setMessages((prev) => [...prev, { sender: "bot", text: text }]);
    
    if (newItinerary && newItinerary.length > 0) {
      addPendingItems(newItinerary);
    }
    
    setLoading(false);
  };

  const handleFinalize = () => {
    finalizeTrip();
    setShowCart(false);
    router.navigate('/(tabs)/itinerary');
  };

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  const cartByDay = useMemo(() => {
    const groups: Record<number, typeof pendingItems> = {};
    for (const item of pendingItems) {
      const d = item.day || 1;
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    }
    return groups;
  }, [pendingItems]);

  const cartTotal = useMemo(() => {
    return pendingItems.reduce((sum, item) => sum + item.price, 0);
  }, [pendingItems]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Asistente IA</Text>
            <Text style={styles.headerSubtitle}>
              {tripParams.destination ? `Viaje a ${tripParams.destination} - Presupuesto: $${tripParams.maxBudget}` : 'Configura tu viaje en Inicio'}
            </Text>
          </View>
          {pendingItems.length > 0 && (
            <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
              <IconSymbol size={22} name="cart.fill" color={Theme.colors.primary} />
              <Text style={styles.cartBadge}>{pendingItems.length}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollArea}
      >
        {initialLoading ? (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando destinos...</Text>
          </View>
        ) : messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Analizando opciones...</Text>
          </View>
        )}
      </ScrollView>

      {pendingItems.length > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => setShowCart(true)}>
          <IconSymbol size={20} name="cart.fill" color="#fff" />
          <Text style={styles.cartBarText}>{pendingItems.length} ítem(s) en tu carrito — Tocá para ver</Text>
          <Text style={styles.cartBarTotal}>${cartTotal.toLocaleString()}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.cartOverlay}>
          <TouchableOpacity style={styles.cartDismiss} onPress={() => setShowCart(false)} />
          <BlurView intensity={90} tint="light" style={styles.cartPanel}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Tu Carrito</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <IconSymbol size={24} name="xmark.circle.fill" color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartList} contentContainerStyle={styles.cartListContent}>
              {Object.keys(cartByDay).sort((a, b) => Number(a) - Number(b)).map((dayStr) => {
                const day = Number(dayStr);
                const items = cartByDay[day];
                return (
                  <View key={day}>
                    <Text style={styles.cartDayTitle}>Día {day}</Text>
                    {items.map((item, idx) => (
                      <View key={`${day}-${idx}`} style={styles.cartItem}>
                        <IconSymbol size={18} name={itemIcon(item.type) as any} color={Theme.colors.primary} />
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemType}>{item.type}</Text>
                          <Text style={styles.cartItemName}>{item.name}</Text>
                        </View>
                        <Text style={styles.cartItemPrice}>${item.price.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.cartFooter}>
              <View style={styles.cartTotalRow}>
                <Text style={styles.cartTotalLabel}>Total:</Text>
                <Text style={styles.cartTotalValue}>${cartTotal.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.cartFinalizeBtn} onPress={handleFinalize}>
                <Text style={styles.cartFinalizeText}>✓ Finalizar y guardar Itinerario</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribí algo..."
          placeholderTextColor={Theme.colors.textSecondary}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading || !input.trim()}
        >
          <IconSymbol size={24} name="paperplane.fill" color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgEnd },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: Theme.colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextCol: { flex: 1 },
  headerTitle: { color: Theme.colors.textMain, fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: Theme.colors.primary, fontSize: 12, marginTop: 4 },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.color2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Theme.colors.error,
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 20 },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 14,
    gap: 10,
  },
  cartBarText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  cartBarTotal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cartOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cartDismiss: { flex: 1 },
  cartPanel: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cartTitle: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.textMain },
  cartList: { maxHeight: 300 },
  cartListContent: { paddingBottom: 10 },
  cartDayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginTop: 14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  cartItemInfo: { flex: 1 },
  cartItemType: { fontSize: 11, color: Theme.colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase' },
  cartItemName: { fontSize: 15, color: Theme.colors.textMain, fontWeight: '600', marginTop: 2 },
  cartItemPrice: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.primary },
  cartFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderDark,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textMain },
  cartTotalValue: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.primary },
  cartFinalizeBtn: {
    backgroundColor: Theme.colors.success,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cartFinalizeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingBottom: TAB_BAR_HEIGHT + 10,
    backgroundColor: Theme.colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceDarker,
    color: Theme.colors.textMain,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: Theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.color2,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceLight,
    padding: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginVertical: 5,
  },
  loadingText: { color: Theme.colors.textSecondary, marginLeft: 8 },
});

export default ChatScreen;
