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
  useWindowDimensions,
  Platform,
} from "react-native";
import { BlurView } from 'expo-blur';
import { router } from "expo-router";
import MessageBubble from "./MessageBubble";
import { processUserMessage } from "../services/orchestrator";
import { useTrip, ItineraryItem } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { IconSymbol } from './ui/icon-symbol';
import { Theme } from '@/constants/theme';





function itemIcon(type: string): string {
  switch (type) {
    case 'Accommodation': return 'bed.double.fill';
    case 'Meal': return 'fork.knife';
    case 'Activity': return 'figure.walk';
    default: return 'dollarsign.circle';
  }
}

// Helpers for date operations
function parseDisplayDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return new Date(y, m - 1, d);
}

function getDurationDays(start: string, end: string): number {
  const s = parseDisplayDate(start);
  const e = parseDisplayDate(end);
  if (!s || !e) return 0;
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays + 1 : 0;
}

function distributeItemsEquitably(
  newItems: ItineraryItem[],
  totalDays: number,
  currentPending: ItineraryItem[]
): ItineraryItem[] {
  if (totalDays <= 0) return newItems;
  
  const simulatedPending = [...currentPending];
  const result: ItineraryItem[] = [];

  for (const item of newItems) {
    if (item.type === 'Accommodation') {
      result.push(item);
    } else if (item.type === 'Meal' || item.type === 'Activity') {
      let bestDay = 1;
      let minCount = Infinity;

      for (let d = 1; d <= totalDays; d++) {
        const count = simulatedPending.filter(
          pi => pi.type === item.type && (pi.day === d)
        ).length;
        if (count < minCount) {
          minCount = count;
          bestDay = d;
        }
      }

      const updatedItem = { ...item, day: bestDay };
      result.push(updatedItem);
      simulatedPending.push(updatedItem);
    } else {
      result.push(item);
    }
  }

  return result;
}


