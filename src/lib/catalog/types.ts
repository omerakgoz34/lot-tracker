import type { Locale, Theme } from "@/lib/i18n";

export type RawRow = Record<string, string>;

export type ColumnMapping = {
  article: string;
  alternative: string | null;
  lot: string;
  name: string | null;
  expiry?: string | null;
};

export type Source =
  | { kind: "sheets"; url: string; id: string; gid: string; title?: string }
  | { kind: "file"; fileName: string; title?: string };

export type Settings = {
  sheetUrl: string;
  source: Source | null;
  columns: ColumnMapping | null;
  loadedAt: number | null;
  locale: Locale;
  theme: Theme;
  catalogTitle: string;
  showDetails: boolean;
};

export type Catalog = {
  headers: string[];
  rows: RawRow[];
  sheetNames?: string[];
  activeSheet?: string;
};

export type MatchVia = "article" | "alternative" | "lot" | "name";

export type MatchHit = {
  lot: string;
  article: string;
  alternative: string;
  name: string;
  via: MatchVia;
  fields: { label: string; value: string }[];
  others: { fields: { label: string; value: string }[] }[];
};

export const SETTINGS_KEY = "lot-tracker.settings.v1";
export const DEFAULT_SETTINGS: Settings = {
  sheetUrl: "",
  source: null,
  columns: null,
  loadedAt: null,
  locale: "tr",
  theme: "light",
  catalogTitle: "",
  showDetails: false,
};

export function coerceColumns(raw: unknown): ColumnMapping | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<ColumnMapping>;
  if (typeof c.article !== "string" || typeof c.lot !== "string") return null;
  const mapped: ColumnMapping = {
    article: c.article,
    alternative: typeof c.alternative === "string" && c.alternative ? c.alternative : null,
    lot: c.lot,
    name: typeof c.name === "string" && c.name ? c.name : null,
  };
  if ("expiry" in c) {
    mapped.expiry = typeof c.expiry === "string" && c.expiry ? c.expiry : null;
  }
  return mapped;
}

export function displayCatalogTitle(source: Source | null, fallback: string): string {
  if (!source) return fallback;
  if (source.kind === "file") return source.title || source.fileName || fallback;
  return source.title || fallback;
}
