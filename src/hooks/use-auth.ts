
"use client";

import { useState, useEffect, createContext, useContext, ReactNode, createElement, useCallback } from 'react';
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

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const authData: AuthResponse = JSON.parse(storedUser);
          
          // Verifica a validade do token fazendo uma chamada simples ao backend
          const response = await fetch('https://financial-control-9s01.onrender.com/list-accounts', {
            headers: { 'Authorization': `Bearer ${authData.token}` }
          });

          if (response.status === 401) {
            // Token expirado ou inválido
            logout();
          } else {
            setUser(authData.user);
            setToken(authData.token);
          }
        }
      } catch (error) {
        console.error("Falha ao validar sessão", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [logout]);

  const login = (authResponse: AuthResponse) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authResponse));
    setUser(authResponse.user);
    setToken(authResponse.token);
    router.push('/');
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
