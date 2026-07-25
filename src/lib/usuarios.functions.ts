import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
import { query } from "./db";
import { hashPassword } from "./auth-service";

const roleSchema = z.enum(["padrao", "adm", "master"]);

async function getCallerRole(userId: string): Promise<"padrao" | "adm" | "master"> {
  const roles = await query(`SELECT role FROM ouro.saas_user_roles WHERE user_id = $1`, [userId]);
  const roleNames = roles.map(r => r.role);
  if (roleNames.includes("master")) return "master";
  if (roleNames.includes("adm")) return "adm";
  return "padrao";
}

async function getTargetRole(targetId: string): Promise<"padrao" | "adm" | "master"> {
  const roles = await query(`SELECT role FROM ouro.saas_user_roles WHERE user_id = $1`, [targetId]);
  const roleNames = roles.map(r => r.role);
  if (roleNames.includes("master")) return "master";
  if (roleNames.includes("adm")) return "adm";
  return "padrao";
}

// ---------- Criar usuário ----------
export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
    const { userId } = context;
    const callerRole = await getCallerRole(userId);
    if (callerRole === "padrao") throw new Error("Sem permissão para criar usuários.");
    if (data.role === "master" && callerRole !== "master")
      throw new Error("Somente MASTER pode criar usuários MASTER.");

    const existing = await query(`SELECT id FROM ouro.saas_profiles WHERE email = $1`, [data.email.toLowerCase().trim()]);
    if (existing.length > 0) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const hashed = await hashPassword(data.senha);

    const result = await query(
      `INSERT INTO ouro.saas_profiles (primeiro_nome, segundo_nome, data_nascimento, email, matricula, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.primeiro_nome, data.segundo_nome, data.data_nascimento, data.email.toLowerCase().trim(), data.matricula || null, hashed]
    );

    const createdId = result[0].id;

    await query(`INSERT INTO ouro.saas_user_roles (user_id, role) VALUES ($1, $2)`, [createdId, data.role]);

    return { id: createdId };
  });

// ---------- Alterar papel ----------
export const alterarPapel = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({ user_id: z.string().uuid(), role: roleSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (data.user_id === userId) throw new Error("Você não pode alterar seu próprio papel.");

    const callerRole = await getCallerRole(userId);
    if (callerRole === "padrao") throw new Error("Sem permissão.");

    const targetRole = await getTargetRole(data.user_id);

    if (callerRole === "adm") {
      if (targetRole === "master" || targetRole === "adm") {
        throw new Error("ADM só pode gerenciar papel de usuários PADRÃO.");
      }
      if (data.role === "master" || data.role === "adm") {
        throw new Error("ADM não pode promover a ADM ou MASTER.");
      }
    }

    if (callerRole === "master") {
      if (targetRole === "master") {
        throw new Error("Não é possível alterar papel de outro MASTER.");
      }
    }

    await query(`DELETE FROM ouro.saas_user_roles WHERE user_id = $1`, [data.user_id]);
    await query(`INSERT INTO ouro.saas_user_roles (user_id, role) VALUES ($1, $2)`, [data.user_id, data.role]);

    return { success: true };
  });

// ---------- Excluir usuário ----------
export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (data.user_id === userId) throw new Error("Você não pode se auto-excluir.");

    const callerRole = await getCallerRole(userId);
    if (callerRole === "padrao") throw new Error("Sem permissão para excluir usuários.");

    const targetRole = await getTargetRole(data.user_id);

    if (callerRole === "adm" && (targetRole === "master" || targetRole === "adm")) {
      throw new Error("ADM não pode excluir outros administradores.");
    }

    if (callerRole === "master" && targetRole === "master") {
      throw new Error("Não é possível excluir outro MASTER.");
    }

    await query(`DELETE FROM ouro.saas_profiles WHERE id = $1`, [data.user_id]);

    return { success: true };
  });
