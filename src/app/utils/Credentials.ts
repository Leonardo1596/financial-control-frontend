// /src/utils/Credentials.ts
import { Capacitor } from '@capacitor/core';
import type { PluginResultData } from '@capacitor/core';

declare global {
  interface Window {
    UserPrefs?: {
      saveCredentials: (opts: { userId: string; token: string }) => Promise<void>;
      getCredentials?: () => Promise<{ userId?: string; token?: string }>;
    };
  }
}

/**
 * Salva userId e token no Android usando o plugin nativo
 * para que NotificationListener consiga acessar.
 */
export async function saveUserCredentials(userId: string, token: string) {
  try {
    if (Capacitor.getPlatform() === 'android' && window.UserPrefs?.saveCredentials) {
      await window.UserPrefs.saveCredentials({ userId, token });
      console.log('Credenciais salvas com sucesso no Android');
    } else {
      // fallback para web ou iOS
      localStorage.setItem('USER_ID', userId);
      localStorage.setItem('TOKEN', token);
      console.log('Credenciais salvas no localStorage (não-Android)');
    }
  } catch (err) {
    console.error('Erro ao salvar credenciais:', err);
  }
}

/**
 * Lê as credenciais salvas
 */
export async function getUserCredentials(): Promise<{ userId: string | null; token: string | null }> {
  try {
    if (Capacitor.getPlatform() === 'android' && window.UserPrefs?.getCredentials) {
      const result: PluginResultData | undefined = await window.UserPrefs.getCredentials();
      return {
        userId: result?.userId ?? null,
        token: result?.token ?? null,
      };
    } else {
      return {
        userId: localStorage.getItem('USER_ID'),
        token: localStorage.getItem('TOKEN'),
      };
    }
  } catch (err) {
    console.error('Erro ao ler credenciais:', err);
    return { userId: null, token: null };
  }
}