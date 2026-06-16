import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTrip } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';

const CARDS = [
  { id: 'galicia', name: 'Banco Galicia', type: 'banco', brand: 'Visa', colors: ['#ff9900', '#0033aa'], discount: 10 },
  { id: 'santander', name: 'Banco Santander', type: 'banco', brand: 'Mastercard', colors: ['#cc0000', '#660000'], discount: 12 },
  { id: 'nacion', name: 'Banco Nación', type: 'banco', brand: 'Visa', colors: ['#007a87', '#003e45'], discount: 8 },
  { id: 'naranja', name: 'Tarjeta Naranja', type: 'privada', brand: 'Naranja X', colors: ['#ff6f00', '#d84315'], discount: 5 },
  { id: 'cabal', name: 'Tarjeta Cabal', type: 'privada', brand: 'Cabal', colors: ['#2e7d32', '#1b5e20'], discount: 7 },
  { id: 'visa', name: 'Visa Gold', type: 'entidad', brand: 'Visa', colors: ['#1e3a8a', '#172554'], discount: 10 },
  { id: 'mastercard', name: 'Mastercard Black', type: 'entidad', brand: 'Mastercard', colors: ['#111111', '#333333'], discount: 10 },
  { id: 'amex', name: 'Amex Platinum', type: 'entidad', brand: 'American Express', colors: ['#78909c', '#37474f'], discount: 15 },
];

const BENEFIT_CLUBS = [
  { id: 'none', name: 'Ninguno', discount: 0 },
  { id: 'lanacion', name: 'Club La Nación', discount: 10 },
  { id: 'clarin365', name: 'Clarín 365', discount: 10 },
];

const EXCHANGE_RATES = {
  ARS: 1,
  USD: 1000,
  EUR: 1100,
};

const DEST_IMAGES: Record<string, any> = {
  'bariloche': require('../../assets/images/bariloche.png'),
  'buenos aires': require('../../assets/images/buenos_aires.png'),
  'mendoza': require('../../assets/images/mendoza.png'),
  'salta': require('../../assets/images/salta.png'),
  'córdoba': require('../../assets/images/cordoba.png'),
  'cordoba': require('../../assets/images/cordoba.png'),
  'iguazú': require('../../assets/images/iguazu.png'),
  'iguazu': require('../../assets/images/iguazu.png'),
  'ushuaia': require('../../assets/images/ushuaia.png'),
  'el calafate': require('../../assets/images/el_calafate.png'),
  'puerto madryn': require('../../assets/images/puerto_madryn.png'),
  'mar del plata': require('../../assets/images/mar_del_plata.png'),
  'rosario': require('../../assets/images/rosario.png'),
  'san martín de los andes': require('../../assets/images/san_martin_de_los_andes.png'),
  'san martin de los andes': require('../../assets/images/san_martin_de_los_andes.png'),
};

const getDestinationImage = (destName: string) => {
  const normalized = (destName || '').trim().toLowerCase();
  if (DEST_IMAGES[normalized]) {
    return DEST_IMAGES[normalized];
  }
  return require('../../assets/images/icon.png');
};

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

function includesWeekend(start: string, end: string): boolean {
  const s = parseDisplayDate(start);
  const e = parseDisplayDate(end);
  if (!s || !e) return false;
  const current = new Date(s.getTime());
  while (current <= e) {
    const day = current.getDay();
    if (day === 0 || day === 6) return true; // 0 = Sunday, 6 = Saturday
    current.setDate(current.getDate() + 1);
  }
  return false;
}

