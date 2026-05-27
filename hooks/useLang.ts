'use client';

import { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react';
import { Lang } from '@/lib/translations';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'ru' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const toggleLang = () => setLang(lang === 'en' ? 'ru' : 'en');

  return createElement(LangContext.Provider, { value: { lang, setLang, toggleLang } }, children);
}

export function useLang() {
  return useContext(LangContext);
}
