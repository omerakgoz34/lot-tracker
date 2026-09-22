import type { ColumnMapping, MatchHit, MatchVia, RawRow } from "./types";

export function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("en-US");
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((raw, i) => {
    const base = raw.trim() || `Column ${i + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!input.trim()) return [];
  const delimiter = detectDelimiter(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function detectDelimiter(text: string): string {
  const first = text.split("\n").find((line) => line.trim()) ?? "";
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const ch of first) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch in counts) counts[ch] += 1;
  }
  const best = (Object.entries(counts) as Array<[string, number]>).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ",";
}

export function matrixToRecords(matrix: string[][]): { headers: string[]; rows: RawRow[] } {
  const start = matrix.findIndex((row) => row.some((c) => c.trim() !== ""));
  if (start < 0) throw new Error("The spreadsheet is empty.");
  const headers = uniqueHeaders(matrix[start]!.map((h) => h.trim()));
  const rows: RawRow[] = [];
  for (const line of matrix.slice(start + 1)) {
    const rec: RawRow = {};
    let empty = true;
    headers.forEach((h, i) => {
      const s = (line[i] ?? "").trim();
      rec[h] = s;
      if (s) empty = false;
    });
    if (!empty) rows.push(rec);
  }
  if (rows.length === 0) throw new Error("No data rows found under the header.");
  return { headers, rows };
}

function foldHeader(header: string): string {
  return header
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type Kind = "article" | "alternative" | "lot" | "name";

function scoreHeader(header: string, kind: Kind): number {
  const h = foldHeader(header);
  if (!h) return 0;

  const articleExact = [
    "article",
    "article no",
    "article number",
    "article nr",
    "artikel",
    "artikel nr",
    "artikel no",
    "art no",
    "art nr",
    "art number",
    "sku",
    "sku no",
    "malzeme",
    "malzeme kodu",
    "stok kodu",
    "urun kodu",
    "product code",
    "product no",
    "product number",
    "item code",
    "item no",
    "part no",
    "part number",
    "pn",
    "ean",
    "barcode",
    "barkod",
  ];
  const altExact = [
    "alternative",
    "alternative article",
    "alternative lot",
    "alt article",
    "alt lot",
    "alt sku",
    "alternatif",
    "alternatif kod",
    "alternatif artikel",
    "alternatif lot",
    "web lot",
    "web lot nr",
    "web lot no",
    "equivalent",
    "old article",
    "old sku",
  ];
  const lotExact = [
    "lot",
    "lot no",
    "lot number",
    "lot nr",
    "lot kodu",
    "parti",
    "parti no",
    "parti numarasi",
    "batch",
    "batch no",
    "batch number",
  ];

  const nameExact = [
    "name",
    "product name",
    "product",
    "item name",
    "item",
    "description",
    "desc",
    "urun",
    "urun adi",
    "urun ad",
    "malzeme adi",
    "malzeme ad",
    "aciklama",
    "bezeichnung",
    "artikelbezeichnung",
    "produktname",
    "produkt",
  ];

  if (kind === "lot") {
    if (lotExact.includes(h)) return 100;
    if (/\blot\b/.test(h) || /\bbatch\b/.test(h) || /\bparti\b/.test(h)) return 70;
    return 0;
  }
  if (kind === "alternative") {
    if (altExact.includes(h)) return 100;
    if (/\balt\b/.test(h) || h.includes("alternat") || h.includes("equiv")) return 70;
    return 0;
  }
  if (kind === "name") {
    if (nameExact.includes(h)) return 100;
    if (h.includes("name") || h.includes("adi") || h.includes("aciklama") || h.includes("desc") || h.includes("bezeich"))
      return 70;
    return 0;
  }
  if (articleExact.includes(h)) return 100;
  if (/\barticle\b/.test(h) || /\bartikel\b/.test(h) || /\bsku\b/.test(h) || h.includes("malzeme"))
    return 60;
  if (h.includes("kod") || h.includes("code") || h.includes("barcode") || h.includes("barkod"))
    return 40;
  return 0;
}

export function detectColumns(headers: string[]): ColumnMapping {
  let article: string | null = null;
  let alternative: string | null = null;
  let lot: string | null = null;
  let name: string | null = null;
  let articleScore = 0;
  let altScore = 0;
  let lotScore = 0;
  let nameScore = 0;

  for (const header of headers) {
    const a = scoreHeader(header, "article");
    const alt = scoreHeader(header, "alternative");
    const l = scoreHeader(header, "lot");
    const n = scoreHeader(header, "name");
    if (a > articleScore) {
      article = header;
      articleScore = a;
    }
    if (alt > altScore) {
      alternative = header;
      altScore = alt;
    }
    if (l > lotScore) {
      lot = header;
      lotScore = l;
    }
    if (n > nameScore) {
      name = header;
      nameScore = n;
    }
  }

  if (article && alternative && article === alternative) {
    if (altScore >= articleScore) article = headers.find((h) => h !== alternative) ?? article;
    else alternative = null;
  }
  if (article && lot && article === lot) {
    if (lotScore >= articleScore) article = headers.find((h) => h !== lot) ?? article;
    else lot = headers.find((h) => h !== article) ?? lot;
  }
  if (alternative && lot && alternative === lot) {
    alternative = null;
  }

  const fallbackArticle = article ?? headers[0] ?? "";
  const fallbackLot =
    lot && lot !== fallbackArticle
      ? lot
      : (headers.find((h) => h !== fallbackArticle) ?? fallbackArticle);
  if (name === fallbackArticle || name === fallbackLot || name === alternative) name = null;

  return {
    article: fallbackArticle,
    alternative: alternative && alternative !== fallbackArticle && alternative !== fallbackLot ? alternative : null,
    lot: fallbackLot,
    name,
  };
}

export function reuseColumns(existing: ColumnMapping | null, headers: string[]): ColumnMapping {
  const detected = detectColumns(headers);
  if (!existing) return detected;
  const has = (header: string | null | undefined): header is string =>
    Boolean(header && headers.includes(header));
  return {
    article: has(existing.article) ? existing.article : detected.article,
    lot: has(existing.lot) ? existing.lot : detected.lot,
    alternative:
      existing.alternative === null
        ? null
        : has(existing.alternative)
          ? existing.alternative
          : detected.alternative,
    name: existing.name === null ? null : has(existing.name) ? existing.name : detected.name,
  };
}

export type LookupIndex = {
  article: Map<string, RawRow[]>;
  alternative: Map<string, RawRow[]>;
  lot: Map<string, RawRow[]>;
  names: Array<{ key: string; row: RawRow }>;
};

function pushMap(map: Map<string, RawRow[]>, key: string, row: RawRow) {
  const list = map.get(key);
  if (list) list.push(row);
  else map.set(key, [row]);
}

export function buildIndex(rows: RawRow[], columns: ColumnMapping): LookupIndex {
  const article = new Map<string, RawRow[]>();
  const alternative = new Map<string, RawRow[]>();
  const lot = new Map<string, RawRow[]>();
  const names: Array<{ key: string; row: RawRow }> = [];
  for (const row of rows) {
    const a = normalize(row[columns.article] ?? "");
    if (a) pushMap(article, a, row);
    if (columns.alternative) {
      const alt = normalize(row[columns.alternative] ?? "");
      if (alt) pushMap(alternative, alt, row);
    }
    const lotVal = normalize(row[columns.lot] ?? "");
    if (lotVal) pushMap(lot, lotVal, row);
    if (columns.name) {
      const nameVal = normalize(row[columns.name] ?? "");
      if (nameVal) names.push({ key: nameVal, row });
    }
  }
  return { article, alternative, lot, names };
}

function fieldsFor(row: RawRow): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [];
  for (const [label, value] of Object.entries(row)) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    fields.push({ label, value: trimmed });
  }
  return fields;
}

function toHit(row: RawRow, columns: ColumnMapping, via: MatchVia): MatchHit {
  return {
    lot: (row[columns.lot] ?? "").trim(),
    article: (row[columns.article] ?? "").trim(),
    alternative: columns.alternative ? (row[columns.alternative] ?? "").trim() : "",
    name: columns.name ? (row[columns.name] ?? "").trim() : "",
    via,
    fields: fieldsFor(row),
    others: [],
  };
}

function rowKey(row: RawRow): string {
  return JSON.stringify(row);
}

function groupHits(rows: RawRow[], columns: ColumnMapping, via: MatchVia): MatchHit[] {
  const groups = new Map<string, RawRow[]>();
  const order: string[] = [];
  for (const row of rows) {
    const lot = normalize(row[columns.lot] ?? "") || rowKey(row);
    const list = groups.get(lot);
    if (list) list.push(row);
    else {
      groups.set(lot, [row]);
      order.push(lot);
    }
  }
  return order.map((key) => {
    const grouped = groups.get(key)!;
    const primary = toHit(grouped[0]!, columns, via);
    primary.others = grouped.slice(1).map((row) => ({ fields: fieldsFor(row) }));
    return primary;
  });
}

export function lookupExact(
  query: string,
  index: LookupIndex,
  columns: ColumnMapping,
): MatchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const primary = index.article.get(q);
  if (primary && primary.length > 0) return groupHits(primary, columns, "article");
  const alt = index.alternative.get(q);
  if (alt && alt.length > 0) return groupHits(alt, columns, "alternative");
  const lots = index.lot.get(q);
  if (lots && lots.length > 0) return groupHits(lots, columns, "lot");
  if (q.length >= 2 && index.names.length > 0) {
    const matched: RawRow[] = [];
    const seen = new Set<string>();
    for (const entry of index.names) {
      if (!entry.key.includes(q)) continue;
      const id = rowKey(entry.row);
      if (seen.has(id)) continue;
      seen.add(id);
      matched.push(entry.row);
      if (matched.length >= 40) break;
    }
    if (matched.length > 0) return groupHits(matched, columns, "name");
  }
  return [];
}
