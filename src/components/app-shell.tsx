import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { usePalette } from "@/lib/palette";
import { Button } from "@/components/ui/button";

import { LogOut, Moon, Sun, Settings, Palette as PaletteIcon } from "lucide-react";
import logo from "@/assets/logo.png";
import homeBg from "@/assets/home-bg.jpg";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { next: nextPalette, label: paletteLabel } = usePalette();
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-[0.06] dark:opacity-[0.15]"
        style={{ backgroundImage: `url(${homeBg})` }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/40" />

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur lg:px-8">
        <Link
          to="/home"
          className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-[#7a1418] to-[#3a0a0c] px-3 py-1.5 shadow-md ring-1 ring-black/10"
        >
          <img
            src={logo}
            alt="BR Hunter"
            width={640}
            height={640}
            className="h-9 w-9 shrink-0 rounded-md bg-white/95 p-1 object-contain"
          />
          <span className="font-display text-sm font-bold tracking-wide text-white hidden sm:inline">
            BR HUNTER
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-xs text-muted-foreground sm:block">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { signOut().then(() => navigate({ to: "/login" })); }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8">{children ?? <Outlet />}</main>

      {/* Speed-dial FAB */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        {/* Sub-actions */}
        <div
          className={cn(
            "flex flex-col items-end gap-3 transition-all duration-200",
            fabOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-sm backdrop-blur">
              {paletteLabel}
            </span>
            <Button
              size="icon"
              variant="default"
              onClick={nextPalette}
              className="h-11 w-11 rounded-full shadow-lg"
              aria-label="Alternar paleta de cores"
              title="Cor alternativa"
            >
              <PaletteIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-sm backdrop-blur">
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </span>
            <Button
              size="icon"
              variant="default"
              onClick={toggle}
              className="h-11 w-11 rounded-full shadow-lg"
              aria-label="Alternar tema"
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <Button
          size="icon"
          variant="default"
          onClick={() => setFabOpen((v) => !v)}
          className={cn(
            "h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform",
            fabOpen && "rotate-90",
          )}
          aria-label="Configurações rápidas"
          aria-expanded={fabOpen}
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
