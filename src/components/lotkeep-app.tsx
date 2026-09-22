import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  FileSpreadsheet,
  LoaderCircle,
  Moon,
  RefreshCw,
  Settings2,
  Sun,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseWorkbook } from "@/lib/catalog/file";
import { buildIndex, detectColumns, lookupExact } from "@/lib/catalog/parse";
import { loadGoogleSheet, parseSheetsUrl } from "@/lib/catalog/sheets";
import {
  clearCatalog,
  loadCatalog,
  loadSettings,
  saveCatalog,
  saveSettings,
} from "@/lib/catalog/storage";
import type { Catalog, ColumnMapping, MatchHit, Settings, Source } from "@/lib/catalog/types";
import { DEFAULT_SETTINGS } from "@/lib/catalog/types";
import {
  formatAgo,
  LOCALE_LABEL,
  LOCALES,
  localeTag,
  t,
  type Locale,
  type MessageKey,
  type Theme,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Screen = "lookup" | "source";

function applyChrome(locale: Locale, theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.lang = locale;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "dark" ? "#0c0d0f" : "#ffffff");
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  } catch {
    return false;
  }
}

export function LotKeepApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [screen, setScreen] = useState<Screen>("source");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyChrome(DEFAULT_SETTINGS.locale, DEFAULT_SETTINGS.theme);
    let cancelled = false;
    (async () => {
      const stored = loadSettings();
      const data = await loadCatalog();
      if (cancelled) return;
      applyChrome(stored.locale, stored.theme);
      const usable = stored.source ? data : null;
      if (!stored.source && data) void clearCatalog();
      if (!stored.source && (stored.columns || stored.loadedAt)) {
        stored.columns = null;
        stored.loadedAt = null;
        saveSettings(stored);
      }
      setSettings(stored);
      setCatalog(usable);
      setScreen(usable && stored.columns ? "lookup" : "source");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
    applyChrome(next.locale, next.theme);
  }, []);

  const persist = useCallback((next: Settings, nextCatalog: Catalog | null) => {
    persistSettings(next);
    setCatalog(nextCatalog);
    if (nextCatalog) void saveCatalog(nextCatalog);
    else void clearCatalog();
  }, [persistSettings]);

  const onLoaded = useCallback(
    (nextCatalog: Catalog, source: Source, columns: ColumnMapping) => {
      persist(
        {
          ...settings,
          source,
          columns,
          loadedAt: Date.now(),
          sheetUrl: source.kind === "sheets" ? source.url : settings.sheetUrl,
        },
        nextCatalog,
      );
      setError(null);
      setScreen("lookup");
    },
    [persist, settings],
  );

  const onColumnsChange = useCallback(
    (columns: ColumnMapping) => {
      persistSettings({ ...settings, columns });
    },
    [persistSettings, settings],
  );

  const onClear = useCallback(() => {
    persist(
      { ...settings, source: null, columns: null, loadedAt: null },
      null,
    );
    setScreen("source");
    setError(null);
  }, [persist, settings]);

  const columns = settings.columns;
  const index = useMemo(
    () => (catalog && columns ? buildIndex(catalog.rows, columns) : null),
    [catalog, columns],
  );
  const locale = settings.locale;
  const tr = useCallback((key: MessageKey) => t(locale, key), [locale]);

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-8 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <Header
          settings={settings}
          hasCatalog={Boolean(catalog && columns)}
          screen={screen}
          onToggle={() => setScreen(screen === "lookup" ? "source" : "lookup")}
        />
        {screen === "source" || !catalog || !columns || !index ? (
          <SourceView
            settings={settings}
            catalog={catalog}
            busy={busy}
            error={error}
            tr={tr}
            setBusy={setBusy}
            setError={setError}
            setSheetUrl={(sheetUrl) => persistSettings({ ...settings, sheetUrl })}
            onLoaded={onLoaded}
            onColumnsChange={onColumnsChange}
            onClear={onClear}
            onDone={() => setScreen("lookup")}
            onLocale={(next) => persistSettings({ ...settings, locale: next })}
            onTheme={(next) => persistSettings({ ...settings, theme: next })}
          />
        ) : (
          <LookupView
            catalog={catalog}
            settings={settings}
            index={index}
            tr={tr}
            onOpenSource={() => setScreen("source")}
          />
        )}
      </div>
    </div>
  );
}

