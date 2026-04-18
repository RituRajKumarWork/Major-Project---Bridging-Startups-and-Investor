'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getToken, getUser, setAuth, clearAuth } from '@/lib/auth';
import api, { getErrorMessage } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'founder' | 'investor') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const userData = getUser();

    if (token && userData) {
      // Verify token is still valid
      api.get('/api/auth/me')
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      setAuth(token, userData);
      setUser(userData);
    } catch (error) {
      // Re-throw with proper error message for the component to handle
      throw new Error(getErrorMessage(error));
    }
  };

  const register = async (email: string, password: string, role: 'founder' | 'investor') => {
    try {
      const response = await api.post('/api/auth/register', { email, password, role });
      const { token, user: userData } = response.data;
      setAuth(token, userData);
      setUser(userData);
    } catch (error) {
      // Re-throw with proper error message for the component to handle
      throw new Error(getErrorMessage(error));
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

