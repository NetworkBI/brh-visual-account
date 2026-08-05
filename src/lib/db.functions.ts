import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query } from "./db";
import { requireAuth } from "./auth-middleware";
import { verifyPassword, generateToken, hashPassword } from "./auth-service";

// Auxiliary helper to get caller role
async function getCallerRole(userId: string): Promise<"padrao" | "adm" | "master"> {
  const roles = await query(
    `SELECT role FROM ouro.saas_user_roles WHERE user_id = $1`,
    [userId]
  );
  const roleNames = roles.map(r => r.role);
  if (roleNames.includes("master")) return "master";
  if (roleNames.includes("adm")) return "adm";
  return "padrao";
}

// 1. Auth: Login
export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().email(), password: z.string() }).parse(input)
  )
  .handler(async ({ data }) => {
    const users = await query(
      `SELECT id, email, password_hash, primeiro_nome, segundo_nome FROM ouro.saas_profiles WHERE email = $1`,
      [data.email.toLowerCase().trim()]
    );
    if (users.length === 0) {
      throw new Error("Usuário ou senha incorretos.");
    }
    const user = users[0];
    const isValido = await verifyPassword(data.password, user.password_hash);
    if (!isValido) {
      throw new Error("Usuário ou senha incorretos.");
    }

    const token = generateToken({ id: user.id, email: user.email });

    return {
      session: {
        access_token: token,
        token_type: "bearer",
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            primeiro_nome: user.primeiro_nome,
            segundo_nome: user.segundo_nome,
          }
        }
      }
    };
  });

// 2. Condominios: List (Historico filtrado por periodo)
export const getCondominios = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ periodo: z.string().optional().nullable() }).parse(input))
  .handler(async ({ data }) => {
    // Se não houver período fornecido, pega uma lista geral ordenada
    if (!data.periodo) {
      return query(`
        SELECT id, nome FROM (
          SELECT DISTINCT ON (id_condominio) id_condominio as id, dsc_nome_condominio as nome
          FROM ouro.tb_fct_condominio_hist
          ORDER BY id_condominio, dsc_nome_condominio
        ) sub
        ORDER BY nome ASC
      `);
    }

    // Normaliza periodo de YYYY-MM para YYYYMM se necessário
    const normalizedPeriodo = data.periodo.replace("-", "");

    return query(`
      SELECT id, nome FROM (
        SELECT DISTINCT ON (id_condominio) id_condominio as id, dsc_nome_condominio as nome
        FROM ouro.tb_fct_condominio_hist
        WHERE periodo = $1
        ORDER BY id_condominio, dsc_nome_condominio
      ) sub
      ORDER BY nome ASC
    `, [normalizedPeriodo]);
  });

// 2b. Quantidade de condominios elegiveis por periodo (YYYYMM)
export const getQuantCondominiosElegiveis = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ mes: z.string().optional().nullable() }).parse(input))
  .handler(async ({ data }) => {
    if (!data.mes) {
      const rows = await query(`
        SELECT COUNT(DISTINCT id_condominio)::int AS quant_condominios
        FROM ouro.tb_fct_condominio_hist
      `);
      return Number(rows[0]?.quant_condominios ?? 0);
    }
    const periodo = data.mes.replace("-", "");
    const rows = await query(`
      SELECT COUNT(DISTINCT id_condominio)::int AS quant_condominios
      FROM ouro.tb_fct_condominio_hist
      WHERE periodo = $1
    `, [periodo]);
    return Number(rows[0]?.quant_condominios ?? 0);
  });


// 3. Profiles: Standard users
export const getProfiles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    return query(`
      SELECT p.id, p.primeiro_nome, p.segundo_nome, p.email, p.matricula, p.data_nascimento, p.created_at
      FROM ouro.saas_profiles p
      JOIN ouro.saas_user_roles r ON p.id = r.user_id
      WHERE r.role = 'padrao'
      ORDER BY p.primeiro_nome, p.segundo_nome
    `);
  });

// 4. Profiles: All users
export const getAllProfiles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    return query(`
      SELECT p.id, p.primeiro_nome, p.segundo_nome, p.email, p.matricula, p.data_nascimento, p.created_at,
             COALESCE((SELECT string_agg(role::text, ',') FROM ouro.saas_user_roles WHERE user_id = p.id), 'padrao') as role
      FROM ouro.saas_profiles p
      ORDER BY p.primeiro_nome, p.segundo_nome
    `);
  });

