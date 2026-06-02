import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Palette = "padrao" | "brasa" | "grafite";

const ORDER: Palette[] = ["padrao", "brasa", "grafite"];

const LABELS: Record<Palette, string> = {
  padrao: "Identidade BR Hunter",
  brasa: "Brasa — vermelho dominante",
  grafite: "Grafite — cinza dominante",
};

interface Ctx {
  palette: Palette;
  setPalette: (p: Palette) => void;
  next: () => void;
  label: string;
}

const PaletteCtx = createContext<Ctx>({
  palette: "padrao",
  setPalette: () => {},
  next: () => {},
  label: LABELS.padrao,
});

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>("padrao");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("palette")) as Palette | null;
    if (stored && ORDER.includes(stored)) setPaletteState(stored);
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
