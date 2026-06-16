import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '@/constants/theme';

interface CalendarPickerProps {
  visible: boolean;
  onSelect: (date: string) => void;
  onClose: () => void;
  selected?: string;
  startDate?: string;
  endDate?: string;
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

function isDateBetween(dateStr: string, startStr?: string, endStr?: string): boolean {
  if (!startStr || !endStr) return false;
  const current = parseDisplayDate(dateStr);
  const start = parseDisplayDate(startStr);
  const end = parseDisplayDate(endStr);
  if (!current || !start || !end) return false;
  return current > start && current < end;
}

function getDurationDays(start: string, end: string): number {
  const s = parseDisplayDate(start);
  const e = parseDisplayDate(end);
  if (!s || !e) return 0;
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays + 1 : 0;
}

export default function CalendarPicker({ visible, onSelect, onClose, selected, startDate, endDate }: CalendarPickerProps) {
  const initial = parseDisplayDate(selected ?? '') || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    
    // Pad to multiple of 7 to avoid layout alignment anomalies on the last row
    const totalCells = Math.ceil(grid.length / 7) * 7;
    while (grid.length < totalCells) {
      grid.push(null);
    }
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
                  const isStart = dateStr === startDate;
                  const isEnd = dateStr === endDate;
                  const inRange = isDateBetween(dateStr, startDate, endDate);
                  const isToday = dateStr === todayStr;
                  
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[
                        styles.dayCell,
                        (isSelected || isStart || isEnd) && styles.daySelected,
                        inRange && styles.dayInRange,
                        isToday && !(isSelected || isStart || isEnd) && styles.dayToday
                      ]}
                      onPress={() => onSelect(dateStr)}
                    >
                      <Text style={[
                        styles.dayText,
                        (isSelected || isStart || isEnd) && styles.dayTextSelected,
                        inRange && styles.dayTextInRange
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />

          {startDate && endDate && (
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>
                Duración del viaje: {getDurationDays(startDate, endDate)} {getDurationDays(startDate, endDate) === 1 ? 'día' : 'días'}
              </Text>
            </View>
          )}
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
  dayInRange: {
    backgroundColor: Theme.colors.primary + '18',
  },
  dayText: {
    fontSize: 15,
    color: Theme.colors.textMain,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayTextInRange: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  durationContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
});
