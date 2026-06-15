import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrip } from '../../context/TripContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';

function itemIcon(type: string): string {
  switch (type) {
    case 'Accommodation': return 'bed.double.fill';
    case 'Meal': return 'fork.knife';
    case 'Activity': return 'figure.walk';
    default: return 'dollarsign.circle';
  }
}

export default function ItineraryTab() {
  const { tripParams, itinerary } = useTrip();

  const totalPax = tripParams.adultsCount + tripParams.childrenCount;
  const totalCost = itinerary.reduce((sum, item) => sum + (item.price * totalPax), 0);
  const remainingBudget = tripParams.maxBudget - totalCost;

  const groupedByDay = useMemo(() => {
    const groups: Record<number, typeof itinerary> = {};
    for (const item of itinerary) {
      const d = item.day || 1;
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    }
    return groups;
  }, [itinerary]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tu Itinerario</Text>
          <Text style={styles.headerSubtitle}>
            {itinerary.length} opciones seleccionadas
            {tripParams.startDate && ` · ${tripParams.startDate} → ${tripParams.endDate}`}
          </Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {itinerary.length === 0 ? (
            <BlurView intensity={50} tint="light" style={styles.emptyContainer}>
              <IconSymbol size={64} name="paperplane.fill" color={Theme.colors.primary} />
              <Text style={styles.emptyText}>Tu itinerario está vacío.</Text>
              <Text style={styles.emptySub}>Hablá con el asistente para empezar a armarlo.</Text>
            </BlurView>
          ) : (
            Object.keys(groupedByDay).sort((a, b) => Number(a) - Number(b)).map((dayStr) => {
              const day = Number(dayStr);
              const items = groupedByDay[day];
              return (
                <View key={day}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>Día {day}</Text>
                    </View>
                    <View style={styles.dayLine} />
                  </View>
                  {items.map((item, idx) => (
                    <BlurView intensity={60} tint="light" key={`${day}-${idx}`} style={styles.card}>
                      <View style={styles.cardIcon}>
                        <IconSymbol size={24} name={itemIcon(item.type) as any} color={Theme.colors.primary} />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardType}>{item.type}</Text>
                        <Text style={styles.cardName}>{item.name}</Text>
                        {item.details && <Text style={styles.cardDetails}>{item.details}</Text>}
                      </View>
                      <Text style={styles.cardPrice}>${item.price}</Text>
                    </BlurView>
                  ))}
                </View>
              );
            })
          )}

          {itinerary.length > 0 && (
            <BlurView intensity={60} tint="light" style={styles.budgetCard}>
              <Text style={styles.budgetTitle}>Resumen de Presupuesto</Text>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Acompañantes:</Text>
                <Text style={styles.budgetValue}>{tripParams.adultsCount} adultos, {tripParams.childrenCount} niños</Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Costo Total Estimado:</Text>
                <Text style={styles.budgetValue}>${totalCost}</Text>
              </View>
              <View style={[styles.budgetRow, styles.budgetDivider]}>
                <Text style={styles.budgetLabel}>Presupuesto Máximo:</Text>
                <Text style={styles.budgetValue}>${tripParams.maxBudget}</Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Restante:</Text>
                <Text style={[styles.budgetValue, { color: remainingBudget < 0 ? Theme.colors.error : Theme.colors.success }]}>
                  ${remainingBudget}
                </Text>
              </View>
            </BlurView>
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
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.borderDark 
  },
  headerTitle: { color: Theme.colors.textMain, fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: Theme.colors.primary, fontSize: 16, marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 130 },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 50, 
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  emptyText: { color: Theme.colors.textMain, fontSize: 20, marginTop: 20, fontWeight: 'bold' },
  emptySub: { color: Theme.colors.textSecondary, fontSize: 15, marginTop: 10, textAlign: 'center' },
  
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  dayBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  dayBadgeText: {
    color: Theme.colors.textLight,
    fontWeight: 'bold',
    fontSize: 14,
  },
  dayLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.borderDark,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
    overflow: 'hidden'
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.color2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  cardContent: { flex: 1 },
  cardType: { color: Theme.colors.secondary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  cardName: { color: Theme.colors.textMain, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  cardDetails: { color: Theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  cardPrice: { color: Theme.colors.primary, fontSize: 18, fontWeight: 'bold' },

  budgetCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
    overflow: 'hidden'
  },
  budgetTitle: { color: Theme.colors.textMain, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budgetLabel: { color: Theme.colors.textSecondary, fontSize: 15 },
  budgetValue: { color: Theme.colors.textMain, fontSize: 16, fontWeight: 'bold' },
  budgetDivider: {
    marginTop: 10, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: Theme.colors.borderDark
  }
});
