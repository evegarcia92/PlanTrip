import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrip } from '../../context/TripContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';

type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Depósito';

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(start: string, end: string): number {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function TimelapseScreen() {
  const { tripParams, itinerary } = useTrip();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Depósito');

  const totalPax = tripParams.adultsCount + tripParams.childrenCount;
  const tripDays = useMemo(() => daysBetween(tripParams.startDate, tripParams.endDate), [tripParams.startDate, tripParams.endDate]);
  const subtotal = itinerary.reduce((sum, item) => sum + (item.price * totalPax), 0);

  let baseTotal = subtotal;

  // Payment modifier
  let paymentModifierPct = 0;
  if (paymentMethod === 'Efectivo') paymentModifierPct = -0.10;
  if (paymentMethod === 'Tarjeta') paymentModifierPct = 0.05;
  const paymentModifierValue = baseTotal * paymentModifierPct;

  const total = baseTotal + paymentModifierValue;

  const groupedByDay = itinerary.reduce((acc, item, index) => {
    const day = tripDays > 0 ? (index % tripDays) + 1 : (index % 3) + 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, typeof itinerary>);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tu Recorrido</Text>
          <Text style={styles.headerSubtitle}>Destino: {tripParams.destination || 'Por definir'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {itinerary.length === 0 ? (
            <BlurView intensity={50} tint="light" style={styles.emptyCard}>
              <IconSymbol size={48} name="clock.arrow.circlepath" color={Theme.colors.primary} />
              <Text style={styles.emptyText}>No hay elementos en tu itinerario para armar el timelapse.</Text>
            </BlurView>
          ) : (
            <>
              {Object.keys(groupedByDay).sort().map((dayStr) => {
                const day = Number(dayStr);
                const items = groupedByDay[day];
                return (
                  <View key={day} style={styles.timelineDay}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Día {day}</Text>
                      </View>
                      <View style={styles.dayLine} />
                    </View>
                    {items.map((item, idx) => (
                      <BlurView intensity={60} tint="light" key={idx} style={styles.timelineCard}>
                        <View style={styles.cardHeader}>
                          <IconSymbol 
                            size={20} 
                            name={item.type === 'Accommodation' ? 'bed.double.fill' : item.type === 'Meal' ? 'fork.knife' : item.type === 'Activity' ? 'figure.walk' : 'dollarsign.circle'} 
                            color={Theme.colors.primary} 
                          />
                          <Text style={styles.cardType}>{item.type}</Text>
                        </View>
                        <Text style={styles.cardName}>{item.name}</Text>
                        <Text style={styles.cardPrice}>${item.price}</Text>
                      </BlurView>
                    ))}
                  </View>
                );
              })}

              <BlurView intensity={60} tint="light" style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen de Pago</Text>
                
                <Text style={styles.label}>Método de Pago</Text>
                <View style={styles.paymentRow}>
                  {['Efectivo', 'Tarjeta', 'Depósito'].map(method => (
                    <TouchableOpacity 
                      key={method} 
                      style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
                      onPress={() => setPaymentMethod(method as PaymentMethod)}
                    >
                      <Text style={[styles.paymentChipText, paymentMethod === method && styles.paymentChipTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Pasajeros:</Text>
                  <Text style={styles.calcValue}>{tripParams.adultsCount} adulto(s), {tripParams.childrenCount} niño(s)</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Días de viaje:</Text>
                  <Text style={styles.calcValue}>{tripDays} día(s)</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Subtotal ({totalPax} pax):</Text>
                  <Text style={styles.calcValue}>${subtotal.toFixed(2)}</Text>
                </View>

                {paymentModifierValue !== 0 && (
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>
                      {paymentMethod === 'Efectivo' ? 'Descuento Efectivo (-10%)' : 'Recargo Tarjeta (+5%)'}:
                    </Text>
                    <Text style={[styles.calcValue, { color: paymentMethod === 'Efectivo' ? Theme.colors.success : Theme.colors.error }]}>
                      {paymentMethod === 'Efectivo' ? '-' : '+'}${Math.abs(paymentModifierValue).toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={[styles.calcRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Final:</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>

              </BlurView>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    padding: 24,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.primary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 130,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  emptyText: {
    color: Theme.colors.textMain,
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  timelineDay: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  dayBadgeText: {
    color: Theme.colors.textLight,
    fontWeight: 'bold',
  },
  dayLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.borderDark,
  },
  timelineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
    backgroundColor: Theme.colors.surfaceLight,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardName: {
    color: Theme.colors.textMain,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardPrice: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 20,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  paymentChip: {
    backgroundColor: Theme.colors.color2,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.color1
  },
  paymentChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  paymentChipText: {
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  paymentChipTextActive: {
    color: Theme.colors.textLight,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calcLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  calcValue: {
    color: Theme.colors.textMain,
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderDark,
  },
  totalLabel: {
    color: Theme.colors.textMain,
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: Theme.colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  }
});
