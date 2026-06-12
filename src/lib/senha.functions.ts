import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmOrMaster(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  return roles.includes("master") || roles.includes("adm");
}

// Solicitação feita pelo próprio usuário a partir da tela "Esqueci minha senha".
// Público (não exige login). Não revela se o e-mail existe.
export const solicitarTrocaSenha = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Busca usuário pelo email via profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", data.email)
      .maybeSingle();

    // Resposta sempre genérica para não vazar existência de conta
    if (!profile) return { ok: true };

    // Verifica se já existe pendente/aprovada
    const { data: existente } = await supabaseAdmin
      .from("solicitacoes_senha")
      .select("id")
      .eq("user_id", profile.id)
      .in("status", ["pendente", "aprovada"])
      .maybeSingle();

    if (existente) return { ok: true };

    const { error } = await supabaseAdmin.from("solicitacoes_senha").insert({
      user_id: profile.id,
      email: profile.email,
      origem: "usuario",
      status: "pendente",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADM/MASTER lista solicitações pendentes/aprovadas
export const listarSolicitacoesSenha = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    if (!(await isAdmOrMaster(supabase, userId))) throw new Error("Sem permissão");

    const { data, error } = await supabase
      .from("solicitacoes_senha")
      .select("id, user_id, email, status, origem, criado_em, decidido_em")
      .in("status", ["pendente", "aprovada"])
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ADM/MASTER aprova solicitação do usuário
export const aprovarSolicitacaoSenha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await isAdmOrMaster(supabase, userId))) throw new Error("Sem permissão");

    const { error } = await supabase
      .from("solicitacoes_senha")
      .update({ status: "aprovada", decidido_em: new Date().toISOString(), decidido_por: userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADM/MASTER recusa solicitação
export const recusarSolicitacaoSenha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await isAdmOrMaster(supabase, userId))) throw new Error("Sem permissão");

    const { error } = await supabase
      .from("solicitacoes_senha")
      .update({ status: "recusada", decidido_em: new Date().toISOString(), decidido_por: userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADM/MASTER pré-autoriza a troca de senha para um usuário
export const preAutorizarTrocaSenha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await isAdmOrMaster(supabase, userId))) throw new Error("Sem permissão");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!profile) throw new Error("Usuário não encontrado");

    // Cancela pendentes anteriores
    await supabaseAdmin
      .from("solicitacoes_senha")
      .delete()
      .eq("user_id", data.user_id)
      .in("status", ["pendente", "aprovada"]);

    const { error } = await supabaseAdmin.from("solicitacoes_senha").insert({
      user_id: profile.id,
      email: profile.email,
      origem: "pre_autorizada",
      status: "aprovada",
      decidido_em: new Date().toISOString(),
      decidido_por: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Usado pelo usuário ao logar: retorna se há solicitação aprovada para ele
export const minhaSolicitacaoAprovada = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("solicitacoes_senha")
      .select("id, origem")
      .eq("user_id", userId)
      .eq("status", "aprovada")
      .maybeSingle();
    return data ?? null;
  });

// Conclui a solicitação (chamada após o usuário trocar a senha)
export const concluirSolicitacaoSenha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("solicitacoes_senha")
      .update({ status: "concluida" })
      .eq("user_id", userId)
      .eq("status", "aprovada");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
