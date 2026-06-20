"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeDir = "a" | "b" | "c" | "d";

export const THEMES: { dir: ThemeDir; name: string; accent: string }[] = [
  { dir: "d", name: "Orange", accent: "#ff7900" },
  { dir: "a", name: "Atrament", accent: "#4f46e5" },
  { dir: "b", name: "Hĺbka", accent: "#0d9488" },
  { dir: "c", name: "Grafit", accent: "#1c1917" },
];

const STORAGE_KEY = "of_theme";
const DEFAULT_THEME: ThemeDir = "d";

interface ThemeContextValue {
  theme: ThemeDir;
  setTheme: (dir: ThemeDir) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeDir>(DEFAULT_THEME);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeDir | null;
    if (stored && ["a", "b", "c", "d"].includes(stored)) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-dir", stored);
    }
  }, []);

  const setTheme = (dir: ThemeDir) => {
    setThemeState(dir);
    localStorage.setItem(STORAGE_KEY, dir);
    document.documentElement.setAttribute("data-dir", dir);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
