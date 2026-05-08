import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { LayoutDashboard, FileText, Building2, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/prestacoes", label: "Prestações", icon: FileText },
  { to: "/condominios", label: "Condomínios", icon: Building2 },
  { to: "/historico", label: "Histórico", icon: History },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Grupo BR Hunter" className="h-10 w-auto" />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-sm font-bold text-primary">BR HUNTER</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Prestação de Contas</span>
            </div>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                activeProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold bg-accent text-primary" }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => { signOut().then(() => navigate({ to: "/login" })); }}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
              activeProps={{ className: "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold bg-accent text-primary" }}
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
