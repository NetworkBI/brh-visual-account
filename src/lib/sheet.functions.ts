import { createServerFn } from "@tanstack/react-start";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1PlX_X3vS5MsWcwBXUpDSV6ZXWhYo_xasiu5819VxYcc/export?format=csv";

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

export const getCondominiosFromSheet = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const res = await fetch(SHEET_CSV_URL, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) return { nomes: [] as string[], error: `HTTP ${res.status}` };
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return { nomes: [], error: null };
      const nomes = lines
        .slice(1)
        .map((l) => parseCsvLine(l)[0]?.trim() ?? "")
        .filter((n) => n.length > 0);
      // dedupe + ordena
      const unique = Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b, "pt-BR"));
      return { nomes: unique, error: null };
    } catch (e) {
      console.error("getCondominiosFromSheet error", e);
      return { nomes: [] as string[], error: "Falha ao ler a planilha" };
    }
  },
);
