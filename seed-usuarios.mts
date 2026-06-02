import { createClient } from "@supabase/supabase-js";

const SHEET = "https://docs.google.com/spreadsheets/d/1PlX_X3vS5MsWcwBXUpDSV6ZXWhYo_xasiu5819VxYcc/export?format=csv&gid=2136183962";

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === ",") { out.push(cur); cur = ""; }
      else if (c === '"') q = true;
      else cur += c;
    }
  }
  out.push(cur); return out;
}

function splitNome(s: string) {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return { p: "", s: "" };
  const i = t.indexOf(" ");
  return i < 0 ? { p: t, s: "" } : { p: t.slice(0, i), s: t.slice(i + 1) };
}

const res = await fetch(SHEET);
if (!res.ok) { console.error("HTTP", res.status); process.exit(1); }
const rows = (await res.text()).split(/\r?\n/).map(parseLine);

const headerIdx = rows.findIndex(r => r.some(c => /e[-\s]?mail/i.test(c)) && r.some(c => /senha/i.test(c)));
const header = rows[headerIdx].map(h => h.trim().toLowerCase());
const col = (re: RegExp) => header.findIndex(h => re.test(h));
const iNome = col(/primeiro|nome/), iNasc = col(/nascimento/), iEmail = col(/e[-\s]?mail/), iMat = col(/matr/), iSenha = col(/senha/);

console.log("Cabeçalho:", header);
console.log("Linhas de dados:", rows.length - headerIdx - 1);

const criados: string[] = [], atualizados: string[] = [], erros: { e: string; m: string }[] = [];

for (let r = headerIdx + 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.every(c => !c?.trim())) continue;
  const email = (row[iEmail] ?? "").trim().toLowerCase();
  const senha = (row[iSenha] ?? "").trim();
  const nomeFull = (row[iNome] ?? "").trim();
  const dataNasc = (row[iNasc] ?? "").trim();
  const matricula = iMat >= 0 ? (row[iMat] ?? "").trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { erros.push({ e: email || "(vazio)", m: "email inválido" }); continue; }
  if (!senha) { erros.push({ e: email, m: "senha vazia" }); continue; }

  const { p, s } = splitNome(nomeFull);

  const { data: existing, error: selErr } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (selErr) { erros.push({ e: email, m: `select: ${selErr.message}` }); continue; }

  if (existing) {
    const { error } = await admin.from("profiles").update({
      primeiro_nome: p, segundo_nome: s,
      data_nascimento: dataNasc || "1970-01-01",
      matricula: matricula || null,
    }).eq("id", existing.id);
    if (error) { erros.push({ e: email, m: `update: ${error.message}` }); continue; }
    atualizados.push(email);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email, password: senha, email_confirm: true,
      user_metadata: {
        primeiro_nome: p, segundo_nome: s,
        data_nascimento: dataNasc || "1970-01-01",
        matricula: matricula || null,
      },
    });
    if (error) { erros.push({ e: email, m: `create: ${error.message}` }); continue; }
    criados.push(email);
  }
}

console.log("\n=== RESUMO ===");
console.log("Criados:", criados.length, criados);
console.log("Atualizados:", atualizados.length, atualizados);
console.log("Erros:", erros.length, erros);
