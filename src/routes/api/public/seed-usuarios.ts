import { createFileRoute } from "@tanstack/react-router";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1PlX_X3vS5MsWcwBXUpDSV6ZXWhYo_xasiu5819VxYcc/export?format=csv&gid=2136183962";

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === ",") { out.push(cur); cur = ""; }
      else if (c === '"') inQuotes = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function splitNome(full: string): { primeiro: string; segundo: string } {
  const t = full.trim().replace(/\s+/g, " ");
  if (!t) return { primeiro: "", segundo: "" };
  const idx = t.indexOf(" ");
  if (idx === -1) return { primeiro: t, segundo: "" };
  return { primeiro: t.slice(0, idx), segundo: t.slice(idx + 1) };
}

export const Route = createFileRoute("/api/public/seed-usuarios")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-seed-secret");
        const expected = process.env.SEED_USUARIOS_SECRET;
        if (!expected || secret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const res = await fetch(SHEET_CSV_URL, { headers: { "cache-control": "no-cache" } });
        if (!res.ok) {
          return Response.json({ error: `Falha ao baixar planilha: HTTP ${res.status}` }, { status: 502 });
        }
        const text = await res.text();
        const rows = text.split(/\r?\n/).map(parseCsvLine);

        const headerIdx = rows.findIndex((r) =>
          r.some((c) => /e[-\s]?mail/i.test(c)) && r.some((c) => /senha/i.test(c)),
        );
        if (headerIdx === -1) {
          return Response.json({ error: "Cabeçalho não encontrado" }, { status: 400 });
        }
        const header = rows[headerIdx].map((h) => h.trim().toLowerCase());
        const col = (re: RegExp) => header.findIndex((h) => re.test(h));
        const iNome = col(/primeiro|nome/);
        const iNasc = col(/nascimento/);
        const iEmail = col(/e[-\s]?mail/);
        const iMat = col(/matr/);
        const iSenha = col(/senha/);

        if (iNome < 0 || iEmail < 0 || iSenha < 0) {
          return Response.json({ error: "Colunas obrigatórias ausentes" }, { status: 400 });
        }

        const criados: string[] = [];
        const atualizados: string[] = [];
        const erros: { email: string; motivo: string }[] = [];

        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.every((c) => !c?.trim())) continue;

          const email = (row[iEmail] ?? "").trim().toLowerCase();
          const senha = (row[iSenha] ?? "").trim();
          const nomeFull = (row[iNome] ?? "").trim();
          const dataNasc = (row[iNasc] ?? "").trim();
          const matricula = iMat >= 0 ? (row[iMat] ?? "").trim() : "";

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            erros.push({ email: email || "(vazio)", motivo: "E-mail inválido" });
            continue;
          }
          if (!senha) { erros.push({ email, motivo: "Senha vazia" }); continue; }

          const { primeiro, segundo } = splitNome(nomeFull);

          const { data: existingProfile, error: selErr } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (selErr) { erros.push({ email, motivo: `Consulta: ${selErr.message}` }); continue; }

          if (existingProfile) {
            const { error: upErr } = await supabaseAdmin
              .from("profiles")
              .update({
                primeiro_nome: primeiro,
                segundo_nome: segundo,
                data_nascimento: dataNasc || "1970-01-01",
                matricula: matricula || null,
              })
              .eq("id", existingProfile.id);
            if (upErr) { erros.push({ email, motivo: `Update: ${upErr.message}` }); continue; }
            atualizados.push(email);
          } else {
            const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
              email,
              password: senha,
              email_confirm: true,
              user_metadata: {
                primeiro_nome: primeiro,
                segundo_nome: segundo,
                data_nascimento: dataNasc || "1970-01-01",
                matricula: matricula || null,
              },
            });
            if (createErr) { erros.push({ email, motivo: `Create: ${createErr.message}` }); continue; }
            criados.push(email);
          }
        }

        return Response.json({
          total: criados.length + atualizados.length,
          criados_count: criados.length,
          atualizados_count: atualizados.length,
          erros_count: erros.length,
          criados,
          atualizados,
          erros,
        });
      },
    },
  },
});
