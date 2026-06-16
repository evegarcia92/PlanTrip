import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface AuthUser {
  id: number;
  username: string;
  gender?: string;
  image?: string;
  birthdate?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (gender: string, image: string, birthdate: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false, error: 'Contexto no inicializado' }),
  register: async () => ({ success: false, error: 'Contexto no inicializado' }),
  logout: () => {},
  clearError: () => {},
  updateProfile: async () => ({ success: false, error: 'Contexto no inicializado' }),
});

const USERS_KEY = 'plantrip_users';
const ACTIVE_USER_KEY = 'plantrip_active_user';

interface StoredUser {
  id: number;
  username: string;
  password: string;
  gender?: string;
  image?: string;
  birthdate?: string;
}

function getStorage(): Storage | null {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

function preloadDemoReservationForPrueba() {
  try {
    const storage = getStorage();
    if (!storage) return;
    const key = 'plantrip_reservations_prueba';
    if (!storage.getItem(key)) {
      const demoRes = {
        id: 'RES-DEMO7',
        destination: 'Mendoza',
        startDate: '20/06/2026',
        endDate: '23/06/2026',
        adultsCount: 2,
        childrenCount: 0,
        totalPriceARS: 1620000,
        paymentMethod: 'Tarjeta',
        currency: 'ARS',
        convertedPrice: 1620000,
        cardName: 'Banco Galicia',
        date: '15/06/2026',
        items: [
          {
            type: 'Accommodation',
            name: 'Sheraton Mendoza',
            price: 180000,
            details: 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento',
            day: 1
          },
          {
            type: 'Accommodation',
            name: 'Sheraton Mendoza',
            price: 180000,
            details: 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento',
            day: 2
          },
          {
            type: 'Accommodation',
            name: 'Sheraton Mendoza',
            price: 180000,
            details: 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento',
            day: 3
          },
          {
            type: 'Accommodation',
            name: 'Sheraton Mendoza',
            price: 180000,
            details: 'WiFi, Spa, Piscina, Gimnasio, Restaurante, Estacionamiento',
            day: 4
          },
          {
            type: 'Meal',
            name: 'Restaurante 1884',
            price: 35000,
            details: 'WiFi, Aire acondicionado, Terraza, Estacionamiento, Bodega',
            day: 1
          },
          {
            type: 'Meal',
            name: 'Azafrán',
            price: 32000,
            details: 'WiFi, Aire acondicionado, Terraza, Acceso discapacitados',
            day: 2
          },
          {
            type: 'Meal',
            name: 'Pan & Oliva',
            price: 18000,
            details: 'WiFi, Aire acondicionado, Terraza',
            day: 3
          },
          {
            type: 'Meal',
            name: 'El Barrio',
            price: 15000,
            details: 'WiFi, Aire acondicionado, Música en vivo, Bar',
            day: 4
          },
          {
            type: 'Activity',
            name: 'Ruta del Vino',
            price: 45000,
            details: 'Adultos, Gastronomía',
            day: 2
          },
          {
            type: 'Activity',
            name: 'Termas de Cacheuta',
            price: 15000,
            details: 'Todos, Relax',
            day: 3
          },
          {
            type: 'Activity',
            name: 'Rafting Río Mendoza',
            price: 20000,
            details: 'Adultos, Aventura',
            day: 4
          }
        ]
      };
      storage.setItem(key, JSON.stringify([demoRes]));
    }
  } catch (e) {
    console.error('Error preloading demo reservation:', e);
  }
}

function ensurePruebaUserExists(users: StoredUser[]): StoredUser[] {
  const found = users.find(u => u.username === 'prueba');
  if (!found) {
    const pruebaUser: StoredUser = {
      id: 123456789,
      username: 'prueba',
      password: '123456',
      gender: 'Masculino',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      birthdate: '20/10/1995'
    };
    const updated = [...users, pruebaUser];
    saveUsers(updated);
    preloadDemoReservationForPrueba();
    return updated;
  }
  return users;
}

function getUsers(): StoredUser[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const data = storage.getItem(USERS_KEY);
    const users = data ? JSON.parse(data) : [];
    return ensurePruebaUserExists(users);
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Storage might be full or unavailable
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storage = getStorage();
      if (storage) {
        const active = storage.getItem(ACTIVE_USER_KEY);
        if (active) {
          setUser(JSON.parse(active));
        }
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
    setLoading(false);
  }, []);

  const setSession = (userData: AuthUser) => {
    setUser(userData);
    setError(null);
    try {
      const storage = getStorage();
      if (storage) {
        storage.setItem(ACTIVE_USER_KEY, JSON.stringify(userData));
      }
    } catch {}
  };

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const users = getUsers();
      const found = users.find((u) => u.username === username);
      if (!found) {
        setError('Usuario no encontrado');
        return { success: false, error: 'Usuario no encontrado' };
      }
      if (found.password !== password) {
        setError('Contraseña incorrecta');
        return { success: false, error: 'Contraseña incorrecta' };
      }
      setSession({
        id: found.id,
        username: found.username,
        gender: found.gender,
        image: found.image,
        birthdate: found.birthdate,
      });
      return { success: true };
    } catch {
      setError('Error al iniciar sesión');
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const users = getUsers();
      if (users.find((u) => u.username === username)) {
        setError('El usuario ya existe');
        return { success: false, error: 'El usuario ya existe' };
      }
      const newUser: StoredUser = {
        id: Date.now(),
        username,
        password,
      };
      saveUsers([...users, newUser]);
      setSession({ id: newUser.id, username: newUser.username });
      return { success: true };
    } catch {
      setError('Error al registrar usuario');
      return { success: false, error: 'Error al registrar usuario' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    try {
      const storage = getStorage();
      if (storage) {
        storage.removeItem(ACTIVE_USER_KEY);
      }
    } catch {}
  }, []);

  const updateProfile = useCallback(async (gender: string, image: string, birthdate: string) => {
    if (!user) {
      setError('No hay usuario autenticado');
      return { success: false, error: 'No hay usuario autenticado' };
    }
    try {
      const users = getUsers();
      const updatedUsers = users.map((u) => {
        if (u.id === user.id) {
          return { ...u, gender, image, birthdate };
        }
        return u;
      });
      saveUsers(updatedUsers);

      const updatedUser = { ...user, gender, image, birthdate };
      setUser(updatedUser);

      const storage = getStorage();
      if (storage) {
        storage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));
      }
      return { success: true };
    } catch {
      setError('Error al actualizar el perfil');
      return { success: false, error: 'Error al actualizar el perfil' };
    }
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
