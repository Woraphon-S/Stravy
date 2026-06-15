import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TranslationKey, translations } from './translations';

export type Language = 'en' | 'th';
type TParams = Record<string, string | number>;

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TParams) => string;
}

const STORAGE_KEY = 'stravy.language';

function detectDefault(): Language {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'th' ? 'th' : 'en';
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

const I18nContext = createContext<I18nState | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectDefault);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (active && (stored === 'en' || stored === 'th')) setLanguageState(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TParams) => {
      const dict: Record<TranslationKey, string> = translations[language];
      const template = dict[key] ?? translations.en[key] ?? key;
      return interpolate(template, params);
    },
    [language],
  );

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
