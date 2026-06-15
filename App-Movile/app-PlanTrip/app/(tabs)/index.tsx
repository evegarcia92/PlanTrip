import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Modal as RNModal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrip } from '../../context/TripContext';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';
import CustomButton from '@/components/CustomButton';
import CalendarPicker from '@/components/CalendarPicker';

const DESTINOS = [
  'Buenos Aires', 'Bariloche', 'Mendoza', 'Salta', 'Córdoba',
  'Iguazú', 'Ushuaia', 'El Calafate', 'Puerto Madryn',
  'Mar del Plata', 'Rosario', 'San Martín de los Andes',
];

export default function IndexScreen() {
  const { tripParams, setTripParams } = useTrip();
  
  const [dest, setDest] = useState(tripParams.destination);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [budget, setBudget] = useState(tripParams.maxBudget ? tripParams.maxBudget.toString() : '');
  const [startDate, setStartDate] = useState(tripParams.startDate);
  const [endDate, setEndDate] = useState(tripParams.endDate);
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);
  const [adultsCount, setAdultsCount] = useState(tripParams.adultsCount.toString());
  const [childrenCount, setChildrenCount] = useState(tripParams.childrenCount.toString());

  const handleStart = () => {
    setTripParams({
      destination: dest,
      maxBudget: Number(budget) || 0,
      startDate,
      endDate,
      adultsCount: Number(adultsCount) || 1,
      childrenCount: Number(childrenCount) || 0,
    });
    router.push('/chat');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>AI-Trip Planner</Text>
            <Text style={styles.subtitle}>Diseña tu viaje soñado con inteligencia artificial</Text>
          </View>

          <BlurView intensity={50} tint="light" style={styles.card}>
            <Text style={styles.label}>Destino</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDestPicker(true)}>
              <IconSymbol name="mappin.and.ellipse" size={20} color={Theme.colors.primary} />
              <Text style={[styles.input, !dest && styles.placeholderText]}>
                {dest || 'Seleccioná un destino'}
              </Text>
              <IconSymbol name="chevron.down" size={16} color={Theme.colors.textSecondary} />
            </TouchableOpacity>

            <RNModal visible={showDestPicker} transparent animationType="fade">
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDestPicker(false)}>
                <BlurView intensity={80} tint="light" style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Seleccioná tu destino</Text>
                  <FlatList
                    data={DESTINOS}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.destOption, dest === item && styles.destOptionActive]}
                        onPress={() => { setDest(item); setShowDestPicker(false); }}
                      >
                        <IconSymbol name="mappin" size={18} color={dest === item ? Theme.colors.primary : Theme.colors.textSecondary} />
                        <Text style={[styles.destOptionText, dest === item && styles.destOptionTextActive]}>{item}</Text>
                        {dest === item && <IconSymbol name="checkmark" size={18} color={Theme.colors.primary} />}
                      </TouchableOpacity>
                    )}
                  />
                </BlurView>
              </TouchableOpacity>
            </RNModal>

            <Text style={styles.label}>Presupuesto Máximo ($)</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="dollarsign.circle" size={20} color={Theme.colors.primary} />
              <TextInput 
                style={styles.input} 
                placeholder="Ej: 500000" 
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="numeric" 
                value={budget} 
                onChangeText={setBudget} 
              />
            </View>

            <Text style={styles.label}>Fechas del Viaje</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity style={[styles.inputContainer, styles.dateInput]} onPress={() => setShowCalendar('start')}>
                <IconSymbol name="calendar" size={18} color={Theme.colors.primary} />
                <Text style={[styles.input, !startDate && styles.placeholderText]}>
                  {startDate || 'Inicio'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateSep}>→</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dateInput]} onPress={() => setShowCalendar('end')}>
                <IconSymbol name="calendar" size={18} color={Theme.colors.primary} />
                <Text style={[styles.input, !endDate && styles.placeholderText]}>
                  {endDate || 'Fin'}
                </Text>
              </TouchableOpacity>
            </View>

            <CalendarPicker
              visible={showCalendar === 'start'}
              selected={startDate}
              onSelect={(d) => { setStartDate(d); setShowCalendar(null); }}
              onClose={() => setShowCalendar(null)}
            />
            <CalendarPicker
              visible={showCalendar === 'end'}
              selected={endDate}
              onSelect={(d) => { setEndDate(d); setShowCalendar(null); }}
              onClose={() => setShowCalendar(null)}
            />

            <Text style={styles.label}>Adultos</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="person.fill" size={20} color={Theme.colors.primary} />
              <TextInput 
                style={styles.input} 
                placeholder="Ej: 2" 
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="numeric" 
                value={adultsCount} 
                onChangeText={setAdultsCount} 
              />
            </View>

            <Text style={styles.label}>Niños</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="person.2.fill" size={20} color={Theme.colors.primary} />
              <TextInput 
                style={styles.input} 
                placeholder="Ej: 1" 
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="numeric" 
                value={childrenCount} 
                onChangeText={setChildrenCount} 
              />
            </View>

            <CustomButton
              title="Comenzar a Planificar"
              onPress={handleStart}
              icon={<IconSymbol name="arrow.right" size={20} color="#fff" />}
              style={styles.button}
            />
          </BlurView>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 130 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  title: { fontSize: 36, fontWeight: 'bold', color: Theme.colors.primary, textAlign: 'center', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 5 },
  card: { 
    borderRadius: 24, 
    padding: 24, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  label: { fontSize: 15, color: Theme.colors.textMain, marginBottom: 8, marginTop: 16, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    paddingHorizontal: 12,
  },
  input: { 
    flex: 1,
    color: Theme.colors.textMain, 
    padding: 14, 
    fontSize: 16, 
  },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: { 
    backgroundColor: Theme.colors.color2, 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.color1
  },
  chipActive: { 
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  chipText: { color: Theme.colors.textSecondary, fontWeight: 'bold' },
  chipTextActive: { color: Theme.colors.textLight },
  button: { marginTop: 40 },
  placeholderText: { color: Theme.colors.textSecondary },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 20,
    textAlign: 'center',
  },
  destOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  destOptionActive: {
    backgroundColor: Theme.colors.primary + '18',
  },
  destOptionText: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.textMain,
  },
  destOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 0,
  },
  dateSep: {
    color: Theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
