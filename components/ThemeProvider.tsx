"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeName = "light" | "dark" | "mta-light" | "mta-dark";

type ThemeContextValue = {
  theme: ThemeName;
  themes: { value: ThemeName; label: string; description: string }[];
  setTheme: (value: ThemeName) => void;
};

const THEME_STORAGE_KEY = "ace-dashboard-theme";

const THEME_OPTIONS: ThemeContextValue["themes"] = [
  { value: "light", label: "Light", description: "Neutral, high-readability palette" },
  { value: "dark", label: "Dark", description: "Low-light optimized contrast" },
  { value: "mta-light", label: "MTA Light", description: "MTA blue accents on bright canvas" },
  { value: "mta-dark", label: "MTA Night", description: "Midnight blue focus with amber cues" },
];

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
  if (stored && THEME_OPTIONS.some((option) => option.value === stored)) {
    return stored;
  }
  return null;
}

function getPreferredTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  const stored = getStoredTheme();
  if (stored) return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "theme-mta", "theme-mta-dark");

  switch (theme) {
    case "light":
      break;
    case "dark":
      root.classList.add("dark");
      break;
    case "mta-light":
      root.classList.add("theme-mta");
      break;
    case "mta-dark":
      root.classList.add("theme-mta", "theme-mta-dark", "dark");
      break;
  }

  root.dataset.theme = theme;
  root.style.colorScheme = theme === "dark" || theme === "mta-dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => getPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const stored = getStoredTheme();
      if (!stored) {
        setThemeState(mediaQuery.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        const value = event.newValue as ThemeName;
        if (THEME_OPTIONS.some((option) => option.value === value)) {
          setThemeState(value);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themes: THEME_OPTIONS,
      setTheme: (next) => {
        setThemeState(next);
        applyTheme(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        }
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSelector() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeSelector must be used within a ThemeProvider");
  }
  return context;
}

export const themeOptions = THEME_OPTIONS;
