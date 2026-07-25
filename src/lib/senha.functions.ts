import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
import { query } from "./db";

async function isAdmOrMaster(userId: string) {
  const roles = await query(`SELECT role FROM ouro.saas_user_roles WHERE user_id = $1`, [userId]);
  const roleNames = roles.map((r: any) => r.role);
  return roleNames.includes("master") || roleNames.includes("adm");
}

// Solicitação feita pelo próprio usuário (público, sem login)
export const solicitarTrocaSenha = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const profiles = await query(
      `SELECT id, email FROM ouro.saas_profiles WHERE LOWER(email) = LOWER($1)`,
      [data.email.trim()]
    );

    if (profiles.length === 0) return { ok: true };
    const profile = profiles[0];

    const existente = await query(
      `SELECT id FROM ouro.saas_solicitacoes_senha WHERE user_id = $1 AND status IN ('pendente', 'aprovada')`,
      [profile.id]
    );

    if (existente.length > 0) return { ok: true };

    await query(
      `INSERT INTO ouro.saas_solicitacoes_senha (user_id, email, origem, status) VALUES ($1, $2, 'usuario', 'pendente')`,
      [profile.id, profile.email]
    );

    return { ok: true };
  });

// ADM/MASTER lista solicitações pendentes/aprovadas
export const listarSolicitacoesSenha = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await isAdmOrMaster(userId))) throw new Error("Sem permissão");

    return query(
      `SELECT id, user_id, email, status, origem, criado_em, decidido_em 
       FROM ouro.saas_solicitacoes_senha 
       WHERE status IN ('pendente', 'aprovada') 
       ORDER BY criado_em DESC`
    );
  });

// ADM/MASTER aprova solicitação
export const aprovarSolicitacaoSenha = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmOrMaster(userId))) throw new Error("Sem permissão");

    await query(
      `UPDATE ouro.saas_solicitacoes_senha 
       SET status = 'aprovada', decidido_em = now(), decidido_por = $1 
       WHERE id = $2`,
      [userId, data.id]
    );
    return { ok: true };
  });

// ADM/MASTER recusa solicitação
export const recusarSolicitacaoSenha = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmOrMaster(userId))) throw new Error("Sem permissão");

    await query(
      `UPDATE ouro.saas_solicitacoes_senha 
       SET status = 'recusada', decidido_em = now(), decidido_por = $1 
       WHERE id = $2`,
      [userId, data.id]
    );
    return { ok: true };
  });

// ADM/MASTER pré-autoriza troca de senha
export const preAutorizarTrocaSenha = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmOrMaster(userId))) throw new Error("Sem permissão");

    const profiles = await query(`SELECT id, email FROM ouro.saas_profiles WHERE id = $1`, [data.user_id]);
    if (profiles.length === 0) throw new Error("Usuário não encontrado");
    const profile = profiles[0];

    await query(
      `DELETE FROM ouro.saas_solicitacoes_senha WHERE user_id = $1 AND status IN ('pendente', 'aprovada')`,
      [data.user_id]
    );

    await query(
      `INSERT INTO ouro.saas_solicitacoes_senha (user_id, email, origem, status, decidido_em, decidido_por)
       VALUES ($1, $2, 'pre_autorizada', 'aprovada', now(), $3)`,
      [profile.id, profile.email, userId]
    );
    return { ok: true };
  });

// Verifica se há solicitação aprovada para o usuário logado
export const minhaSolicitacaoAprovada = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const rows = await query(
      `SELECT id, origem FROM ouro.saas_solicitacoes_senha WHERE user_id = $1 AND status = 'aprovada' LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return null;
    return rows[0];
  });

// Conclui a solicitação após troca de senha
export const concluirSolicitacaoSenha = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await query(
      `UPDATE ouro.saas_solicitacoes_senha SET status = 'concluida' WHERE user_id = $1 AND status = 'aprovada'`,
      [userId]
    );
    return { ok: true };
  });
