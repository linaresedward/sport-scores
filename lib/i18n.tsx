"use client";

import {
  useState, useEffect, useCallback,
  createContext, useContext, ReactNode
} from "react";
import { translations } from "@/lib/translations";

export type Lang = "fr" | "en";
export type { TranslationKey } from "@/lib/translations";
export { translations };

const COOKIE_NAME = "lang";

function getLangFromCookie(): Lang {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
  const val = match?.[1];
  return val === "en" ? "en" : "fr";
}

function setLangCookie(l: Lang) {
  document.cookie = `${COOKIE_NAME}=${l};path=/;max-age=31536000`;
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    setLangState(getLangFromCookie());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setLangCookie(l);
    window.location.reload();
  }, []);

  const t = useCallback(
    (key: keyof typeof translations.fr): string =>
      translations[lang][key] ?? translations.fr[key] ?? key,
    [lang]
  );

  return { lang, setLang, t };
}

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof translations.fr) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key) => translations.fr[key] ?? key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const value = useLang();
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  return useContext(LangContext);
}