import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  FileSpreadsheet,
  LoaderCircle,
  Monitor,
  Moon,
  RefreshCw,
  Settings2,
  Sun,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { parseWorkbook } from "@/lib/catalog/file";
import { buildIndex, detectColumns, lookupExact, reuseColumns } from "@/lib/catalog/parse";
import { loadGoogleSheet, parseSheetsUrl } from "@/lib/catalog/sheets";
import {
  clearCatalog,
  loadCatalog,
  loadSettings,
  replaceCatalog,
  saveSettings,
} from "@/lib/catalog/storage";
import type { Catalog, ColumnMapping, MatchHit, Settings, Source } from "@/lib/catalog/types";
import { DEFAULT_SETTINGS } from "@/lib/catalog/types";
import {
  formatAgo,
  LOCALE_LABEL,
  LOCALES,
  localeTag,
  resolveTheme,
  t,
  type Locale,
  type MessageKey,
  type Theme,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Screen = "lookup" | "source";

function applyChrome(locale: Locale, theme: Theme) {
  if (typeof document === "undefined") return;
  const appearance = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", appearance === "dark");
  root.lang = locale;
  root.style.colorScheme = appearance;
  document.title = t(locale, "appName");
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", appearance === "dark" ? "#0c0d0f" : "#ffffff");
}

function catalogSubtitle(settings: Settings): string {
  const tr = (key: MessageKey) => t(settings.locale, key);
  if (settings.source?.kind === "file") return settings.source.fileName;
  if (settings.source?.kind === "sheets") {
    return settings.catalogTitle || settings.source.title || tr("googleSheet");
  }
  return tr("tagline");
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
      try {
        const stored = loadSettings();
        const data = await loadCatalog();
        if (cancelled) return;
        const usable = stored.source ? data : null;
        if (usable && stored.columns && !stored.columns.name) {
          const detected = detectColumns(usable.headers);
          if (detected.name) {
            stored.columns = { ...stored.columns, name: detected.name };
          }
        }
        if (!stored.catalogTitle && stored.source) {
          stored.catalogTitle =
            stored.source.kind === "file"
              ? stored.source.fileName
              : stored.source.title || t(stored.locale, "googleSheet");
        }
        saveSettings(stored);
        applyChrome(stored.locale, stored.theme);
        if (!stored.source && data) void clearCatalog();
        if (!stored.source && (stored.columns || stored.loadedAt)) {
          stored.columns = null;
          stored.loadedAt = null;
          saveSettings(stored);
        }
        setSettings(stored);
        setCatalog(usable);
        setScreen(usable && stored.columns ? "lookup" : "source");
      } catch {
        if (cancelled) return;
        applyChrome(DEFAULT_SETTINGS.locale, DEFAULT_SETTINGS.theme);
        setCatalog(null);
        setScreen("source");
      }
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

  useEffect(() => {
    applyChrome(settings.locale, settings.theme);
    if (settings.theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyChrome(settings.locale, "system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings.locale, settings.theme]);

  const persist = useCallback((next: Settings, nextCatalog: Catalog | null) => {
    persistSettings(next);
    setCatalog(nextCatalog);
    if (nextCatalog) void replaceCatalog(nextCatalog);
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
          catalogTitle:
            source.kind === "file"
              ? source.fileName
              : source.title || t(settings.locale, "googleSheet"),
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
      { ...settings, source: null, columns: null, loadedAt: null, catalogTitle: "" },
      null,
    );
    setScreen("source");
    setError(null);
  }, [persist, settings]);

  const onRefreshSheet = useCallback(async () => {
    if (settings.source?.kind !== "sheets") return;
    setBusy(true);
    setError(null);
    try {
      const loaded = await loadGoogleSheet(settings.source.url);
      const mapping = reuseColumns(settings.columns, loaded.headers);
      onLoaded(
        { headers: loaded.headers, rows: loaded.rows },
        {
          kind: "sheets",
          url: settings.source.url,
          id: loaded.ref.id,
          gid: loaded.ref.gid,
          title: loaded.title || settings.source.title,
        },
        mapping,
      );
    } catch {
      setError(t(settings.locale, "loadFailed"));
      setScreen("source");
    } finally {
      setBusy(false);
    }
  }, [onLoaded, settings]);

  const columns = settings.columns;
  const index = useMemo(
    () => (catalog && columns ? buildIndex(catalog.rows, columns) : null),
    [catalog, columns],
  );
  const locale = settings.locale;
  const tr = useCallback((key: MessageKey) => t(locale, key), [locale]);

  return (
    <TooltipProvider>
    <div className="flex min-h-dvh flex-col px-4 pb-8 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <Header
          settings={settings}
          hasCatalog={Boolean(catalog && columns)}
          screen={screen}
          busy={busy}
          onToggle={() => setScreen(screen === "lookup" ? "source" : "lookup")}
          onRefresh={settings.source?.kind === "sheets" ? onRefreshSheet : undefined}
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
            onShowDetails={(showDetails) => persistSettings({ ...settings, showDetails })}
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
    </TooltipProvider>
  );
}

function Header({
  settings,
  hasCatalog,
  screen,
  busy,
  onToggle,
  onRefresh,
}: {
  settings: Settings;
  hasCatalog: boolean;
  screen: Screen;
  busy: boolean;
  onToggle: () => void;
  onRefresh?: () => void;
}) {
  const tr = (key: MessageKey) => t(settings.locale, key);
  const title = tr("appName");
  const subtitle = catalogSubtitle(settings);
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-card-2 shadow-[var(--shadow-border)]">
          <LotMark />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-tight text-foreground" title={title}>
            {title}
          </p>
          <p className="truncate text-xs text-subtle" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>
      {hasCatalog ? (
        <div className="flex shrink-0 items-center gap-1">
          {onRefresh && screen === "lookup" ? (
            <Button
              variant="secondary"
              size="icon"
              onClick={onRefresh}
              disabled={busy}
              aria-label={tr("refresh")}
            >
              <RefreshCw className={busy ? "animate-spin" : undefined} />
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggle}
            aria-label={screen === "lookup" ? tr("settings") : tr("back")}
          >
            {screen === "lookup" ? <Settings2 /> : <ArrowLeft />}
          </Button>
        </div>
      ) : null}
    </header>
  );
}

function LotMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
      <rect
        x="1"
        y="0.75"
        width="22"
        height="22.5"
        rx="2.6"
        fill="currentColor"
        className="text-paper"
      />
      <rect
        x="1"
        y="0.75"
        width="22"
        height="22.5"
        rx="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        style={{ stroke: "color-mix(in oklab, var(--ink) 28%, transparent)" }}
      />
      <circle cx="12" cy="6.6" r="2.05" fill="currentColor" className="text-hole" />
      <rect x="5" y="11.4" width="14" height="2.3" rx="0.7" fill="currentColor" className="text-accent-deep" />
      <rect x="5" y="16.4" width="9.5" height="2.3" rx="0.7" fill="currentColor" className="text-ink" />
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

  const sourceLabel = settings.catalogTitle
    || (settings.source?.kind === "file"
      ? settings.source.fileName
      : settings.source?.kind === "sheets"
        ? settings.source.title || tr("googleSheet")
        : tr("catalog"));

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
              <LotTag
                key={`${hit.lot}-${hit.article}-${i}`}
                hit={hit}
                tr={tr}
                defaultOpen={settings.showDetails}
              />
            ))}
          </div>
        ) : showMiss ? (
          <MissCard query={query} tr={tr} />
        ) : null}
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