// 5. Prestacoes: List
export const getPrestacoes = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    const rows = await query(`
      SELECT p.id, p.mes, p.condominio_id, p.id_condominio, p.processo, p.data_evento, p.usuario_responsavel, p.usuario, p.observacoes, p.ativo, p.created_at, p.updated_at,
             COALESCE(
               (SELECT dsc_nome_condominio FROM ouro.tb_fct_condominio_hist WHERE id_condominio = p.id_condominio AND periodo = replace(p.mes, '-', '') LIMIT 1),
               c.nome
             ) as condominio_nome
      FROM ouro.saas_prestacoes p
      LEFT JOIN ouro.saas_condominios c ON p.condominio_id = c.id
      ORDER BY p.data_evento DESC
    `);
    
    const REVERSE_MAP: Record<string, string> = {
      "Doc/Recebimento": "Documentação Recebida",
      "Lançamento": "Lançamento Contábeis",
      "Montagem": "Montagem Balancete",
      "Data Fechamento": "Data da Entrega",
    };

    // Format to match the nested object shape: { ..., condominios: { nome: '...' } }
    return rows.map(r => ({
      id: r.id,
      mes: r.mes,
      condominio_id: r.condominio_id,
      id_condominio: r.id_condominio ? Number(r.id_condominio) : null,
      processo: REVERSE_MAP[r.processo] || r.processo,
      data_evento: r.data_evento,
      usuario_responsavel: r.usuario_responsavel,
      usuario: r.usuario,
      observacoes: r.observacoes,
      ativo: r.ativo,
      created_at: r.created_at,
      updated_at: r.updated_at,
      condominios: {
        nome: r.condominio_nome
      }
    }));
  });

// 6. Eventos: List
export const getEventos = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    const rows = await query(`
      SELECT e.id, e.prestacao_id, e.ocorrido, e.usuario, e.data_ocorrido,
             p.mes as prestacao_mes, c.nome as condominio_nome
      FROM ouro.saas_prestacao_eventos e
      JOIN ouro.saas_prestacoes p ON e.prestacao_id = p.id
      JOIN ouro.saas_condominios c ON p.condominio_id = c.id
      ORDER BY e.data_ocorrido DESC
      LIMIT 200
    `);

    return rows.map(r => ({
      id: r.id,
      prestacao_id: r.prestacao_id,
      ocorrido: r.ocorrido,
      usuario: r.usuario,
      data_ocorrido: r.data_ocorrido,
      prestacoes: {
        mes: r.prestacao_mes,
        condominios: {
          nome: r.condominio_nome
        }
      }
    }));
  });

// 7. Prestacoes: Toggle/Inactivate
export const inactivatePrestacao = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), ativo: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    
    const original = await query(`SELECT usuario, usuario_responsavel FROM ouro.saas_prestacoes WHERE id = $1`, [data.id]);
    if (original.length === 0) throw new Error("Prestação não encontrada.");
    
    const callerRole = await getCallerRole(userId);
    const isOwner = original[0].usuario === userId || original[0].usuario_responsavel === userId;
    
    if (callerRole === "padrao" && !isOwner) {
      throw new Error("Sem permissão para alterar esta prestação.");
    }

    await query(
      `UPDATE ouro.saas_prestacoes SET ativo = $1, updated_at = now() WHERE id = $2`,
      [data.ativo, data.id]
    );

    await query(
      `INSERT INTO ouro.saas_prestacao_eventos (prestacao_id, ocorrido, usuario) VALUES ($1, 'edição', $2)`,
      [data.id, userId]
    );

    return { success: true };
  });

// 8. Condominios: Insert
export const insertCondominio = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ nome: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const callerRole = await getCallerRole(userId);
    if (callerRole === "padrao") {
      throw new Error("Sem permissão para adicionar condomínios.");
    }
    
    const result = await query(
      `INSERT INTO ouro.saas_condominios (nome, created_by) VALUES ($1, $2) RETURNING id`,
      [data.nome, userId]
    );
    return { success: true, id: result[0].id };
  });

// 9. Condominios: Delete
export const deleteCondominio = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const callerRole = await getCallerRole(userId);
    if (callerRole === "padrao") {
      throw new Error("Sem permissão para excluir condomínios.");
    }
    
    await query(`DELETE FROM ouro.saas_condominios WHERE id = $1`, [data.id]);
    return { success: true };
  });

