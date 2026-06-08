import { Link, useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Users, Moon, Sun, Palette as PaletteIcon, ArrowLeft, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";
import { useAuth, useUserRole, canManageUsers } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { usePalette } from "@/lib/palette";

const NAV_BASE = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/usuarios", label: "Usuários", icon: Users, requiresManage: true },
] as const;

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { data: role } = useUserRole();
  const { theme, toggle } = useTheme();
  const { next: nextPalette, label: paletteLabel } = usePalette();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const NAV = NAV_BASE.filter(
    (i) => !("requiresManage" in i && i.requiresManage) || canManageUsers(role),
  );

  const handleVoltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/home" });
    }
  };

  const handleSair = () => {
    signOut().then(() => navigate({ to: "/login" }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-[8px_0_24px_-12px_rgba(0,0,0,0.35)]">
      <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-b from-[#7a1418] to-[#3a0a0c] p-3">
        <div className="flex items-center gap-2">
          <Link to="/home" className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src={logo}
              alt="BR Hunter"
              width={640}
              height={640}
              className="h-9 w-9 shrink-0 rounded-md bg-white/95 p-1 shadow-md object-contain"
            />
            <span className="font-display text-sm font-bold tracking-wide text-white truncate group-data-[collapsible=icon]:hidden">
              BR HUNTER
            </span>
          </Link>
          <SidebarTrigger
            className="h-8 w-8 shrink-0 text-white hover:bg-white/15 hover:text-white group-data-[collapsible=icon]:hidden"
            aria-label="Recolher menu"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = currentPath === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label} size="lg">
                      <Link to={item.to} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar/80 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={nextPalette} tooltip={paletteLabel}>
              <PaletteIcon className="h-4 w-4" />
              <span className="truncate">{paletteLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggle}
              tooltip={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator className="my-1" />

          {pathname !== "/home" && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleVoltar} tooltip="Voltar">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSair}
              tooltip="Sair"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