export default function TimelapseScreen() {
  const { user } = useAuth();
  const { tripParams, itinerary, pendingItems, finalizeTrip, addReservation } = useTrip();

  const [paymentType, setPaymentType] = useState<'tarjeta' | 'efectivo'>('tarjeta');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('ARS');
  const [selectedCardId, setSelectedCardId] = useState('galicia');
  const [selectedClubId, setSelectedClubId] = useState('none');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<any>(null);

  const isPendingMode = pendingItems.length > 0;
  const itemsToDisplay = isPendingMode ? pendingItems : itinerary;

  const totalPax = tripParams.adultsCount + tripParams.childrenCount;
  const tripDays = useMemo(() => {
    if (!tripParams.startDate || !tripParams.endDate) return 0;
    return getDurationDays(tripParams.startDate, tripParams.endDate);
  }, [tripParams.startDate, tripParams.endDate]);

  const subtotal = useMemo(() => {
    return itemsToDisplay.reduce((sum, item) => sum + (item.price * totalPax), 0);
  }, [itemsToDisplay, totalPax]);

  // Date-based promo calculation (weekend, season, etc.)
  const datePromo = useMemo(() => {
    if (!tripParams.startDate || !tripParams.endDate) {
      return { code: 'general', name: 'Promoción de Temporada', desc: '5% de descuento en tu reserva', discount: 5 };
    }
    
    const isWeekend = includesWeekend(tripParams.startDate, tripParams.endDate);
    const start = parseDisplayDate(tripParams.startDate);
    const isWinter = start ? (start.getMonth() === 6 || start.getMonth() === 7) : false;
    const isSummer = start ? (start.getMonth() === 0 || start.getMonth() === 1) : false;

    if (isWeekend) {
      return { code: 'finde_largo', name: '¡Aprovechá el Finde Largo!', desc: '15% de descuento especial por fin de semana', discount: 15 };
    } else if (isWinter) {
      return { code: 'escapada_invierno', name: '¡Escapada de Invierno!', desc: '10% de descuento en tu reserva invernal', discount: 10 };
    } else if (isSummer) {
      return { code: 'verano_premium', name: '¡Verano Premium!', desc: '12% de descuento en tu reserva de verano', discount: 12 };
    } else if (tripDays <= 4) {
      return { code: 'media_semana', name: '¡Descuento Media Semana!', desc: '20% off en reservas de Lunes a Jueves', discount: 20 };
    }
    return { code: 'general', name: 'Promoción de Temporada', desc: '5% de descuento en tu reserva', discount: 5 };
  }, [tripParams.startDate, tripParams.endDate, tripDays]);

  const selectedCard = useMemo(() => {
    return CARDS.find(c => c.id === selectedCardId) || CARDS[0];
  }, [selectedCardId]);

  const selectedClub = useMemo(() => {
    return BENEFIT_CLUBS.find(c => c.id === selectedClubId) || BENEFIT_CLUBS[0];
  }, [selectedClubId]);

  // Calculate discounts
  const dateDiscountValue = useMemo(() => {
    return Math.round(subtotal * (datePromo.discount / 100));
  }, [subtotal, datePromo.discount]);

  const cardDiscountValue = useMemo(() => {
    if (paymentType === 'efectivo') return 0;
    return Math.round(subtotal * (selectedCard.discount / 100));
  }, [subtotal, selectedCard.discount, paymentType]);

  const clubDiscountValue = useMemo(() => {
    return Math.round(subtotal * (selectedClub.discount / 100));
  }, [subtotal, selectedClub.discount]);

  const totalDiscount = dateDiscountValue + cardDiscountValue + clubDiscountValue;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const convertedTotal = useMemo(() => {
    const rate = EXCHANGE_RATES[currency] || 1;
    return finalTotal / rate;
  }, [finalTotal, currency]);

  const handleFinalizePayment = () => {
    const resId = 'RES-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newRes = {
      id: resId,
      destination: tripParams.destination,
      startDate: tripParams.startDate,
      endDate: tripParams.endDate,
      adultsCount: tripParams.adultsCount,
      childrenCount: tripParams.childrenCount,
      totalPriceARS: finalTotal,
      paymentMethod: paymentType === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
      currency: currency,
      convertedPrice: convertedTotal,
      cardName: paymentType === 'tarjeta' ? selectedCard.name : undefined,
      clubName: selectedClubId !== 'none' ? selectedClub.name : undefined,
      items: [...itemsToDisplay],
      date: new Date().toLocaleDateString(),
    };

    addReservation(newRes);
    setCurrentReservation(newRes);
    setShowConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    finalizeTrip();
    router.navigate('/(tabs)/reservations');
  };

  const handlePrintPDF = () => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Group items by day
        const grouped = itemsToDisplay.reduce((acc, item) => {
          const d = item.day || 1;
          if (!acc[d]) acc[d] = [];
          acc[d].push(item);
          return acc;
        }, {} as Record<number, typeof itemsToDisplay>);

        const itemsListHtml = Object.keys(grouped)
          .sort((a, b) => Number(a) - Number(b))
          .map(dayStr => {
            const day = Number(dayStr);
            const dayItems = grouped[day];
            const itemsHtml = dayItems.map(item => `
              <div style="padding: 6px 0; font-size: 14px; border-bottom: 1px dashed #e2e8f0; display: flex; justify-content: space-between;">
                <span>• <strong>${item.type === 'Accommodation' ? 'Alojamiento' : item.type === 'Meal' ? 'Comida' : 'Actividad'}</strong>: ${item.name}</span>
                <span style="font-weight: bold; color: #4a5568;">$${(item.price * totalPax).toLocaleString()} ARS</span>
              </div>
            `).join('');

            return `
              <div style="margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
                <h4 style="margin: 0 0 10px 0; color: #2b6cb0; font-size: 15px; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">Día ${day}</h4>
                ${itemsHtml}
              </div>
            `;
          })
          .join('');

        const currencySymbol = currency === 'ARS' ? '$' : currency === 'USD' ? 'U$S' : '€';
        const formattedPrice = `${currencySymbol} ${convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

        const destImage = getDestinationImage(tripParams.destination);
        let imageUrl = '';
        try {
          const resolved = Image.resolveAssetSource(destImage);
          if (resolved) {
            imageUrl = resolved.uri;
            if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
              const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
              if (origin) {
                imageUrl = imageUrl.startsWith('/') ? (origin + imageUrl) : (origin + '/' + imageUrl);
              }
            }
          }
        } catch (e) {
          console.warn('Error resolving asset source:', e);
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Confirmación de Reserva - ${tripParams.destination}</title>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #2d3748; line-height: 1.6; }
                .header { border-bottom: 4px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                .title { font-size: 26px; font-weight: bold; color: #2b6cb0; }
                .subtitle { font-size: 15px; color: #718096; margin-top: 5px; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; color: #2d3748; margin-bottom: 12px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                .total-row { font-size: 22px; font-weight: bold; color: #2b6cb0; border-top: 3px solid #3182ce; padding-top: 12px; margin-top: 20px; display: flex; justify-content: space-between; }
                .label { font-weight: bold; color: #4a5568; }
              </style>
            </head>
            <body>
              <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px;">
                <div style="flex: 1; padding-right: 20px;">
                  <div class="title" style="font-size: 28px; font-weight: bold; color: #2b6cb0;">AI-Trip Planner</div>
                  <div class="subtitle" style="font-size: 16px; color: #4a5568; margin-top: 5px; font-weight: bold;">Confirmación de Reserva</div>
                  <div style="font-size: 14px; color: #718096; margin-top: 10px;">Código de Reserva: <strong style="color: #2d3748;">${currentReservation?.id || 'N/A'}</strong></div>
                  <div style="font-size: 14px; color: #718096; margin-top: 2px;">Fecha de Compra: ${currentReservation?.date || new Date().toLocaleDateString()}</div>
                </div>
                <div>
                  <img src="${imageUrl}" style="width: 240px; height: 160px; object-fit: cover; border-radius: 12px; border: 3px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" alt="Postal de ${tripParams.destination}" />
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Detalles del Destino</div>
                <div class="detail-row"><span class="label">Destino:</span> <span>${tripParams.destination}</span></div>
                <div class="detail-row"><span class="label">Fechas del Viaje:</span> <span>${tripParams.startDate} a ${tripParams.endDate} (${tripDays} días)</span></div>
                <div class="detail-row"><span class="label">Pasajeros:</span> <span>${totalPax} (${tripParams.adultsCount} adultos, ${tripParams.childrenCount} niños)</span></div>
              </div>
              
              <div class="section">
                <div class="section-title">Detalle del Itinerario</div>
                ${itemsListHtml}
              </div>
              
              <div class="section">
                <div class="section-title">Resumen Financiero y Pago</div>
                <div class="detail-row"><span class="label">Método de Pago:</span> <span>${paymentType === 'tarjeta' ? `Tarjeta (${selectedCard.name})` : `Efectivo en ${currency}`}</span></div>
                <div class="detail-row"><span class="label">Subtotal ARS:</span> <span>$${subtotal.toLocaleString()} ARS</span></div>
                <div class="detail-row"><span class="label">Descuentos Aplicados:</span> <span>$${totalDiscount.toLocaleString()} ARS</span></div>
                <div class="total-row">
                  <span>Total Final:</span>
                  <span>${formattedPrice}</span>
                </div>
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      alert(`📄 PDF de reserva generado para ${tripParams.destination}.\nSe guardó en Reservaciones.`);
    }
  };

  const groupedByDay = useMemo(() => {
    return itemsToDisplay.reduce((acc, item) => {
      const day = item.day || 1;
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {} as Record<number, typeof itemsToDisplay>);
  }, [itemsToDisplay]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Resumen del Viaje</Text>
              <Text style={styles.headerSubtitle}>Destino: {tripParams.destination || 'Por definir'}</Text>
            </View>
            {tripParams.destination ? (
              <Image 
                source={getDestinationImage(tripParams.destination)} 
                style={styles.headerImage} 
              />
            ) : null}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {itemsToDisplay.length === 0 ? (
            <BlurView intensity={50} tint="light" style={styles.emptyCard}>
              <IconSymbol size={48} name="clock.arrow.circlepath" color={Theme.colors.primary} />
              <Text style={styles.emptyText}>No hay elementos en tu itinerario. Chateá con el asistente para empezar.</Text>
            </BlurView>
          ) : (
            <>
              {/* Recorrido Timeline */}
              <Text style={styles.sectionTitle}>{isPendingMode ? 'Plan Tentativo (Por pagar)' : 'Itinerario Confirmado'}</Text>
              
              {Object.keys(groupedByDay).sort((a,b) => Number(a)-Number(b)).map((dayStr) => {
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
                          <Text style={styles.cardType}>{item.type === 'Accommodation' ? 'Alojamiento' : item.type === 'Meal' ? 'Comida' : item.type === 'Activity' ? 'Actividad' : item.type}</Text>
                        </View>
                        <Text style={styles.cardName}>{item.name}</Text>
                        <Text style={styles.cardPrice}>${(item.price * totalPax).toLocaleString()} <Text style={styles.cardPricePax}>(${item.price.toLocaleString()} x {totalPax} pax)</Text></Text>
                      </BlurView>
                    ))}
                  </View>
                );
              })}

              {/* Checkout / Payment Section (Only visible if there are pending items to pay) */}
              {isPendingMode ? (
                <BlurView intensity={60} tint="light" style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Forma de Pago & Descuentos</Text>
                  
                  {/* Payment Type Selection */}
                  <Text style={styles.cardSelectLabel}>Medio de Pago</Text>
                  <View style={styles.paymentTypeRow}>
                    <TouchableOpacity
                      style={[styles.paymentTypeChip, paymentType === 'tarjeta' && styles.paymentTypeChipActive]}
                      onPress={() => {
                        setPaymentType('tarjeta');
                        setCurrency('ARS');
                      }}
                    >
                      <IconSymbol size={16} name="creditcard.fill" color={paymentType === 'tarjeta' ? '#fff' : Theme.colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.paymentTypeChipText, paymentType === 'tarjeta' && styles.paymentTypeChipTextActive]}>Tarjeta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.paymentTypeChip, paymentType === 'efectivo' && styles.paymentTypeChipActive]}
                      onPress={() => setPaymentType('efectivo')}
                    >
                      <IconSymbol size={16} name="dollarsign.circle" color={paymentType === 'efectivo' ? '#fff' : Theme.colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.paymentTypeChipText, paymentType === 'efectivo' && styles.paymentTypeChipTextActive]}>Efectivo / Multidivisa</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Cash Currency Selector */}
                  {paymentType === 'efectivo' ? (
                    <>
                      <Text style={styles.cardSelectLabel}>Moneda de Pago</Text>
                      <View style={styles.paymentTypeRow}>
                        {['ARS', 'USD', 'EUR'].map((curr) => (
                          <TouchableOpacity
                            key={curr}
                            style={[styles.clubChip, currency === curr && styles.clubChipSelected]}
                            onPress={() => setCurrency(curr as any)}
                          >
                            <Text style={[styles.clubChipText, currency === curr && styles.clubChipTextSelected]}>
                              {curr === 'ARS' ? 'Pesos (ARS)' : curr === 'USD' ? 'Dólares (USD)' : 'Euros (EUR)'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Cards Selector grouped by category */}
                      <Text style={styles.cardSelectLabel}>Bancos (Tarjetas Bancarizadas)</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                        {CARDS.filter(c => c.type === 'banco').map(c => (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.cardChip, selectedCardId === c.id && styles.cardChipSelected]}
                            onPress={() => setSelectedCardId(c.id)}
                          >
                            <Text style={[styles.cardChipText, selectedCardId === c.id && styles.cardChipTextSelected]}>{c.name} ({c.discount}%)</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={styles.cardSelectLabel}>Tarjetas Privadas / Fintechs</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                        {CARDS.filter(c => c.type === 'privada').map(c => (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.cardChip, selectedCardId === c.id && styles.cardChipSelected]}
                            onPress={() => setSelectedCardId(c.id)}
                          >
                            <Text style={[styles.cardChipText, selectedCardId === c.id && styles.cardChipTextSelected]}>{c.name} ({c.discount}%)</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={styles.cardSelectLabel}>Entidades Financieras / Redes</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                        {CARDS.filter(c => c.type === 'entidad').map(c => (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.cardChip, selectedCardId === c.id && styles.cardChipSelected]}
                            onPress={() => setSelectedCardId(c.id)}
                          >
                            <Text style={[styles.cardChipText, selectedCardId === c.id && styles.cardChipTextSelected]}>{c.name} ({c.discount}%)</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* Payment Display (Virtual Card or Cash Box) */}
                  {paymentType === 'efectivo' ? (
                    <View style={styles.virtualCardWrapper}>
                      <LinearGradient
                        colors={['#1b5e20', '#2e7d32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.virtualCard}
                      >
                        <View style={styles.virtualCardHeader}>
                          <Text style={styles.virtualCardBrand}>PAGO EN EFECTIVO</Text>
                          <IconSymbol size={28} name="dollarsign.circle.fill" color="rgba(255,255,255,0.8)" />
                        </View>
                        <View style={{ marginVertical: 6 }}>
                          <Text style={styles.virtualCardLabel}>TOTAL A ABONAR ({currency})</Text>
                          <Text style={styles.virtualCardNumber}>
                            {currency === 'ARS' ? '$' : currency === 'USD' ? 'U$S' : '€'}{' '}
                            {convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                        <View style={styles.virtualCardFooter}>
                          <View>
                            <Text style={styles.virtualCardLabel}>TASA DE CONVERSIÓN</Text>
                            <Text style={styles.virtualCardValue}>
                              {currency === 'ARS' ? 'Moneda Base (1:1)' : currency === 'USD' ? '1 USD = $1.000 ARS' : '1 EUR = $1.100 ARS'}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  ) : (
                    <View style={styles.virtualCardWrapper}>
                      <LinearGradient
                        colors={selectedCard.colors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.virtualCard}
                      >
                        <View style={styles.virtualCardHeader}>
                          <Text style={styles.virtualCardBrand}>{selectedCard.brand}</Text>
                          <IconSymbol size={28} name="creditcard.fill" color="rgba(255,255,255,0.8)" />
                        </View>
                        <View style={styles.virtualCardChip} />
                        <Text style={styles.virtualCardNumber}>•••• •••• •••• 5678</Text>
                        <View style={styles.virtualCardFooter}>
                          <View>
                            <Text style={styles.virtualCardLabel}>TITULAR</Text>
                            <Text style={styles.virtualCardValue}>{(user?.username || 'VIAJERO').toUpperCase()}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.virtualCardLabel}>VENCE</Text>
                            <Text style={styles.virtualCardValue}>12/31</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* Club de Beneficios Selector */}
                  <Text style={styles.cardSelectLabel}>Club de Beneficios</Text>
                  <View style={styles.clubsContainer}>
                    {BENEFIT_CLUBS.map(club => (
                      <TouchableOpacity
                        key={club.id}
                        style={[styles.clubChip, selectedClubId === club.id && styles.clubChipSelected]}
                        onPress={() => setSelectedClubId(club.id)}
                      >
                        <Text style={[styles.clubChipText, selectedClubId === club.id && styles.clubChipTextSelected]}>
                          {club.name} {club.discount > 0 ? `(${club.discount}%)` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Date Promo Banner */}
                  <View style={styles.promoBanner}>
                    <View style={styles.promoHeader}>
                      <IconSymbol size={16} name="calendar" color={Theme.colors.success} />
                      <Text style={styles.promoTitle}>{datePromo.name}</Text>
                    </View>
                    <Text style={styles.promoDesc}>{datePromo.desc}</Text>
                    <View style={styles.promoBadge}>
                      <Text style={styles.promoBadgeText}>-{datePromo.discount}% OFF</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Pricing summary details */}
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Pasajeros:</Text>
                    <Text style={styles.calcValue}>{tripParams.adultsCount} adulto(s), {tripParams.childrenCount} niño(s) ({totalPax} pax)</Text>
                  </View>
                  
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Días de viaje:</Text>
                    <Text style={styles.calcValue}>{tripDays} día(s)</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Subtotal:</Text>
                    <Text style={styles.calcValue}>${subtotal.toLocaleString()} ARS</Text>
                  </View>

                  {paymentType === 'tarjeta' ? (
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Descuento Tarjeta ({selectedCard.name}):</Text>
                      <Text style={[styles.calcValue, { color: Theme.colors.success }]}>-${cardDiscountValue.toLocaleString()} ARS</Text>
                    </View>
                  ) : null}

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Descuento Promo Especial:</Text>
                    <Text style={[styles.calcValue, { color: Theme.colors.success }]}>-${dateDiscountValue.toLocaleString()} ARS</Text>
                  </View>

                  {selectedClub.discount > 0 && (
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Descuento Club ({selectedClub.name}):</Text>
                      <Text style={[styles.calcValue, { color: Theme.colors.success }]}>-${clubDiscountValue.toLocaleString()} ARS</Text>
                    </View>
                  )}

                  <View style={[styles.calcRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Final ({currency}):</Text>
                    <Text style={styles.totalValue}>
                      {currency === 'ARS' ? '$' : currency === 'USD' ? 'U$S' : '€'}{' '}
                      {convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.finalizeBtn} onPress={handleFinalizePayment}>
                    <Text style={styles.finalizeBtnText}>✓ Confirmar Pago y Reservar Viaje</Text>
                  </TouchableOpacity>
                </BlurView>
              ) : (
                <View style={styles.successWrapper}>
                  <View style={styles.successBanner}>
                    <IconSymbol size={28} name="checkmark.circle.fill" color={Theme.colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.successTitle}>¡Viaje Confirmado y Reservado!</Text>
                      <Text style={styles.successDesc}>Tu pago ha sido procesado correctamente. Todo tu itinerario está asegurado y guardado en tu historial de reservaciones.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.confirmedPrintBtn} onPress={handlePrintPDF}>
                    <IconSymbol size={20} name="printer.fill" color="#fff" />
                    <Text style={styles.confirmedPrintBtnText}>Imprimir Resumen en PDF</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <IconSymbol size={48} name="airplane.circle.fill" color="#ffd700" style={{ marginBottom: 8 }} />
              <Text style={[styles.modalTitle, { fontSize: 24, color: '#fff', fontWeight: 'bold' }]}>¡Felicitaciones por tu Viaje! 🎉</Text>
              <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }]}>Tu reserva ha sido confirmada con éxito</Text>
              <Text style={styles.modalSubtitle}>Código de Reserva: {currentReservation?.id}</Text>
            </View>
            
            <ScrollView style={{ flex: 1, marginVertical: 15 }} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.congratulationsBox}>
                <Text style={styles.congratulationsText}>
                  ¡Tu aventura a {tripParams.destination} está lista! Tu pago fue procesado correctamente y todo tu itinerario está asegurado.
                </Text>
              </View>

              {tripParams.destination ? (
                <View style={styles.modalDestRow}>
                  <Image source={getDestinationImage(tripParams.destination)} style={styles.modalDestImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalDestName}>{tripParams.destination}</Text>
                    <Text style={styles.modalDestDates}>{tripParams.startDate} a {tripParams.endDate} ({tripDays} días)</Text>
                    <Text style={styles.modalDestPax}>{totalPax} Pasajero(s) ({tripParams.adultsCount} adultos, {tripParams.childrenCount} niños)</Text>
                  </View>
                </View>
              ) : null}
              
              <Text style={styles.modalSectionTitle}>Itinerario Reservado</Text>
              {itemsToDisplay.map((item, idx) => (
                <View key={idx} style={styles.modalItemRow}>
                  <IconSymbol 
                    size={16} 
                    name={item.type === 'Accommodation' ? 'bed.double.fill' : item.type === 'Meal' ? 'fork.knife' : 'figure.walk'} 
                    color={Theme.colors.primary} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalItemText} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>${(item.price * totalPax).toLocaleString()} ARS</Text>
                </View>
              ))}
              
              <View style={styles.divider} />
              
              <View style={styles.modalPriceRow}>
                <Text style={styles.modalPriceLabel}>Subtotal:</Text>
                <Text style={styles.modalPriceValue}>${subtotal.toLocaleString()} ARS</Text>
              </View>
              <View style={styles.modalPriceRow}>
                <Text style={styles.modalPriceLabel}>Descuentos:</Text>
                <Text style={[styles.modalPriceValue, { color: Theme.colors.success }]}>-${totalDiscount.toLocaleString()} ARS</Text>
              </View>
              <View style={[styles.modalPriceRow, styles.modalPriceTotalRow]}>
                <Text style={styles.modalPriceTotalLabel}>Total Pagado:</Text>
                <Text style={styles.modalPriceTotalValue}>
                  {currency === 'ARS' ? '$' : currency === 'USD' ? 'U$S' : '€'}{' '}
                  {convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </Text>
              </View>
              
              <View style={styles.modalPaymentInfo}>
                <Text style={styles.modalInfoLabel}>Forma de Pago:</Text>
                <Text style={styles.modalInfoValue}>
                  {paymentType === 'tarjeta' ? `Tarjeta (${selectedCard.name})` : `Efectivo en ${currency}`}
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalPrintBtn} onPress={handlePrintPDF}>
                <IconSymbol size={18} name="printer.fill" color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrintBtnText}>Imprimir PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseConfirmation}>
                <Text style={styles.modalCloseBtnText}>Ver Mis Reservas</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
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
    borderBottomColor: Theme.colors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Theme.colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  headerImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 16,
    marginTop: 10,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    marginTop: 20,
  },
  emptyText: {
    color: Theme.colors.textMain,
    marginTop: 20,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  timelineDay: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
  },
  dayBadgeText: {
    color: Theme.colors.textLight,
    fontWeight: 'bold',
    fontSize: 13,
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
    marginBottom: 6,
  },
  cardType: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  cardName: {
    color: Theme.colors.textMain,
    fontSize: 17,
    fontWeight: 'bold',
  },
  cardPrice: {
    color: Theme.colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardPricePax: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: 'normal',
  },
  summaryCard: {
    marginTop: 10,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surfaceLight,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    marginBottom: 16,
  },
  cardSelectLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  cardsScroll: {
    gap: 8,
    marginBottom: 4,
    paddingBottom: 4,
  },
  cardChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
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
  virtualCardWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  virtualCard: {
    width: '100%',
    height: 170,
    borderRadius: 16,
    padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  virtualCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  virtualCardBrand: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  virtualCardChip: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#ffd700',
    opacity: 0.8,
  },
  virtualCardNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 2,
    marginVertical: 8,
  },
  virtualCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  virtualCardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    fontWeight: 'bold',
  },
  virtualCardValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  clubsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  clubChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
  },
  clubChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  clubChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  clubChipTextSelected: {
    color: '#fff',
  },
  promoBanner: {
    backgroundColor: Theme.colors.success + '15',
    borderColor: Theme.colors.success + '40',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
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
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderDark,
    marginVertical: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calcLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  calcValue: {
    color: Theme.colors.textMain,
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderDark,
  },
  totalLabel: {
    color: Theme.colors.textMain,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: Theme.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  finalizeBtn: {
    backgroundColor: Theme.colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  finalizeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  paymentTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  paymentTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
  },
  paymentTypeChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  paymentTypeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  paymentTypeChipTextActive: {
    color: '#fff',
  },
  successWrapper: {
    marginTop: 10,
    gap: 12,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.success + '15',
    borderColor: Theme.colors.success + '40',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.success,
    marginBottom: 4,
  },
  successDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  confirmedPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmedPrintBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  modalDestRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDestImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  modalDestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalDestDates: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  modalDestPax: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  modalItemText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  modalItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalPriceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  modalPriceValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  modalPriceTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalPriceTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalPriceTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primaryLight,
  },
  modalPaymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 8,
  },
  modalInfoLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  modalInfoValue: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalPrintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalPrintBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  congratulationsBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderColor: '#ffd700',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  congratulationsText: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