const ChatScreen = () => {
  const { user } = useAuth();
  const { tripParams, itinerary, pendingItems, addPendingItems, removePendingItem, clearPendingAccommodations } = useTrip();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const botName = user?.username || 'viajero';
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Cart aside / modal states
  const [isCartMinimized, setIsCartMinimized] = useState(true);
  const [showCartModalMobile, setShowCartModalMobile] = useState(false);
  
  // Ordinal step states
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const totalDays = useMemo(() => {
    if (!tripParams.startDate || !tripParams.endDate) return 0;
    return getDurationDays(tripParams.startDate, tripParams.endDate);
  }, [tripParams.startDate, tripParams.endDate]);

  const totalSteps = 3;

  const currentStepName = useMemo(() => {
    if (currentStepIndex >= 3) return 'Planificación Completada';
    return currentStepIndex === 0 ? 'Alojamiento' : currentStepIndex === 1 ? 'Restaurantes' : 'Actividades';
  }, [currentStepIndex]);

  useEffect(() => {
    (async () => {
      if (!tripParams.destination) {
        setMessages([{ sender: 'bot', text: `¡Hola ${botName}! 👋 Antes de buscar opciones, configurá tu viaje desde la pantalla **Inicio** (destino, presupuesto, fechas y pasajeros). Después volvé y te mostraré las mejores opciones.` }]);
        setInitialLoading(false);
        return;
      }
      // Start flow by asking first step
      const firstStepPrompt = `Hola, soy ${botName}. Iniciemos la planificación de mi viaje de ${totalDays} días a ${tripParams.destination}. Empecemos por el Paso 1: elegir un hospedaje para todo el viaje.`;
      const { text } = await processUserMessage(firstStepPrompt, tripParams, itinerary, 0, totalSteps, user?.username);
      setMessages([{ sender: 'bot', text }]);
      setInitialLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripParams.destination]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleGoToPayment = () => {
    setShowCartModalMobile(false);
    router.navigate('/(tabs)/timelapse');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setLoading(true);

    let { text, newItinerary, finishedStep, heTerminado } = await processUserMessage(
      userText,
      tripParams,
      itinerary,
      currentStepIndex,
      totalSteps,
      user?.username,
      messages
    );
    
    setMessages((prev) => [...prev, { sender: "bot", text: text }]);
    
    if (newItinerary && newItinerary.length > 0) {
      let itemsToAdd: ItineraryItem[] = [];
      
      // 1. Handle accommodation if present in newItinerary
      const hotelItem = newItinerary.find(item => item.type === 'Accommodation');
      if (hotelItem) {
        clearPendingAccommodations();
        for (let d = 1; d <= totalDays; d++) {
          itemsToAdd.push({
            ...hotelItem,
            day: d
          });
        }
        finishedStep = true;
      }

      // 2. Handle meals and activities from newItinerary
      const otherItems = newItinerary.filter(item => item.type !== 'Accommodation');
      if (otherItems.length > 0) {
        const distributed = distributeItemsEquitably(otherItems, totalDays, [...pendingItems, ...itemsToAdd]);
        itemsToAdd = [...itemsToAdd, ...distributed];
      }

      addPendingItems(itemsToAdd);
    }
    
    if (heTerminado) {
      handleGoToPayment();
    } else if (finishedStep) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps));
    }
    
    setLoading(false);
  };

  const cartByDay = useMemo(() => {
    const groups: Record<number, typeof pendingItems> = {};
    for (const item of pendingItems) {
      const d = item.day || 1;
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    }
    return groups;
  }, [pendingItems]);

  const baseTotal = useMemo(() => {
    return pendingItems.reduce((sum, item) => sum + item.price, 0);
  }, [pendingItems]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  // Sub-component for rendering the cart items and checkout section
  const renderCartContent = () => (
    <View style={styles.cartContentWrapper}>
      <ScrollView style={styles.cartList} contentContainerStyle={styles.cartListContent}>
        {pendingItems.length === 0 ? (
          <View style={styles.emptyCartBox}>
            <IconSymbol size={48} name="cart.fill" color={Theme.colors.primaryLight} />
            <Text style={styles.emptyCartText}>Tu carrito está vacío</Text>
            <Text style={styles.emptyCartSub}>Agregá alojamientos, excursiones o comidas chateando con el asistente.</Text>
          </View>
        ) : (
          Object.keys(cartByDay).sort((a, b) => Number(a) - Number(b)).map((dayStr) => {
            const day = Number(dayStr);
            const items = cartByDay[day];
            return (
              <View key={day}>
                <Text style={styles.cartDayTitle}>Día {day}</Text>
                {items.map((item) => {
                  // Find original index in pendingItems to delete correctly
                  const origIdx = pendingItems.findIndex(pi => pi.name === item.name && pi.day === item.day && pi.price === item.price);
                  return (
                    <View key={`${item.name}-${origIdx}`} style={styles.cartItem}>
                      <IconSymbol size={18} name={itemIcon(item.type) as any} color={Theme.colors.primary} />
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemType}>{item.type === 'Accommodation' ? 'Alojamiento' : item.type === 'Activity' ? 'Actividad' : 'Comida'}</Text>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                      </View>
                      <View style={styles.cartItemRight}>
                        <Text style={styles.cartItemPrice}>${item.price.toLocaleString()}</Text>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => removePendingItem(origIdx)}>
                          <IconSymbol size={16} name="trash.fill" color={Theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {pendingItems.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.priceSummaryBox}>
            <View style={[styles.priceSummaryRow, { paddingBottom: 10 }]}>
              <Text style={styles.cartTotalLabel}>Subtotal:</Text>
              <Text style={styles.cartTotalValue}>${baseTotal.toLocaleString()}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.cartFinalizeBtn} onPress={handleGoToPayment}>
            <Text style={styles.cartFinalizeText}>Ir al Resumen para Pagar →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderHorizontalStepper = () => {
    return (
      <View style={styles.horizontalStepperContainer}>
        <View style={styles.horizontalStepperScroll}>
          {['Alojamiento', 'Restaurantes', 'Actividades'].map((label, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            
            return (
              <View
                key={idx}
                style={[
                  styles.stepperItemMobile,
                  isCompleted && styles.stepperItemMobileCompleted,
                  isActive && styles.stepperItemMobileActive,
                ]}
              >
                {isCompleted ? (
                  <IconSymbol size={12} name="checkmark" color="#fff" style={{ marginRight: 4 }} />
                ) : isActive ? (
                  <View style={styles.activeDot} />
                ) : null}
                <Text
                  style={[
                    styles.stepperItemMobileText,
                    isCompleted && styles.stepperItemMobileTextCompleted,
                    isActive && styles.stepperItemMobileTextActive,
                  ]}
                >
                  {idx + 1}. {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderVerticalStepper = () => {
    return (
      <View style={styles.verticalStepperContainer}>
        <Text style={styles.stepperTitle}>Pasos de Planificación</Text>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {['Alojamiento', 'Restaurantes', 'Actividades'].map((label, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            
            return (
              <View
                key={idx}
                style={[
                  styles.stepperItemWeb,
                  isActive && styles.stepperItemWebActive,
                  isCompleted && styles.stepperItemWebCompleted,
                ]}
              >
                <View style={[
                  styles.stepperDot,
                  isCompleted && styles.stepperDotCompleted,
                  isActive && styles.stepperDotActive,
                ]}>
                  {isCompleted ? (
                    <IconSymbol size={10} name="checkmark" color="#fff" />
                  ) : isActive ? (
                    <View style={styles.stepperDotActiveInner} />
                  ) : null}
                </View>
                <View style={styles.stepperTextCol}>
                  <Text style={[
                    styles.stepperStepLabel,
                    isActive && styles.stepperStepLabelActive,
                    isCompleted && styles.stepperStepLabelCompleted,
                  ]}>
                    Paso {idx + 1}
                  </Text>
                  <Text style={[
                    styles.stepperStepCat,
                    isActive && styles.stepperStepCatActive,
                    isCompleted && styles.stepperStepCatCompleted,
                  ]}>
                    {label}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Step Banner with Consolidated Cart Button */}
      {tripParams.destination && (
        <View style={styles.stepBanner}>
          <View style={styles.stepBannerHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepBannerText}>
                🤖 Asistente: <Text style={{ fontWeight: 'bold', color: Theme.colors.primary }}>{currentStepName}</Text> (Paso {Math.min(currentStepIndex + 1, totalSteps)} de {totalSteps})
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, (currentStepIndex / totalSteps) * 100)}%` }]} />
              </View>
            </View>
            <TouchableOpacity
              style={styles.cartIconButton}
              onPress={() => {
                if (isWideScreen) {
                  setIsCartMinimized(!isCartMinimized);
                } else {
                  setShowCartModalMobile(true);
                }
              }}
            >
              <IconSymbol size={22} name="cart.fill" color={Theme.colors.primary} />
              {pendingItems.length > 0 && (
                <View style={styles.cartIconBadge}>
                  <Text style={styles.cartIconBadgeText}>{pendingItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Body Layout (Dynamic split screen for Web aside vs mobile) */}
      <View style={styles.bodyLayout}>
        {/* Left aside vertical stepper for Web */}
        {isWideScreen && tripParams.destination && renderVerticalStepper()}

        <View style={styles.chatArea}>
          {/* Horizontal stepper for mobile */}
          {!isWideScreen && tripParams.destination && renderHorizontalStepper()}

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollArea}
          >
            {initialLoading ? (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Inicializando asistente de viaje...</Text>
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

        {/* Aside Panel for Web */}
        {isWideScreen && (
          <View style={[styles.asidePanel, isCartMinimized && styles.asidePanelMinimized]}>
            {!isCartMinimized && (
              <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject}>
                <View style={styles.cartHeader}>
                  <Text style={styles.cartTitle}>Tu Carrito</Text>
                  <TouchableOpacity onPress={() => setIsCartMinimized(true)}>
                    <IconSymbol size={22} name="xmark.circle.fill" color={Theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {renderCartContent()}
              </BlurView>
            )}
          </View>
        )}
      </View>

      {/* Mobile Cart Modal Overlay */}
      {!isWideScreen && (
        <Modal visible={showCartModalMobile} transparent animationType="slide">
          <View style={styles.cartOverlay}>
            <TouchableOpacity style={styles.cartDismiss} onPress={() => setShowCartModalMobile(false)} />
            <BlurView intensity={95} tint="light" style={styles.cartPanel}>
              <View style={styles.cartHeader}>
                <Text style={styles.cartTitle}>Tu Carrito</Text>
                <TouchableOpacity onPress={() => setShowCartModalMobile(false)}>
                  <IconSymbol size={24} name="xmark.circle.fill" color={Theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {renderCartContent()}
            </BlurView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgEnd, paddingBottom: 60 },
  stepBanner: {
    backgroundColor: Theme.colors.surfaceLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  stepBannerText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Theme.colors.borderDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 3,
  },
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  chatArea: {
    flex: 1,
    height: '100%',
  },
  asidePanel: {
    width: 360,
    height: '100%',
    backgroundColor: Theme.colors.surfaceLight,
    borderLeftWidth: 1,
    borderLeftColor: Theme.colors.borderLight,
  },
  asidePanelMinimized: {
    width: 0,
    borderLeftWidth: 0,
  },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 20 },
  stepBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cartIconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Theme.colors.error,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cartOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cartDismiss: { flex: 1 },
  cartPanel: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  cartContentWrapper: {
    flex: 1,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderDark,
  },
  cartTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textMain },
  cartList: { flex: 1 },
  cartListContent: { paddingHorizontal: 16, paddingBottom: 30 },
  cartDayTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    gap: 8,
  },
  cartItemInfo: { flex: 1 },
  cartItemType: { fontSize: 10, color: Theme.colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase' },
  cartItemName: { fontSize: 14, color: Theme.colors.textMain, fontWeight: '600', marginTop: 1 },
  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartItemPrice: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.primary },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  emptyCartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginTop: 12,
  },
  emptyCartSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  
  // Checkout Styles
  checkoutSection: {
    marginTop: 20,
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 12,
  },
  cardSelectLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  cardsScroll: {
    gap: 8,
    marginBottom: 8,
  },
  cardChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
  },
  cardChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  cardChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  cardChipTextSelected: {
    color: '#fff',
  },
  
  // Virtual Card
  virtualCardWrapper: {
    alignItems: 'center',
    marginVertical: 18,
  },
  virtualCard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  virtualCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  virtualCardBrand: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  virtualCardChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ffd700',
    opacity: 0.8,
  },
  virtualCardNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 2,
    marginVertical: 10,
  },
  virtualCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  virtualCardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: 'bold',
  },
  virtualCardValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Promos
  promoBanner: {
    backgroundColor: Theme.colors.success + '15',
    borderColor: Theme.colors.success + '40',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    position: 'relative',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.success,
  },
  promoDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  promoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Theme.colors.success,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  promoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderDark,
    padding: 16,
    backgroundColor: Theme.colors.surfaceLight,
  },
  priceSummaryBox: {
    marginBottom: 16,
    gap: 6,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSummaryDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(105, 124, 178, 0.15)',
    paddingTop: 10,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  cartTotalLabel: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textMain },
  cartTotalValue: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
  cartFinalizeBtn: {
    backgroundColor: Theme.colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cartFinalizeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
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
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderDark,
    marginVertical: 16,
  },
  // Stepper Styles
  horizontalStepperContainer: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  horizontalStepperScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepperItemMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
  },
  stepperItemMobileActive: {
    backgroundColor: Theme.colors.primary + '15',
    borderColor: Theme.colors.primary,
  },
  stepperItemMobileCompleted: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  stepperItemMobileText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  stepperItemMobileTextActive: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  stepperItemMobileTextCompleted: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
    marginRight: 4,
  },
  verticalStepperContainer: {
    width: 240,
    height: '100%',
    backgroundColor: Theme.colors.surfaceLight,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.borderLight,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  stepperTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 16,
    paddingLeft: 4,
  },
  stepperItemWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    opacity: 0.5,
  },
  stepperItemWebActive: {
    backgroundColor: Theme.colors.primary + '15',
    opacity: 1,
  },
  stepperItemWebCompleted: {
    opacity: 0.9,
  },
  stepperDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDotCompleted: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  stepperDotActive: {
    borderColor: Theme.colors.primary,
  },
  stepperDotActiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  stepperTextCol: {
    flex: 1,
  },
  stepperStepLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
  },
  stepperStepLabelActive: {
    color: Theme.colors.primary,
  },
  stepperStepLabelCompleted: {
    color: Theme.colors.success,
  },
  stepperStepCat: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textMain,
    marginTop: 2,
  },
  stepperStepCatActive: {
    fontWeight: 'bold',
  },
  stepperStepCatCompleted: {
    color: Theme.colors.textSecondary,
  },
});

export default ChatScreen;


