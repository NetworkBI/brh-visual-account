import { useNavigate } from "@tanstack/react-router";
import { Settings, Moon, Sun, Palette as PaletteIcon, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/lib/theme";
import { usePalette } from "@/lib/palette";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export function SettingsFab() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { palette, toggle: togglePalette } = usePalette();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Permitir abrir o popover via evento customizado (ex.: card "Configurações" da Home)
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("open-settings", h);
    return () => window.removeEventListener("open-settings", h);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Configurações"
          title="Configurações"
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border/40 bg-foreground/5 text-muted-foreground backdrop-blur-md transition hover:bg-foreground/10 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className="w-60 p-1.5"
      >
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="flex-1 text-left">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
        </button>
        <button
          type="button"
          onClick={togglePalette}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <PaletteIcon className="h-4 w-4" />
          <span className="flex-1 text-left">Cor alternativa</span>
          <span
            aria-hidden="true"
            className="h-4 w-7 rounded-full ring-1 ring-border/70"
            style={{ background: "var(--gradient-primary)" }}
          />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {palette === "brasa" ? "Brasa" : "Carvão"}
          </span>
        </button>

        <div className="my-1 h-px bg-border/60" />
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="flex-1 text-left">Sair</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
