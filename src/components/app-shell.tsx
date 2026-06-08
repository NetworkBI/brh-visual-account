import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import homeBg from "@/assets/home-bg.jpg";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BackToTop } from "@/components/back-to-top";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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

  const isHome = pathname === "/home";

  const background = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-[0.06] dark:opacity-[0.15]"
        style={{ backgroundImage: `url(${homeBg})` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/40"
      />
    </>
  );

  if (isHome) {
    return (
      <div className="relative flex min-h-screen w-full flex-col">
        {background}
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
        <BackToTop />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      {background}
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 min-w-0 p-6 lg:p-8">{children ?? <Outlet />}</main>
        </div>
      </SidebarProvider>
      <BackToTop />
    </div>
  );
}
