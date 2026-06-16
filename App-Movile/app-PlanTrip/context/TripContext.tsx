import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface TripParams {
  destination: string;
  maxBudget: number;
  startDate: string;
  endDate: string;
  adultsCount: number;
  childrenCount: number;
}

export interface ItineraryItem {
  type: 'Accommodation' | 'Activity' | 'Transport' | 'Promotion' | 'Meal';
  name: string;
  price: number;
  details?: string;
  day?: number;
}

export interface Reservation {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  adultsCount: number;
  childrenCount: number;
  totalPriceARS: number;
  paymentMethod: string;
  currency: string;
  convertedPrice: number;
  cardName?: string;
  clubName?: string;
  items: ItineraryItem[];
  date: string;
}

interface TripContextType {
  tripParams: TripParams;
  setTripParams: React.Dispatch<React.SetStateAction<TripParams>>;
  itinerary: ItineraryItem[];
  setItinerary: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  pendingItems: ItineraryItem[];
  addPendingItem: (item: ItineraryItem) => void;
  addPendingItems: (items: ItineraryItem[]) => void;
  removePendingItem: (index: number) => void;
  clearPending: () => void;
  clearPendingAccommodations: () => void;
  finalizeTrip: () => void;
  reservations: Reservation[];
  addReservation: (res: Reservation) => void;
}

const defaultParams: TripParams = {
  destination: '',
  maxBudget: 0,
  startDate: '',
  endDate: '',
  adultsCount: 1,
  childrenCount: 0,
};

export const TripContext = createContext<TripContextType>({
  tripParams: defaultParams,
  setTripParams: () => {},
  itinerary: [],
  setItinerary: () => {},
  pendingItems: [],
  addPendingItem: () => {},
  addPendingItems: () => {},
  removePendingItem: () => {},
  clearPending: () => {},
  clearPendingAccommodations: () => {},
  finalizeTrip: () => {},
  reservations: [],
  addReservation: () => {},
});

export const TripProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [tripParams, setTripParams] = useState<TripParams>(defaultParams);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [pendingItems, setPendingItems] = useState<ItineraryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const username = user?.username || 'guest';
      const stored = window.localStorage.getItem(`plantrip_reservations_${username}`);
      setReservations(stored ? JSON.parse(stored) : []);
    } else {
      setReservations([]);
    }
  }, [user]);

  const addPendingItem = useCallback((item: ItineraryItem) => {
    setPendingItems(prev => [...prev, item]);
  }, []);

  const addPendingItems = useCallback((items: ItineraryItem[]) => {
    setPendingItems(prev => [...prev, ...items]);
  }, []);

  const removePendingItem = useCallback((index: number) => {
    setPendingItems(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  const clearPending = useCallback(() => {
    setPendingItems([]);
  }, []);

  const clearPendingAccommodations = useCallback(() => {
    setPendingItems(prev => prev.filter(item => item.type !== 'Accommodation'));
  }, []);

  const finalizeTrip = useCallback(() => {
    setItinerary(prev => [...prev, ...pendingItems]);
    setPendingItems([]);
  }, [pendingItems]);

  const addReservation = useCallback((res: Reservation) => {
    setReservations(prev => {
      const updated = [...prev, res];
      if (typeof window !== 'undefined' && window.localStorage) {
        const username = user?.username || 'guest';
        window.localStorage.setItem(`plantrip_reservations_${username}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  return (
    <TripContext.Provider value={{
      tripParams, setTripParams,
      itinerary, setItinerary,
      pendingItems, addPendingItem, addPendingItems, removePendingItem, clearPending,
      clearPendingAccommodations, finalizeTrip,
      reservations, addReservation
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
