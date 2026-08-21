import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme =
  | "light"
  | "dark"
  | "emerald"
  | "cyber-blue"
  | "sunset-amber"
  | "electric-violet"
  | "nordic-slate"
  | "crimson-rose"
  | "forest-green"
  | "coffee-warm";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEMES: { id: Theme; name: string; icon: string; bgPreview: string }[] = [
  { id: "light", name: "Classic Light", icon: "☀️", bgPreview: "bg-slate-100 border-slate-300" },
  { id: "dark", name: "Midnight Dark", icon: "🌙", bgPreview: "bg-slate-900 border-slate-700" },
  { id: "emerald", name: "Emerald Mint", icon: "🌿", bgPreview: "bg-emerald-800 border-emerald-500" },
  { id: "cyber-blue", name: "Cyber Neon", icon: "⚡", bgPreview: "bg-blue-950 border-cyan-400" },
  { id: "sunset-amber", name: "Sunset Amber", icon: "🌅", bgPreview: "bg-amber-950 border-orange-500" },
  { id: "electric-violet", name: "Electric Violet", icon: "🔮", bgPreview: "bg-purple-950 border-pink-500" },
  { id: "nordic-slate", name: "Nordic Slate", icon: "🏔️", bgPreview: "bg-slate-800 border-indigo-400" },
  { id: "crimson-rose", name: "Crimson Rose", icon: "🌹", bgPreview: "bg-rose-950 border-rose-500" },
  { id: "forest-green", name: "Deep Forest", icon: "🌲", bgPreview: "bg-green-950 border-lime-500" },
  { id: "coffee-warm", name: "Warm Coffee", icon: "☕", bgPreview: "bg-amber-900 border-yellow-600" },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("app-theme") as Theme) || "cyber-blue";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
