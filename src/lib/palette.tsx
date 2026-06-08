import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Palette = "grafite" | "brasa" | "classica";

const ORDER: Palette[] = ["grafite", "brasa", "classica"];

const LABELS: Record<Palette, string> = {
  grafite: "Cores Alternativas — Grafite",
  brasa: "Cores Alternativas — Brasa",
  classica: "Cores Alternativas — Clássica",
};

interface Ctx {
  palette: Palette;
  setPalette: (p: Palette) => void;
  next: () => void;
  label: string;
}

const PaletteCtx = createContext<Ctx>({
  palette: "grafite",
  setPalette: () => {},
  next: () => {},
  label: LABELS.grafite,
});

function normalize(raw: string | null): Palette | null {
  if (!raw) return null;
  if (raw === "padrao") return "classica";
  if ((ORDER as string[]).includes(raw)) return raw as Palette;
  return null;
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>("grafite");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("palette") : null;
    const normalized = normalize(stored);
    if (normalized) setPaletteState(normalized);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
    localStorage.setItem("palette", palette);
  }, [palette]);

  const next = () => {
    const idx = ORDER.indexOf(palette);
    setPaletteState(ORDER[(idx + 1) % ORDER.length]);
  };

  return (
    <PaletteCtx.Provider value={{ palette, setPalette: setPaletteState, next, label: LABELS[palette] }}>
      {children}
    </PaletteCtx.Provider>
  );
}

export const usePalette = () => useContext(PaletteCtx);
