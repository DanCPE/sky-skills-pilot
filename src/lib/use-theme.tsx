"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Time-based theme detection
// Day mode: 6 AM - 6 PM (06:00 - 18:00)
// Night mode: 6 PM - 6 AM (18:00 - 06:00)
function getThemeByTime(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  useEffect(() => {
    // Check if user has manually set theme (saved theme exists)
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const autoModeSaved = localStorage.getItem("themeAutoMode");

    // Determine initial theme
    let initialTheme: Theme;
    let shouldUseAuto = true;

    if (savedTheme && autoModeSaved === "false") {
      // User manually set theme, use it
      initialTheme = savedTheme;
      shouldUseAuto = false;
    } else {
      // Auto mode: use time-based detection
      initialTheme = getThemeByTime();
      shouldUseAuto = true;
    }

    setTheme(initialTheme); // biome-ignore react-hooks/set-state-in-effect: Required for theme initialization
    setAutoMode(shouldUseAuto);
    setIsInitialized(true);
  }, []);

  // Check time every minute and update theme if in auto mode
  useEffect(() => {
    if (!isInitialized || !autoMode) return;

    const checkInterval = setInterval(() => {
      const timeBasedTheme = getThemeByTime();
      setTheme((currentTheme) => {
        // Only update if different
        if (timeBasedTheme !== currentTheme) {
          return timeBasedTheme;
        }
        return currentTheme;
      });
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [isInitialized, autoMode]);

  useEffect(() => {
    if (!isInitialized) return;

    // Apply theme to html element (where Tailwind looks for it)
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
    localStorage.setItem("themeAutoMode", autoMode.toString());
  }, [theme, isInitialized, autoMode]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      // Manual toggle disables auto mode
      setAutoMode(false);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
