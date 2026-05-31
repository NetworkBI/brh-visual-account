import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/dashboard", label: "Prestação de Contas" },
  { to: "/usuarios", label: "Usuários" },
  { to: "/condominios", label: "Condomínios" },
] as const;

export function SiteHeader({ showLinks = true }: { showLinks?: boolean }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
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
          <nav className="ml-auto flex items-center gap-1 text-sm">
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
      </div>
    </header>
  );
}
