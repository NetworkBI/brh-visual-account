import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "claro" | "escuro" | "alternativo";

export interface ThemeModeInfo {
  key: Mode;
  label: string;
}

export const THEME_MODES: ThemeModeInfo[] = [
  { key: "claro", label: "Modo Claro" },
  { key: "escuro", label: "Modo Escuro" },
  { key: "alternativo", label: "Modo Alternativo" },
];

interface CtxType {
  mode: Mode;
  setMode: (m: Mode) => void;
}

const ThemeCtx = createContext<CtxType>({
  mode: "claro",
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("claro");

  // Restore from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem("theme_mode") as Mode | null;
    if (stored === "claro" || stored === "escuro" || stored === "alternativo") {
      setModeState(stored);
    }
  }, []);

  // Apply mode: set data-mode attribute on <html> and toggle .dark class for Tailwind
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mode", mode);
    // .dark enables Tailwind's dark: variant — only active in escuro mode
    root.classList.toggle("dark", mode === "escuro");
    localStorage.setItem("theme_mode", mode);
  }, [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, setMode: setModeState }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
