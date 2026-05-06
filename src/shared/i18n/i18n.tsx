import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  fallbackLanguage,
  Language,
  languageOptions,
  languageStorageKey,
  translations,
} from './translations';

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallbackOrValues?: string | Record<string, string | number>, values?: Record<string, string | number>) => string;
  hasStoredLanguage: boolean;
};

let activeLanguage: Language = fallbackLanguage;

function isLanguage(value: unknown): value is Language {
  return value === 'ru' || value === 'uz' || value === 'en';
}

function interpolate(value: string, values?: Record<string, string | number>) {
  if (!values) {
    return value;
  }

  return Object.entries(values).reduce(
    (result, [key, replacement]) => result.replaceAll(`{{${key}}}`, String(replacement)),
    value,
  );
}

export function translate(key: string, fallbackOrValues?: string | Record<string, string | number>, values?: Record<string, string | number>) {
  const fallback = typeof fallbackOrValues === 'string' ? fallbackOrValues : undefined;
  const interpolationValues = typeof fallbackOrValues === 'object' ? fallbackOrValues : values;
  const raw = translations[activeLanguage]?.[key] ?? translations[fallbackLanguage][key] ?? fallback ?? key;
  return interpolate(raw, interpolationValues);
}

function readStoredLanguage(): { language: Language; hasStoredLanguage: boolean } {
  const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(languageStorageKey);
  return {
    language: isLanguage(stored) ? stored : fallbackLanguage,
    hasStoredLanguage: isLanguage(stored),
  };
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const initial = readStoredLanguage();
  const [language, setLanguageState] = useState<Language>(initial.language);
  const [hasStoredLanguage, setHasStoredLanguage] = useState(initial.hasStoredLanguage);

  useEffect(() => {
    activeLanguage = language;
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    hasStoredLanguage,
    setLanguage: nextLanguage => {
      activeLanguage = nextLanguage;
      window.localStorage.setItem(languageStorageKey, nextLanguage);
      setHasStoredLanguage(true);
      setLanguageState(nextLanguage);
    },
    t: (key, fallbackOrValues, values) => {
      const fallback = typeof fallbackOrValues === 'string' ? fallbackOrValues : undefined;
      const interpolationValues = typeof fallbackOrValues === 'object' ? fallbackOrValues : values;
      const raw = translations[language]?.[key] ?? translations[fallbackLanguage][key] ?? fallback ?? key;
      return interpolate(raw, interpolationValues);
    },
  }), [hasStoredLanguage, language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}

export { languageOptions };
