import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrip, Reservation } from '../../context/TripContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Theme } from '@/constants/theme';

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

export default function ReservationsScreen() {
  const { reservations } = useTrip();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handlePrintPDF = (res: Reservation) => {
    const totalPax = res.adultsCount + res.childrenCount;
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Group items by day
        const grouped = res.items.reduce((acc, item) => {
          const d = item.day || 1;
          if (!acc[d]) acc[d] = [];
          acc[d].push(item);
          return acc;
        }, {} as Record<number, typeof res.items>);

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

        const currencySymbol = res.currency === 'ARS' ? '$' : res.currency === 'USD' ? 'U$S' : '€';
        const formattedPrice = `${currencySymbol} ${res.convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${res.currency}`;

        const destImage = getDestinationImage(res.destination);
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
              <title>Confirmación de Reserva - ${res.destination}</title>
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
                  <div style="font-size: 14px; color: #718096; margin-top: 10px;">Código de Reserva: <strong style="color: #2d3748;">${res.id}</strong></div>
                  <div style="font-size: 14px; color: #718096; margin-top: 2px;">Fecha de Compra: ${res.date}</div>
                </div>
                <div>
                  <img src="${imageUrl}" style="width: 240px; height: 160px; object-fit: cover; border-radius: 12px; border: 3px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" alt="Postal de ${res.destination}" />
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Detalles del Destino</div>
                <div class="detail-row"><span class="label">Destino:</span> <span>${res.destination}</span></div>
                <div class="detail-row"><span class="label">Fechas del Viaje:</span> <span>${res.startDate} a ${res.endDate}</span></div>
                <div class="detail-row"><span class="label">Pasajeros:</span> <span>${totalPax} (${res.adultsCount} adultos, ${res.childrenCount} niños)</span></div>
              </div>
              
              <div class="section">
                <div class="section-title">Detalle del Itinerario</div>
                ${itemsListHtml}
              </div>
              
              <div class="section">
                <div class="section-title">Resumen Financiero y Pago</div>
                <div class="detail-row"><span class="label">Método de Pago:</span> <span>${res.paymentMethod === 'Tarjeta' ? `Tarjeta (${res.cardName || 'N/A'})` : `Efectivo en ${res.currency}`}</span></div>
                <div class="detail-row"><span class="label">Subtotal ARS:</span> <span>$${(res.items.reduce((sum, item) => sum + item.price, 0) * totalPax).toLocaleString()} ARS</span></div>
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
      alert(`📄 Recibo PDF para el viaje a ${res.destination} enviado a imprimir.`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.bgStart, Theme.colors.bgEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Reservaciones</Text>
          <Text style={styles.subtitle}>Historial de viajes reservados y confirmados</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {reservations.length === 0 ? (
            <BlurView intensity={60} tint="light" style={styles.emptyCard}>
              <IconSymbol size={48} name="archivebox.fill" color={Theme.colors.primary} />
              <Text style={styles.emptyText}>No tenés viajes reservados aún.</Text>
              <Text style={styles.emptySubtext}>Comenzá a planificar desde el Asistente y asegurá tu próxima aventura.</Text>
            </BlurView>
          ) : (
            reservations.map((res) => {
              const isExpanded = expandedId === res.id;
              const totalPax = res.adultsCount + res.childrenCount;
              
              // Group items by day
              const dayGroups = res.items.reduce((acc, item) => {
                const d = item.day || 1;
                if (!acc[d]) acc[d] = [];
                acc[d].push(item);
                return acc;
              }, {} as Record<number, typeof res.items>);

              return (
                <BlurView key={res.id} intensity={60} tint="light" style={styles.resCard}>
                  <View style={styles.resCardHeader}>
                    <Image source={getDestinationImage(res.destination)} style={styles.resDestImage} />
                    <View style={styles.resMainInfo}>
                      <Text style={styles.resDestName}>{res.destination}</Text>
                      <Text style={styles.resDates}>{res.startDate} a {res.endDate}</Text>
                      <Text style={styles.resPax}>{totalPax} Pasajeros ({res.adultsCount} ad, {res.childrenCount} ch)</Text>
                    </View>
                    <View style={styles.resMeta}>
                      <Text style={styles.resCode}>{res.id}</Text>
                      <Text style={styles.resDate}>{res.date}</Text>
                    </View>
                  </View>

                  <View style={styles.resDivider} />

                  <View style={styles.resPriceRow}>
                    <View>
                      <Text style={styles.priceLabel}>Total Pagado:</Text>
                      <Text style={styles.priceValue}>
                        {res.currency === 'ARS' ? '$' : res.currency === 'USD' ? 'U$S' : '€'}{' '}
                        {res.convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {res.currency}
                      </Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.printBtn} onPress={() => handlePrintPDF(res)}>
                        <IconSymbol size={18} name="printer.fill" color="#fff" />
                        <Text style={styles.printBtnText}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.expandBtn} onPress={() => toggleExpand(res.id)}>
                        <IconSymbol size={18} name={isExpanded ? 'chevron.down' : 'chevron.right'} color={Theme.colors.primary} />
                        <Text style={styles.expandBtnText}>{isExpanded ? 'Ocultar' : 'Detalles'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsTitle}>Itinerario Detallado</Text>
                      {Object.keys(dayGroups).sort((a,b) => Number(a)-Number(b)).map((dayStr) => {
                        const day = Number(dayStr);
                        const items = dayGroups[day];
                        return (
                          <View key={day} style={styles.detailDayGroup}>
                            <View style={styles.detailDayHeader}>
                              <Text style={styles.detailDayTitle}>Día {day}</Text>
                              <View style={styles.detailDayLine} />
                            </View>
                            {items.map((item, idx) => (
                              <View key={idx} style={styles.detailItemRow}>
                                <IconSymbol 
                                  size={16} 
                                  name={item.type === 'Accommodation' ? 'bed.double.fill' : item.type === 'Meal' ? 'fork.knife' : 'figure.walk'} 
                                  color={Theme.colors.primary} 
                                  style={{ marginRight: 8 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.detailItemName}>{item.name}</Text>
                                  <Text style={styles.detailItemType}>{item.type === 'Accommodation' ? 'Alojamiento' : item.type === 'Meal' ? 'Comida' : 'Actividad'}</Text>
                                </View>
                                <Text style={styles.detailItemPrice}>${(item.price * totalPax).toLocaleString()} ARS</Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                      <View style={styles.paymentMethodBox}>
                        <Text style={styles.paymentMethodLabel}>Método de Pago:</Text>
                        <Text style={styles.paymentMethodValue}>
                          {res.paymentMethod === 'Tarjeta' ? `Tarjeta (${res.cardName || 'N/A'})` : `Efectivo en ${res.currency}`}
                        </Text>
                      </View>
                    </View>
                  )}
                </BlurView>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { padding: 24, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textMain },
  subtitle: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 130 },
  emptyCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    marginTop: 20,
  },
  emptyText: {
    color: Theme.colors.textMain,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  resCard: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  resCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resDestImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  resMainInfo: {
    flex: 1,
  },
  resDestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
  },
  resDates: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  resPax: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  resMeta: {
    alignItems: 'flex-end',
  },
  resCode: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resDate: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 6,
  },
  resDivider: {
    height: 1,
    backgroundColor: Theme.colors.borderDark,
    marginVertical: 14,
  },
  resPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  printBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Theme.colors.borderDark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  expandBtnText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(105,124,178,0.1)',
    paddingTop: 16,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailDayGroup: {
    marginBottom: 12,
  },
  detailDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailDayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginRight: 8,
  },
  detailDayLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(105,124,178,0.1)',
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 8,
  },
  detailItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  detailItemType: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  detailItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
  },
  paymentMethodBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  paymentMethodLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  paymentMethodValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textMain,
  },
});
