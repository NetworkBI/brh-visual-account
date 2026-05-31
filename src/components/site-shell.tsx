import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SettingsFab } from "@/components/settings-fab";
import homeBg from "@/assets/home-bg.jpg";

export function SiteShell({
  children,
  showHeader = true,
  showHeaderLinks = true,
}: {
  children?: React.ReactNode;
  showHeader?: boolean;
  showHeaderLinks?: boolean;
}) {
  const { user, loading } = useAuth();
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
    <div className="relative min-h-screen w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-[0.06] dark:opacity-[0.15]"
        style={{ backgroundImage: `url(${homeBg})` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/40"
      />
      {showHeader && <SiteHeader showLinks={showHeaderLinks} />}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children ?? <Outlet />}
      </main>
      <SettingsFab />
    </div>
  );
}
