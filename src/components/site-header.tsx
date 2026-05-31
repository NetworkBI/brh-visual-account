import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/dashboard", label: "Prestação de Contas" },
  { to: "/usuarios", label: "Usuários" },
] as const;

function formatDate(d: Date) {
  const s = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SiteHeader({ showLinks = true }: { showLinks?: boolean }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: "var(--gradient-border)" }}
      />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/home" className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="BR Hunter"
            width={640}
            height={640}
            className="h-8 w-8 rounded-md bg-white/95 p-1 object-contain shadow-sm"
          />
          <span className="font-display text-sm font-bold tracking-wide">BR HUNTER</span>
        </Link>
        {showLinks && (
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active =
                currentPath === item.to ||
                (item.to === "/dashboard" && currentPath.startsWith("/prestacoes"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    "rounded-md px-3 py-1.5 font-medium transition-colors " +
                    (active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
        {now && (
          <div className="ml-auto hidden text-right sm:block">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs font-semibold text-foreground/80">{formatDate(now)}</p>
          </div>
        )}
      </div>
    </header>
  );
}