// 10. Prestacoes: Get By ID
export const getPrestacaoById = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const rows = await query(`SELECT * FROM ouro.saas_prestacoes WHERE id = $1`, [data.id]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    const REVERSE_MAP: Record<string, string> = {
      "Doc/Recebimento": "Documentação Recebida",
      "Lançamento": "Lançamento Contábeis",
      "Montagem": "Montagem Balancete",
      "Data Fechamento": "Data da Entrega",
    };

    const dataEventoStr = row.data_evento
      ? row.data_evento instanceof Date
        ? row.data_evento.toISOString().slice(0, 10)
        : String(row.data_evento).slice(0, 10)
      : "";

    const mesStr = row.mes
      ? row.mes instanceof Date
        ? row.mes.toISOString().slice(0, 7)
        : String(row.mes).slice(0, 7)
      : "";

    return {
      ...row,
      mes: mesStr,
      data_evento: dataEventoStr,
      processo: REVERSE_MAP[row.processo] || row.processo,
    };
  });

// 11. Prestacoes: Update
export const updatePrestacao = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      mes: z.string(),
      condominio_id: z.string().uuid().optional().nullable(),
      id_condominio: z.number().int(),
      processo: z.enum(["Documentação Recebida", "Lançamento Contábeis", "Montagem Balancete", "Data da Entrega"]),
      data_evento: z.string(),
      usuario_responsavel: z.string().uuid(),
      observacoes: z.string().optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    
    const original = await query(`SELECT usuario, usuario_responsavel FROM ouro.saas_prestacoes WHERE id = $1`, [data.id]);
    if (original.length === 0) throw new Error("Prestação não encontrada.");
    
    const callerRole = await getCallerRole(userId);
    const isOwner = original[0].usuario === userId || original[0].usuario_responsavel === userId;
    
    if (callerRole === "padrao" && !isOwner) {
      throw new Error("Sem permissão para alterar esta prestação.");
    }

    // --- Validação cronológica ---
    const ORDEM_PROCESSOS_UPD = [
      "Doc/Recebimento",
      "Lançamento",
      "Montagem",
      "Data Fechamento",
    ];
    const PROCESS_MAP: Record<string, string> = {
      "Documentação Recebida": "Doc/Recebimento",
      "Lançamento Contábeis": "Lançamento",
      "Montagem Balancete": "Montagem",
      "Data da Entrega": "Data Fechamento",
    };
    const dbProcesso = PROCESS_MAP[data.processo] || data.processo;
    const indiceDesejadoUpd = ORDEM_PROCESSOS_UPD.indexOf(dbProcesso);

    if (indiceDesejadoUpd > 0) {
      // Busca os processos já lançados para esse condomínio+mês (excluindo o próprio registro)
      const existentesUpd = await query(
        `SELECT processo FROM ouro.saas_prestacoes WHERE id_condominio = $1 AND mes = $2 AND ativo = true AND id != $3`,
        [data.id_condominio, data.mes, data.id]
      );
      const processosExistentesUpd = new Set(existentesUpd.map((r: any) => r.processo));

      for (let i = 0; i < indiceDesejadoUpd; i++) {
        if (!processosExistentesUpd.has(ORDEM_PROCESSOS_UPD[i])) {
          throw new Error("Existe uma etapa pendente a ser lançada.");
        }
      }
    }

    // Resolve name of the selected id_condominio from history
    const histRows = await query(
      `SELECT dsc_nome_condominio as nome FROM ouro.tb_fct_condominio_hist WHERE id_condominio = $1 LIMIT 1`,
      [data.id_condominio]
    );
    const condominioNome = histRows[0]?.nome || "Condomínio Histórico";

    // Find or create in saas_condominios to sync condominio_id
    let finalCondominioId = data.condominio_id;
    if (!finalCondominioId) {
      const condRows = await query(`SELECT id FROM ouro.saas_condominios WHERE nome = $1 LIMIT 1`, [condominioNome]);
      if (condRows.length > 0) {
        finalCondominioId = condRows[0].id;
      } else {
        const insertRes = await query(
          `INSERT INTO ouro.saas_condominios (nome, created_by) VALUES ($1, $2) RETURNING id`,
          [condominioNome, userId]
        );
        finalCondominioId = insertRes[0].id;
      }
    }

    await query(
      `UPDATE ouro.saas_prestacoes 
       SET mes = $1, condominio_id = $2, id_condominio = $3, processo = $4, data_evento = $5, usuario_responsavel = $6, observacoes = $7, updated_at = now()
       WHERE id = $8`,
      [data.mes, finalCondominioId, data.id_condominio, dbProcesso, data.data_evento, data.usuario_responsavel, data.observacoes || null, data.id]
    );

    await query(
      `INSERT INTO ouro.saas_prestacao_eventos (prestacao_id, ocorrido, usuario) VALUES ($1, 'edição', $2)`,
      [data.id, userId]
    );

    return { success: true };
  });

