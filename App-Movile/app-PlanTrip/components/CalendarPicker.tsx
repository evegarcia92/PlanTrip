import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '@/constants/theme';

interface CalendarPickerProps {
  visible: boolean;
  onSelect: (date: string) => void;
  onClose: () => void;
  selected?: string;
}

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
}

function parseDisplayDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarPicker({ visible, onSelect, onClose, selected }: CalendarPickerProps) {
  const initial = parseDisplayDate(selected ?? '') || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const chunks: (number | null)[][] = [];
  for (let i = 0; i < daysGrid.length; i += 7) {
    chunks.push(daysGrid.slice(i, i + 7));
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={80} tint="light" style={styles.modal}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYear}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => <Text key={w} style={styles.weekDay}>{w}</Text>)}
          </View>

          <FlatList
            data={chunks}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            renderItem={({ item: week }) => (
              <View style={styles.weekRow}>
                {week.map((day, i) => {
                  if (day === null) return <View key={`e-${i}`} style={styles.dayCell} />;
                  const dateStr = formatDate(viewYear, viewMonth, day);
                  const isSelected = dateStr === selected;
                  const isToday = dateStr === todayStr;
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[styles.dayCell, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}
                      onPress={() => onSelect(dateStr)}
                    >
                      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    width: '85%',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 28,
    color: Theme.colors.primary,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekDay: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    paddingVertical: 6,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  daySelected: {
    backgroundColor: Theme.colors.primary,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  dayText: {
    fontSize: 15,
    color: Theme.colors.textMain,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