function Header({
  settings,
  hasCatalog,
  screen,
  onToggle,
}: {
  settings: Settings;
  hasCatalog: boolean;
  screen: Screen;
  onToggle: () => void;
}) {
  const tr = (key: MessageKey) => t(settings.locale, key);
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-card shadow-[var(--shadow-border)]">
          <LotMark />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-tight text-foreground">{tr("appName")}</p>
          <p className="text-xs text-subtle">{tr("tagline")}</p>
        </div>
      </div>
      {hasCatalog ? (
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggle}
          aria-label={screen === "lookup" ? tr("settings") : tr("back")}
        >
          {screen === "lookup" ? <Settings2 /> : <ArrowLeft />}
        </Button>
      ) : null}
    </header>
  );
}

function LotMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <rect
        x="5.5"
        y="4.5"
        width="13"
        height="15"
        rx="1.8"
        fill="currentColor"
        className="text-paper"
        stroke="currentColor"
        strokeWidth="1"
        style={{ stroke: "color-mix(in oklab, var(--ink) 28%, transparent)" }}
      />
      <circle cx="12" cy="8" r="1.4" fill="currentColor" className="text-hole" />
      <rect x="8" y="12" width="8" height="1.6" rx="0.6" fill="currentColor" className="text-accent-deep" />
      <rect x="8" y="15.4" width="5.5" height="1.6" rx="0.6" fill="currentColor" className="text-ink" />
    </svg>
  );
}

function LookupView({
  catalog,
  settings,
  index,
  tr,
  onOpenSource,
}: {
  catalog: Catalog;
  settings: Settings;
  index: ReturnType<typeof buildIndex>;
  tr: (key: MessageKey) => string;
  onOpenSource: () => void;
}) {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const columns = settings.columns!;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const liveHits = useMemo(
    () => lookupExact(query, index, columns),
    [query, index, columns],
  );
  const committedHits = useMemo(
    () => lookupExact(committed, index, columns),
    [committed, index, columns],
  );

  const showHits =
    liveHits.length > 0
      ? liveHits
      : query.trim() && committed.trim() === query.trim()
        ? committedHits
        : [];
  const showMiss =
    Boolean(committed.trim()) &&
    committed.trim() === query.trim() &&
    liveHits.length === 0;

  const sourceLabel =
    settings.source?.kind === "sheets"
      ? tr("googleSheet")
      : settings.source?.kind === "file"
        ? settings.source.fileName
        : tr("catalog");

  return (
    <div className="flex flex-1 flex-col">
      <form
        className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          setCommitted(query);
        }}
      >
        <Label htmlFor="article-input" className="mb-2 block px-1">
          {tr("articleNumber")}
        </Label>
        <input
          ref={inputRef}
          id="article-input"
          name="article"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPaste={() => {
            requestAnimationFrame(() => {
              const next = inputRef.current?.value ?? "";
              setQuery(next);
              setCommitted(next);
            });
          }}
          onFocus={(e) => e.currentTarget.select()}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="search"
          placeholder={tr("articlePlaceholder")}
          className="h-14 w-full rounded-lg bg-card-2 px-4 font-mono text-lg tracking-wide text-foreground shadow-[var(--shadow-border)] placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-subtle focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
        />
      </form>

      <div className="mt-5 min-h-48" aria-live="polite">
        {showHits.length > 0 ? (
          <div className="flex flex-col gap-3">
            {showHits.map((hit, i) => (
              <LotTag key={`${hit.lot}-${hit.article}-${i}`} hit={hit} tr={tr} />
            ))}
          </div>
        ) : showMiss ? (
          <MissCard query={query} tr={tr} />
        ) : (
          <p className="px-1 text-sm text-subtle">{tr("idleHint")}</p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-8 text-xs text-subtle">
        <button
          type="button"
          onClick={onOpenSource}
          className="min-h-11 text-left transition-colors duration-150 hover:text-muted"
        >
          <span className="tabular-nums text-muted">
            {catalog.rows.length.toLocaleString(localeTag(settings.locale))}
          </span>
          {` ${tr("products")} · `}
          {sourceLabel}
          {settings.loadedAt ? ` · ${formatAgo(settings.loadedAt, settings.locale)}` : ""}
        </button>
        <span className="hidden sm:inline">{tr("pressToFocus")}</span>
      </div>
    </div>
  );
}

