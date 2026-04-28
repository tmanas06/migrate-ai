"use client";
// ============================================================
// ThemeProvider – Manages UI color palettes
// ============================================================
import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = "midnight" | "emerald" | "ivory" | "bordeaux";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("midnight");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("migrate-ai-theme") as ThemeType;
    if (savedTheme && ["midnight", "emerald", "ivory", "bordeaux"].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("migrate-ai-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Sync data-theme attribute on mount and state change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
