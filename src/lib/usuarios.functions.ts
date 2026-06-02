import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["padrao", "adm", "master"]);

async function getCallerRole(supabase: any, userId: string): Promise<"padrao" | "adm" | "master"> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (roles.includes("master")) return "master";
  if (roles.includes("adm")) return "adm";
  return "padrao";
}

async function getTargetRole(admin: any, targetId: string): Promise<"padrao" | "adm" | "master"> {
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", targetId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (roles.includes("master")) return "master";
  if (roles.includes("adm")) return "adm";
  return "padrao";
}

// ---------- Criar usuário ----------
export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        primeiro_nome: z.string().trim().min(1).max(60),
        segundo_nome: z.string().trim().min(1).max(60),
        email: z.string().trim().email().max(255),
        data_nascimento: z.string().min(1),
        matricula: z.string().trim().max(40).optional().or(z.literal("")),
        senha: z.string().min(6),
        role: roleSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const callerRole = await getCallerRole(supabase, userId);
    if (callerRole === "padrao") throw new Error("Sem permissão para criar usuários.");
    if (data.role === "master" && callerRole !== "master")
      throw new Error("Somente MASTER pode criar usuários MASTER.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: {
        primeiro_nome: data.primeiro_nome,
        segundo_nome: data.segundo_nome,
        data_nascimento: data.data_nascimento,
        matricula: data.matricula || null,
      },
    });
    if (error || !created?.user) throw new Error(error?.message ?? "Falha ao criar usuário");

    // O trigger handle_new_user_role já insere 'padrao'. Se for outro papel, atualiza.
    if (data.role !== "padrao") {
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: created.user.id, role: data.role }, { onConflict: "user_id,role" });
      // remove o 'padrao' default
      await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id).eq("role", "padrao");
      // garante novo papel
      if (rErr) {
        await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
      }
    }
    return { id: created.user.id };
  });

// ---------- Alterar papel ----------
export const alterarPapel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ user_id: z.string().uuid(), role: roleSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.user_id === userId) throw new Error("Você não pode alterar seu próprio papel.");

    const callerRole = await getCallerRole(supabase, userId);
    if (callerRole === "padrao") throw new Error("Sem permissão.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const targetRole = await getTargetRole(supabaseAdmin, data.user_id);

    if (callerRole === "adm") {
      if (targetRole === "master") throw new Error("ADM não pode alterar um MASTER.");
      if (data.role === "master") throw new Error("ADM não pode promover a MASTER.");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Excluir usuário ----------
export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.user_id === userId) throw new Error("Você não pode excluir a si mesmo.");

    const callerRole = await getCallerRole(supabase, userId);
    if (callerRole === "padrao") throw new Error("Sem permissão.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const targetRole = await getTargetRole(supabaseAdmin, data.user_id);
    if (callerRole === "adm" && targetRole === "master")
      throw new Error("ADM não pode excluir um MASTER.");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
