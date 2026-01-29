"use client";

import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthResponse, User } from '@/lib/types';

const USER_STORAGE_KEY = 'fintrack_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const { user: userData, token: userToken }: AuthResponse = JSON.parse(storedUser);
        setUser(userData);
        setToken(userToken);
      }
    } catch (error) {
      console.error("Falha ao analisar dados do usuário do localStorage", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (authResponse: AuthResponse) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authResponse));
    setUser(authResponse.user);
    setToken(authResponse.token);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const value = { user, token, login, logout, loading };

  return createElement(AuthContext.Provider, { value: value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}
