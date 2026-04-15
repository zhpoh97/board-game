import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, Lang, TranslationKey } from './translations';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return saved === 'zh' ? 'zh' : 'en';
  });

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => {
    let text: string = translations[lang][key] || translations['en'][key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