// 12. Prestacoes: Create
export const createPrestacao = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      mes: z.string(),
      condominio_id: z.string().uuid().optional().nullable(),
      id_condominio: z.number().int(),
      processo: z.enum(["Documentação Recebida", "Lançamento Contábeis", "Montagem Balancete", "Data da Entrega"]),
      data_evento: z.string(),
      usuario_responsavel: z.string().uuid(),
      observacoes: z.string().optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // --- Validação cronológica ---
    const ORDEM_PROCESSOS = [
      "Doc/Recebimento",
      "Lançamento",
      "Montagem",
      "Data Fechamento",
    ];
    const PROCESS_MAP: Record<string, string> = {
      "Documentação Recebida": "Doc/Recebimento",
      "Lançamento Contábeis": "Lançamento",
      "Montagem Balancete": "Montagem",
      "Data da Entrega": "Data Fechamento",
    };
    const dbProcesso = PROCESS_MAP[data.processo] || data.processo;
    const indiceDesejado = ORDEM_PROCESSOS.indexOf(dbProcesso);

    if (indiceDesejado > 0) {
      // Busca os processos já lançados para esse condomínio+mês
      const existentes = await query(
        `SELECT processo FROM ouro.saas_prestacoes WHERE id_condominio = $1 AND mes = $2 AND ativo = true`,
        [data.id_condominio, data.mes]
      );
      const processosExistentes = new Set(existentes.map((r: any) => r.processo));

      // Verifica se todos os processos anteriores foram lançados
      for (let i = 0; i < indiceDesejado; i++) {
        if (!processosExistentes.has(ORDEM_PROCESSOS[i])) {
          throw new Error("Existe uma etapa pendente a ser lançada.");
        }
      }
    }

    // Resolve name of the selected id_condominio from history
    const histRows = await query(
      `SELECT dsc_nome_condominio as nome FROM ouro.tb_fct_condominio_hist WHERE id_condominio = $1 LIMIT 1`,
      [data.id_condominio]
    );
    const condominioNome = histRows[0]?.nome || "Condomínio Histórico";

    // Find or create in saas_condominios to sync condominio_id
    let finalCondominioId = data.condominio_id;
    if (!finalCondominioId) {
      const condRows = await query(`SELECT id FROM ouro.saas_condominios WHERE nome = $1 LIMIT 1`, [condominioNome]);
      if (condRows.length > 0) {
        finalCondominioId = condRows[0].id;
      } else {
        const insertRes = await query(
          `INSERT INTO ouro.saas_condominios (nome, created_by) VALUES ($1, $2) RETURNING id`,
          [condominioNome, userId]
        );
        finalCondominioId = insertRes[0].id;
      }
    }
    
    const result = await query(
      `INSERT INTO ouro.saas_prestacoes (mes, condominio_id, id_condominio, processo, data_evento, usuario_responsavel, usuario, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [data.mes, finalCondominioId, data.id_condominio, dbProcesso, data.data_evento, data.usuario_responsavel, userId, data.observacoes || null]
    );

    const newId = result[0].id;

    await query(
      `INSERT INTO ouro.saas_prestacao_eventos (prestacao_id, ocorrido, usuario) VALUES ($1, 'criação', $2)`,
      [newId, userId]
    );

    return { success: true, id: newId };
  });

// 13. Auth: Update Password
export const updatePassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ password: z.string().min(6) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const hash = await hashPassword(data.password);
    await query(`UPDATE ouro.saas_profiles SET password_hash = $1 WHERE id = $2`, [hash, userId]);
    return { success: true };
  });

// 14. Auth: Get Current User Role
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    return getCallerRole(userId);
  });
