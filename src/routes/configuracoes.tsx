import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, History, Bell, Download, Database, Palette } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — BR Hunter" }] }),
  component: () => <AppShell><Pagina /></AppShell>,
});

function Pagina() {
  const { theme, toggle } = useTheme();
  const [notif, setNotif] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem("notif") === "1" : false));
  const [compact, setCompact] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem("compact") === "1" : false));

  const flag = (key: string, value: boolean) => localStorage.setItem(key, value ? "1" : "0");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências do sistema e ferramentas operacionais</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Aparência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border/60 p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              <div>
                <Label className="text-sm font-medium">Modo escuro</Label>
                <p className="text-xs text-muted-foreground">Reduza o brilho e o cansaço visual</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-4">
            <div>
              <Label className="text-sm font-medium">Densidade compacta</Label>
              <p className="text-xs text-muted-foreground">Listas mais densas para ver mais de uma vez</p>
            </div>
            <Switch checked={compact} onCheckedChange={(v) => { setCompact(v); flag("compact", v); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notificações</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-4">
            <div>
              <Label className="text-sm font-medium">Avisos de fechamento de ciclo</Label>
              <p className="text-xs text-muted-foreground">Receber lembretes quando estiver próximo da data de fechamento</p>
            </div>
            <Switch checked={notif} onCheckedChange={(v) => { setNotif(v); flag("notif", v); toast.success(v ? "Notificações ativadas" : "Notificações desativadas"); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-4 w-4" /> Dados e auditoria</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline" className="justify-start">
            <Link to="/historico"><History className="mr-2 h-4 w-4" /> Ver histórico de eventos</Link>
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => toast.info("Exportação em breve")}>
            <Download className="mr-2 h-4 w-4" /> Exportar prestações (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