function LotTag({
  hit,
  tr,
  defaultOpen,
}: {
  hit: MatchHit;
  tr: (key: MessageKey) => string;
  defaultOpen: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const extraCount = hit.others.length;
  const viaLabel =
    hit.via === "alternative"
      ? tr("matchedAlt")
      : hit.via === "lot"
        ? tr("matchedLot")
        : hit.via === "name"
          ? tr("matchedName")
          : null;

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen, hit.lot, hit.article]);

  async function copyLot() {
    if (!hit.lot) return;
    const ok = await copyText(hit.lot);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className="lot-tag">
      <span className="lot-tag-hole" aria-hidden="true" />
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">{tr("lot")}</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <p className="min-w-0 break-all font-mono text-lot font-medium leading-none tracking-tight text-ink">
          {hit.lot || "—"}
        </p>
        <Tooltip label={copied ? tr("copied") : tr("copy")}>
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted"
            onClick={() => void copyLot()}
            aria-label={`${tr("lot")} ${hit.lot}. ${tr("copy")}`}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </Tooltip>
      </div>
      {hit.article ? (
        <p className="mt-3 break-all font-mono text-sm text-ink">{hit.article}</p>
      ) : null}
      {hit.name ? <p className="mt-1 break-words text-sm text-ink-muted">{hit.name}</p> : null}
      {viaLabel ? (
        <p className="mt-2 text-xs text-ink-muted">
          {tr("matchedOn")}: {viaLabel}
        </p>
      ) : null}
      {open ? (
        <div className="mt-5 border-t border-ink/10 pt-4 text-left">
          <dl className="space-y-2 text-sm">
            {hit.fields.map((field) => (
              <div key={field.label} className="grid grid-cols-2 gap-3">
                <dt className="text-ink-muted">{field.label}</dt>
                <dd className="break-all text-right font-mono text-ink">{field.value}</dd>
              </div>
            ))}
          </dl>
          {hit.others.map((row, i) => (
            <div key={i} className="mt-4 border-t border-ink/10 pt-4">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
                {tr("otherRows")} {i + 2}
              </p>
              <dl className="space-y-2 text-sm">
                {row.fields.map((field) => (
                  <div key={field.label} className="grid grid-cols-2 gap-3">
                    <dt className="text-ink-muted">{field.label}</dt>
                    <dd className="break-all text-right font-mono text-ink">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : extraCount > 0 ? (
        <p className="mt-3 text-xs text-ink-muted">
          +{extraCount} {tr("otherRows").toLowerCase()}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mx-auto mt-2 inline-flex min-h-11 items-center justify-center gap-1 text-xs font-medium text-ink-muted"
        aria-expanded={open}
      >
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")} />
        {open ? tr("hideDetails") : tr("showDetails")}
      </button>
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
  onShowDetails,
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
  onShowDetails: (value: boolean) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [confirmKind, setConfirmKind] = useState<null | "clear" | "replace">(null);
  const pendingLoad = useRef<null | (() => void)>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const columns = settings.columns;
  const headers = catalog?.headers ?? [];

  function runOrConfirmReplace(action: () => void) {
    if (!catalog) {
      action();
      return;
    }
    pendingLoad.current = action;
    setConfirmKind("replace");
  }

  async function loadSheet(urlOverride?: string, opts?: { preserveColumns?: boolean }) {
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
      const mapping = opts?.preserveColumns
        ? reuseColumns(settings.columns, loaded.headers)
        : detectColumns(loaded.headers);
      onLoaded(
        { headers: loaded.headers, rows: loaded.rows },
        { kind: "sheets", url, id: loaded.ref.id, gid: loaded.ref.gid, title: loaded.title },
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
        { kind: "file", fileName: file.name, title: file.name },
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
        <Button
          className="mt-4 w-full"
          onClick={() => runOrConfirmReplace(() => void loadSheet())}
          disabled={busy}
          tooltip={tr("loadSheet")}
        >
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
          if (file) runOrConfirmReplace(() => void loadFile(file));
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
            if (file) runOrConfirmReplace(() => void loadFile(file));
            e.currentTarget.value = "";
          }}
        />
        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          tooltip={tr("chooseFile")}
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
              id="col-name"
              label={tr("productName")}
              value={columns.name ?? ""}
              headers={headers}
              allowNone
              noneLabel={tr("none")}
              onChange={(name) => onColumnsChange({ ...columns, name: name || null })}
            />
            <FieldSelect
              id="col-article"
              label={tr("article")}
              value={columns.article}
              headers={headers}
              noneLabel={tr("none")}
              onChange={(article) => onColumnsChange({ ...columns, article })}
            />
            <FieldSelect
              id="col-lot"
              label={tr("lotNumber")}
              value={columns.lot}
              headers={headers}
              noneLabel={tr("none")}
              onChange={(lot) => onColumnsChange({ ...columns, lot })}
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
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={onDone} tooltip={tr("lookUp")}>
              {tr("lookUp")}
            </Button>
            {settings.source?.kind === "sheets" ? (
              <Button
                variant="secondary"
                onClick={() =>
                  void loadSheet(
                    settings.source?.kind === "sheets" ? settings.source.url : undefined,
                    { preserveColumns: true },
                  )
                }
                disabled={busy}
                tooltip={tr("refresh")}
              >
                <RefreshCw />
                {tr("refresh")}
              </Button>
            ) : null}
          </div>
          <p className="mt-3 px-1 text-xs text-subtle">
            {catalog.rows.length.toLocaleString(localeTag(settings.locale))} {tr("rows")}
            {settings.source?.kind === "file" ? ` · ${settings.source.fileName}` : null}
            {settings.source?.kind === "sheets"
              ? ` · ${settings.catalogTitle || settings.source.title || tr("googleSheet")}`
              : null}
          </p>
          <button
            type="button"
            onClick={() => setConfirmKind("clear")}
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
            <button
              type="button"
              role="radio"
              aria-checked={settings.theme === "system"}
              onClick={() => onTheme("system")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out",
                settings.theme === "system"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted shadow-[var(--shadow-border)] hover:text-foreground",
              )}
            >
              <Monitor className="size-4" />
              {tr("themeSystem")}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 px-1 text-xs font-medium text-muted">{tr("detailsOption")}</p>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={tr("detailsOption")}>
            <button
              type="button"
              role="radio"
              aria-checked={settings.showDetails}
              onClick={() => onShowDetails(true)}
              className={cn(
                "h-11 min-w-11 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out",
                settings.showDetails
                  ? "bg-primary text-primary-foreground"
                  : "text-muted shadow-[var(--shadow-border)] hover:text-foreground",
              )}
            >
              {tr("detailsShow")}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!settings.showDetails}
              onClick={() => onShowDetails(false)}
              className={cn(
                "h-11 min-w-11 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out",
                !settings.showDetails
                  ? "bg-primary text-primary-foreground"
                  : "text-muted shadow-[var(--shadow-border)] hover:text-foreground",
              )}
            >
              {tr("detailsHide")}
            </button>
          </div>
        </div>
      </section>

      <p className="px-1 pt-2 text-center text-xs tracking-wide text-subtle">
        {`${tr("appName")} ${tr("appVersion")}`}
      </p>

      <ConfirmDialog
        open={confirmKind !== null}
        title={confirmKind === "replace" ? tr("confirmReplaceTitle") : tr("confirmClearTitle")}
        body={confirmKind === "replace" ? tr("confirmReplaceBody") : tr("confirmClearBody")}
        confirmLabel={confirmKind === "replace" ? tr("confirmReplaceAction") : tr("confirmAction")}
        cancelLabel={tr("cancel")}
        onCancel={() => {
          pendingLoad.current = null;
          setConfirmKind(null);
        }}
        onConfirm={() => {
          if (confirmKind === "clear") onClear();
          else pendingLoad.current?.();
          pendingLoad.current = null;
          setConfirmKind(null);
        }}
      />
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
