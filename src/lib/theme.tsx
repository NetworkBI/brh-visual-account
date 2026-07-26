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

// Fallback configuration if the YAML fetch fails or before it loads
const DEFAULT_THEME_CONFIG: any = {
  fonts: {
    sans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    display: '"Outfit", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  layout: {
    radius: "0.5rem",
  },
  modes: {
    claro: {
      background: "oklch(0.96 0.003 250)",
      foreground: "oklch(0.16 0.01 250)",
      primary: "oklch(0.24 0.01 250)",
      "primary-glow": "oklch(0.38 0.02 250)",
      secondary: "oklch(0.40 0.01 250)",
      "secondary-foreground": "oklch(0.99 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.16 0.01 250)",
      muted: "oklch(0.92 0.004 250)",
      "muted-foreground": "oklch(0.42 0.01 250)",
      accent: "oklch(0.90 0.005 250)",
      "accent-foreground": "oklch(0.20 0.01 250)",
      border: "oklch(0.86 0.005 250)",
      input: "oklch(0.90 0.005 250)",
      ring: "oklch(0.24 0.01 250)",
      sidebar: "oklch(1 0 0)",
      "sidebar-foreground": "oklch(0.20 0.01 250)",
      "sidebar-border": "oklch(0.88 0.005 250)",
      "sidebar-header-bg": "linear-gradient(to bottom, #7a1418, #3a0a0c)",
      "sidebar-header-fg": "#ffffff",
    },
    escuro: {
      background: "oklch(0.13 0.008 250)",
      foreground: "oklch(0.98 0 0)",
      primary: "oklch(0.88 0.005 250)",
      "primary-glow": "oklch(0.94 0.005 250)",
      secondary: "oklch(0.28 0.008 250)",
      "secondary-foreground": "oklch(0.98 0 0)",
      card: "oklch(0.20 0.008 250)",
      "card-foreground": "oklch(0.98 0 0)",
      muted: "oklch(0.26 0.008 250)",
      "muted-foreground": "oklch(0.76 0.005 250)",
      accent: "oklch(0.30 0.01 250)",
      "accent-foreground": "oklch(0.98 0 0)",
      border: "oklch(1 0 0 / 14%)",
      input: "oklch(1 0 0 / 18%)",
      ring: "oklch(0.88 0.005 250)",
      sidebar: "oklch(0.16 0.008 250)",
      "sidebar-foreground": "oklch(0.96 0 0)",
      "sidebar-border": "oklch(1 0 0 / 12%)",
      "sidebar-header-bg": "oklch(0.16 0.008 250)",
      "sidebar-header-fg": "oklch(0.96 0 0)",
    },
    alternativo: {
      background: "oklch(0.96 0.035 30)",
      foreground: "oklch(0.18 0.03 25)",
      primary: "oklch(0.48 0.22 28)",
      "primary-glow": "oklch(0.62 0.24 32)",
      secondary: "oklch(0.40 0.08 25)",
      "secondary-foreground": "oklch(0.99 0 0)",
      card: "oklch(0.995 0.012 30)",
      "card-foreground": "oklch(0.18 0.03 25)",
      muted: "oklch(0.92 0.04 28)",
      "muted-foreground": "oklch(0.42 0.05 25)",
      accent: "oklch(0.88 0.10 28)",
      "accent-foreground": "oklch(0.25 0.10 25)",
      border: "oklch(0.82 0.06 28)",
      input: "oklch(0.86 0.05 28)",
      ring: "oklch(0.48 0.22 28)",
      sidebar: "oklch(0.94 0.05 28)",
      "sidebar-foreground: ": "oklch(0.18 0.03 25)",
      "sidebar-border": "oklch(0.82 0.06 28)",
      "sidebar-header-bg": "linear-gradient(to bottom, #7a1418, #3a0a0c)",
      "sidebar-header-fg": "#ffffff",
    },
  },
};

// Simple YAML parser helper
function parseSimpleYaml(yamlText: string): any {
  const result: any = {};
  const lines = yamlText.split("\n");
  let currentParent: string | null = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const parts = trimmed.split(":");
    const key = parts[0].trim();
    const val = parts.slice(1).join(":").trim();

    if (indent === 0) {
      if (val === "") {
        currentParent = key;
        result[currentParent] = {};
      } else {
        currentParent = null;
        result[key] = val.replace(/^["']|["']$/g, "");
      }
    } else if (indent > 0 && currentParent) {
      result[currentParent][key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

interface CtxType {
  mode: Mode;
  setMode: (m: Mode) => void;
  config: any;
}

const ThemeCtx = createContext<CtxType>({
  mode: "claro",
  setMode: () => {},
  config: DEFAULT_THEME_CONFIG,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("claro");
  const [config, setConfig] = useState<any>(DEFAULT_THEME_CONFIG);

  // 1. Fetch YAML config once at startup
  useEffect(() => {
    fetch("/theme.config.yaml")
      .then((res) => res.text())
      .then((text) => {
        try {
          const parsed = parseSimpleYaml(text);
          if (parsed && parsed.modes) {
            setConfig(parsed);
          }
        } catch (e) {
          console.error("Failed to parse theme.config.yaml, using defaults", e);
        }
      })
      .catch((err) => console.error("Failed to load theme.config.yaml", err));

    const stored = localStorage.getItem("theme_mode") as Mode | null;
    if (stored === "claro" || stored === "escuro" || stored === "alternativo") {
      setModeState(stored);
    }
  }, []);

  // 2. Apply configuration properties to CSS variables on theme mode or config change
  useEffect(() => {
    const root = document.documentElement;
    const activeVariables = config.modes[mode] || DEFAULT_THEME_CONFIG.modes[mode];

    // Toggle dark class for Tailwind dark variant support
    root.classList.toggle("dark", mode === "escuro");

    // Apply all color variables dynamically
    Object.entries(activeVariables).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val as string);
    });

    // Apply global typography/layout variables
    const activeFonts = config.fonts || DEFAULT_THEME_CONFIG.fonts;
    const activeLayout = config.layout || DEFAULT_THEME_CONFIG.layout;

    if (activeFonts.sans) root.style.setProperty("--font-sans", activeFonts.sans);
    if (activeFonts.display) root.style.setProperty("--font-display", activeFonts.display);
    if (activeLayout.radius) root.style.setProperty("--radius", activeLayout.radius);

    localStorage.setItem("theme_mode", mode);
  }, [mode, config]);

  return (
    <ThemeCtx.Provider value={{ mode, setMode: setModeState, config }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
