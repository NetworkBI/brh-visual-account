import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Palette = "brasa" | "carvao";

const Ctx = createContext<{ palette: Palette; setPalette: (p: Palette) => void; toggle: () => void }>({
  palette: "brasa",
  setPalette: () => {},
  toggle: () => {},
});

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>("brasa");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("palette")) as Palette | null;
    if (stored === "brasa" || stored === "carvao") setPaletteState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
    localStorage.setItem("palette", palette);
  }, [palette]);

  return (
    <Ctx.Provider
      value={{
        palette,
        setPalette: setPaletteState,
        toggle: () => setPaletteState((p) => (p === "brasa" ? "carvao" : "brasa")),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const usePalette = () => useContext(Ctx);
