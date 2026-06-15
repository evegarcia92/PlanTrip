import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false, error: 'Contexto no inicializado' }),
  register: async () => ({ success: false, error: 'Contexto no inicializado' }),
  logout: () => {},
  clearError: () => {},
});

const USERS_KEY = 'plantrip_users';

interface StoredUser {
  id: number;
  username: string;
  password: string;
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

function getUsers(): StoredUser[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const data = storage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
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
    setLoading(false);
  }, []);

  const setSession = (userData: AuthUser) => {
    setUser(userData);
    setError(null);
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
      setSession({ id: found.id, username: found.username });
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
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
