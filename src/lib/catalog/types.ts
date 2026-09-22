import type { Locale, Theme } from "@/lib/i18n";

export type RawRow = Record<string, string>;

export type ColumnMapping = {
  article: string;
  alternative: string | null;
  lot: string;
};

export type Source = { kind: "sheets"; url: string; id: string; gid: string } | { kind: "file"; fileName: string };

export type Settings = {
  sheetUrl: string;
  source: Source | null;
  columns: ColumnMapping | null;
  loadedAt: number | null;
  locale: Locale;
  theme: Theme;
};

export type Catalog = {
  headers: string[];
  rows: RawRow[];
  sheetNames?: string[];
  activeSheet?: string;
};

export type MatchVia = "article" | "alternative";

export type MatchHit = {
  lot: string;
  article: string;
  alternative: string;
  via: MatchVia;
  fields: { label: string; value: string }[];
};

export const SETTINGS_KEY = "lotkeep.settings.v1";
export const DEFAULT_SETTINGS: Settings = {
  sheetUrl: "",
  source: null,
  columns: null,
  loadedAt: null,
  locale: "tr",
  theme: "light",
};
