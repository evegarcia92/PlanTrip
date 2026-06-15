import React, { createContext, useState, useContext, useCallback } from 'react';

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

interface TripContextType {
  tripParams: TripParams;
  setTripParams: React.Dispatch<React.SetStateAction<TripParams>>;
  itinerary: ItineraryItem[];
  setItinerary: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  pendingItems: ItineraryItem[];
  addPendingItem: (item: ItineraryItem) => void;
  addPendingItems: (items: ItineraryItem[]) => void;
  clearPending: () => void;
  finalizeTrip: () => void;
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
  clearPending: () => {},
  finalizeTrip: () => {},
});

export const TripProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [tripParams, setTripParams] = useState<TripParams>(defaultParams);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [pendingItems, setPendingItems] = useState<ItineraryItem[]>([]);

  const addPendingItem = useCallback((item: ItineraryItem) => {
    setPendingItems(prev => [...prev, item]);
  }, []);

  const addPendingItems = useCallback((items: ItineraryItem[]) => {
    setPendingItems(prev => [...prev, ...items]);
  }, []);

  const clearPending = useCallback(() => {
    setPendingItems([]);
  }, []);

  const finalizeTrip = useCallback(() => {
    setItinerary(prev => [...prev, ...pendingItems]);
    setPendingItems([]);
  }, [pendingItems]);

  return (
    <TripContext.Provider value={{
      tripParams, setTripParams,
      itinerary, setItinerary,
      pendingItems, addPendingItem, addPendingItems, clearPending, finalizeTrip
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