function LotTag({ hit, tr }: { hit: MatchHit; tr: (key: MessageKey) => string }) {
  const [copied, setCopied] = useState(false);

  async function copyLot() {
    if (!hit.lot) return;
    const ok = await copyText(hit.lot);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article
      className="lot-tag"
      role="button"
      tabIndex={0}
      onClick={() => void copyLot()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void copyLot();
        }
      }}
      aria-label={`${tr("lot")} ${hit.lot}. ${tr("copy")}`}
    >
      <span className="lot-tag-hole" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">{tr("lot")}</p>
        <span className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-ink-muted">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? tr("copied") : tr("copy")}
        </span>
      </div>
      <p className="mt-3 break-all font-mono text-lot font-medium leading-tight tracking-tight text-ink">
        {hit.lot || "—"}
      </p>
      <dl className="mt-5 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
        {hit.via === "alternative" ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{tr("matchedOn")}</dt>
            <dd className="text-ink">{tr("matchedAlt")}</dd>
          </div>
        ) : null}
        {hit.fields.map((field) => (
          <div key={field.label} className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">{field.label}</dt>
            <dd className="text-right font-mono text-ink break-all">{field.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function MissCard({ query, tr }: { query: string; tr: (key: MessageKey) => string }) {
  return (
    <div className="rounded-3xl bg-card px-5 py-6 shadow-[var(--shadow-border)]">
      <p className="text-sm font-medium text-foreground">{tr("noLot")}</p>
      <p className="mt-1 font-mono text-sm text-muted">{query.trim()}</p>
      <p className="mt-3 text-sm text-subtle">{tr("missHint")}</p>
    </div>
  );
}

function SourceView({
  settings,
  catalog,
  busy,
  error,
  tr,
  setBusy,
  setError,
  setSheetUrl,
  onLoaded,
  onColumnsChange,
  onClear,
  onDone,
  onLocale,
  onTheme,
}: {
  settings: Settings;
  catalog: Catalog | null;
  busy: boolean;
  error: string | null;
  tr: (key: MessageKey) => string;
  setBusy: (v: boolean) => void;
  setError: (v: string | null) => void;
  setSheetUrl: (url: string) => void;
  onLoaded: (catalog: Catalog, source: Source, columns: ColumnMapping) => void;
  onColumnsChange: (columns: ColumnMapping) => void;
  onClear: () => void;
  onDone: () => void;
  onLocale: (locale: Locale) => void;
  onTheme: (theme: Theme) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const columns = settings.columns;
  const headers = catalog?.headers ?? [];

  async function loadSheet(urlOverride?: string) {
    const url = (urlOverride ?? settings.sheetUrl).trim();
    if (!url) {
      setError(tr("pasteLinkFirst"));
      return;
    }
    if (!parseSheetsUrl(url)) {
      setError(tr("notSheetsLink"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const loaded = await loadGoogleSheet(url);
      const mapping = detectColumns(loaded.headers);
      onLoaded(
        { headers: loaded.headers, rows: loaded.rows },
        { kind: "sheets", url, id: loaded.ref.id, gid: loaded.ref.gid },
        mapping,
      );
    } catch {
      setError(tr("loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const workbook = await parseWorkbook(file);
      const first = workbook.sheetNames[0]!;
      const parsed = workbook.sheets[first]!;
      const mapping = detectColumns(parsed.headers);
      onLoaded(
        {
          headers: parsed.headers,
          rows: parsed.rows,
          sheetNames: workbook.sheetNames,
          activeSheet: first,
        },
        { kind: "file", fileName: file.name },
        mapping,
      );
    } catch {
      setError(tr("fileFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-foreground">{tr("loadCatalog")}</h1>
        <p className="mt-2 max-w-md text-sm leading-normal text-muted">{tr("loadHint")}</p>
      </div>

      <section className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex items-center gap-2 px-1">
          <FileSpreadsheet className="size-4 text-accent" />
          <h2 className="text-sm font-medium text-foreground">{tr("googleSheet")}</h2>
        </div>
        <Label htmlFor="sheet-url" className="mb-2 block px-1">
          {tr("spreadsheetLink")}
        </Label>
        <Input
          id="sheet-url"
          value={settings.sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="mt-2 px-1 text-xs leading-normal text-subtle">{tr("shareHint")}</p>
        <Button className="mt-4 w-full" onClick={() => void loadSheet()} disabled={busy}>
          {busy ? <LoaderCircle className="animate-spin" /> : null}
          {tr("loadSheet")}
        </Button>
      </section>

      <section
        className={cn("dropzone rounded-3xl p-4", dragging && "dropzone-active")}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void loadFile(file);
        }}
      >
        <div className="flex items-center gap-2 px-1">
          <Upload className="size-4 text-accent" />
          <h2 className="text-sm font-medium text-foreground">{tr("excelOrCsv")}</h2>
        </div>
        <p className="mt-2 px-1 text-sm text-muted">{tr("dropHint")}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.ods,.tsv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void loadFile(file);
            e.currentTarget.value = "";
          }}
        />
        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {tr("chooseFile")}
        </Button>
      </section>

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {catalog && columns ? (
        <section className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
          <h2 className="px-1 text-sm font-medium text-foreground">{tr("columns")}</h2>
          <p className="mt-1 px-1 text-xs text-subtle">{tr("columnsHint")}</p>
          <div className="mt-4 grid gap-3">
            <FieldSelect
              id="col-article"
              label={tr("article")}
              value={columns.article}
              headers={headers}
              noneLabel={tr("none")}
              onChange={(article) => onColumnsChange({ ...columns, article })}
            />
            <FieldSelect
              id="col-alt"
              label={tr("alternativeArticle")}
              value={columns.alternative ?? ""}
              headers={headers}
              allowNone
              noneLabel={tr("none")}
              onChange={(alternative) =>
                onColumnsChange({ ...columns, alternative: alternative || null })
              }
            />
            <FieldSelect
              id="col-lot"
              label={tr("lot")}
              value={columns.lot}
              headers={headers}
              noneLabel={tr("none")}
              onChange={(lot) => onColumnsChange({ ...columns, lot })}
            />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={onDone}>
              {tr("lookUp")}
            </Button>
            {settings.source?.kind === "sheets" ? (
              <Button
                variant="secondary"
                onClick={() => void loadSheet(settings.source?.kind === "sheets" ? settings.source.url : undefined)}
                disabled={busy}
              >
                <RefreshCw />
                {tr("refresh")}
              </Button>
            ) : null}
          </div>
          <p className="mt-3 px-1 text-xs text-subtle">
            {catalog.rows.length.toLocaleString(localeTag(settings.locale))} {tr("rows")}
            {settings.source?.kind === "file" ? ` · ${settings.source.fileName}` : null}
            {settings.source?.kind === "sheets" ? ` · ${tr("googleSheet")}` : null}
          </p>
          <button
            type="button"
            onClick={onClear}
            className="mt-1 px-1 text-left text-xs text-subtle transition-colors duration-150 hover:text-danger"
          >
            {tr("clearCatalog")}
          </button>
        </section>
      ) : null}

      <section className="rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="px-1 text-sm font-medium text-foreground">{tr("prefs")}</h2>
        <div className="mt-4">
          <p className="mb-2 px-1 text-xs font-medium text-muted">{tr("language")}</p>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={tr("language")}>
            {LOCALES.map((locale) => {
              const active = settings.locale === locale;
              return (
                <button
                  key={locale}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onLocale(locale)}
                  className={cn(
                    "h-11 min-w-11 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted shadow-[var(--shadow-border)] hover:text-foreground",
                  )}
                >
                  {LOCALE_LABEL[locale]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 px-1 text-xs font-medium text-muted">{tr("appearance")}</p>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={tr("appearance")}>
            <button
              type="button"
              role="radio"
              aria-checked={settings.theme === "light"}
              onClick={() => onTheme("light")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out",
                settings.theme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted shadow-[var(--shadow-border)] hover:text-foreground",
              )}
            >
              <Sun className="size-4" />
              {tr("themeLight")}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.theme === "dark"}
              onClick={() => onTheme("dark")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out",
                settings.theme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted shadow-[var(--shadow-border)] hover:text-foreground",
              )}
            >
              <Moon className="size-4" />
              {tr("themeDark")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  headers,
  onChange,
  allowNone = false,
  noneLabel,
}: {
  id: string;
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
  allowNone?: boolean;
  noneLabel: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block px-1">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg bg-card-2 px-3 text-sm text-foreground shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
      >
        {allowNone ? <option value="">{noneLabel}</option> : null}
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </div>
  );
}
