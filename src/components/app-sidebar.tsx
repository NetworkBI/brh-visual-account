import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, FileText, Users, Building2, Settings, LogOut, Moon, Sun } from "lucide-react";
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
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";
import { useAuth, useUserRole, canManageUsers } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const NAV_BASE = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/usuarios", label: "Usuários", icon: Users, requiresManage: true },
] as const;

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();
  const { data: role } = useUserRole();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const NAV = NAV_BASE.filter(
    (i) => !("requiresManage" in i && i.requiresManage) || canManageUsers(role),
  );


  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-[8px_0_24px_-12px_rgba(0,0,0,0.35)]">
      <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-b from-[#7a1418] to-[#3a0a0c] p-4">
        <Link to="/home" className="flex items-center gap-3">
          <img src={logo} alt="BR Hunter" width={640} height={640} className="h-9 w-9 shrink-0 rounded-md bg-white/95 p-1 shadow-md object-contain" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-bold text-white tracking-wide">BR HUNTER</span>
          </div>
        </Link>
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
            <SidebarMenuButton asChild isActive={currentPath === "/configuracoes"} tooltip="Configurações">
              <Link to="/configuracoes" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={theme === "dark" ? "Modo claro" : "Modo escuro"} onClick={toggle}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-sidebar-border bg-card/50 p-2 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { signOut().then(() => navigate({ to: "/login" })); }}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
