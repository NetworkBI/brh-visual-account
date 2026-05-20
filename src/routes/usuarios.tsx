import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { useAuth, useUserRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import { senhaSchema } from "@/lib/schemas";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — BR Hunter" }] }),
  component: () => <AppShell><Pagina /></AppShell>,
});

function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios-com-roles"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("id, primeiro_nome, segundo_nome, email, matricula"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles ?? []).some((r) => r.user_id === p.id && r.role === "adm") ? "adm" : "padrao",
      }));
    },
  });
}

function Pagina() {
  const { user } = useAuth();
  const { data: myRole } = useUserRole();
  const qc = useQueryClient();
  const { data: usuarios = [], isLoading } = useUsuarios();

  const isAdm = myRole === "adm";

  // Trocar senha
  const [novaSenha, setNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const trocarSenha = async () => {
    const parsed = senhaSchema.safeParse(novaSenha);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSalvandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvandoSenha(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha alterada");
    setNovaSenha("");
  };

  const alterarRole = async (userId: string, role: "adm" | "padrao") => {
    // remove qualquer role existente desse usuário e aplica nova
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) { toast.error(error.message); return; }
    toast.success("Papel atualizado");
    qc.invalidateQueries({ queryKey: ["usuarios-com-roles"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Usuário</h1>
        <p className="text-sm text-muted-foreground">Gerenciamento de contas e perfis de acesso</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Minha conta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Papel atual</Label>
            <div><Badge variant={isAdm ? "default" : "secondary"}>{isAdm ? "ADM" : "PADRÃO"}</Badge></div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nova senha</Label>
            <div className="flex gap-2">
              <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="mín. 6 caracteres + 1 número" />
              <Button onClick={trocarSenha} disabled={salvandoSenha || !novaSenha}><Save className="mr-1 h-4 w-4" /> Salvar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Usuários cadastrados</CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAdm
              ? "Como ADM, você pode alterar o papel dos demais usuários."
              : "Somente usuários ADM podem alterar papéis."}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Matrícula</th>
                  <th className="px-4 py-3 text-left">Papel</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem usuários.</td></tr>
                ) : usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.primeiro_nome} {u.segundo_nome}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.matricula || (u.role === "adm" ? "—" : "—")}</td>
                    <td className="px-4 py-3">
                      {isAdm && u.id !== user?.id ? (
                        <Select value={u.role} onValueChange={(v) => alterarRole(u.id, v as "adm" | "padrao")}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adm">ADM</SelectItem>
                            <SelectItem value="padrao">PADRÃO</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={u.role === "adm" ? "default" : "secondary"} className="gap-1">
                          {u.role === "adm" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {u.role === "adm" ? "ADM" : "PADRÃO"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
