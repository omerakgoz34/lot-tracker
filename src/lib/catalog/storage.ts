import { coerceColumns, DEFAULT_SETTINGS, SETTINGS_KEY, type Catalog, type Settings, type Source } from "./types";

const DB_NAME = "lot-tracker";
const DB_VERSION = 1;
const STORE = "kv";
const CATALOG_KEY = "catalog.v1";
const LEGACY_DB_NAMES = ["lotkeep", "lotkeep-catalog", "depo-lot-takip"];
const LEGACY_SETTINGS_KEY = "lotkeep.settings.v1";

function canUseLocalStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "__depo_lot_t";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function canUseIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function parseSource(value: unknown): Source | null {
  if (!value || typeof value !== "object") return null;
  const src = value as {
    kind?: string;
    url?: string;
    id?: string;
    gid?: string;
    fileName?: string;
    title?: string;
  };
  if (src.kind === "sheets" && src.url && src.id && src.gid) {
    return { kind: "sheets", url: src.url, id: src.id, gid: src.gid, title: src.title };
  }
  if (src.kind === "file" && src.fileName) {
    return { kind: "file", fileName: src.fileName, title: src.title };
  }
  return null;
}

export function loadSettings(): Settings {
  if (!canUseLocalStorage()) return { ...DEFAULT_SETTINGS };
  try {
    const raw =
      window.localStorage.getItem(SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings> & { source?: unknown };
    const locale = parsed.locale === "en" || parsed.locale === "de" ? parsed.locale : "tr";
    const theme =
      parsed.theme === "dark" || parsed.theme === "system" ? parsed.theme : "light";
    return {
      sheetUrl: typeof parsed.sheetUrl === "string" ? parsed.sheetUrl : "",
      source: parseSource(parsed.source),
      columns: coerceColumns(parsed.columns),
      loadedAt: typeof parsed.loadedAt === "number" ? parsed.loadedAt : null,
      locale,
      theme,
      catalogTitle: typeof parsed.catalogTitle === "string" ? parsed.catalogTitle : "",
      showDetails: parsed.showDetails === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Safari private / blocked storage
  }
}

function pruneLegacyLocalStorage(): void {
  if (!canUseLocalStorage()) return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key) keys.push(key);
  }
  for (const key of keys) {
    if (key === SETTINGS_KEY) continue;
    if (
      key.startsWith("lotkeep") ||
      key.startsWith("depo-lot") ||
      key.startsWith("depo_lot")
    ) {
      window.localStorage.removeItem(key);
    }
  }
}

let currentDb: IDBDatabase | null = null;

function closeDb(): void {
  if (!currentDb) return;
  try {
    currentDb.close();
  } catch {
    // ignore
  }
  currentDb = null;
}

function openNamed(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB failed"));
  });
}

function openDb(): Promise<IDBDatabase> {
  return openNamed(DB_NAME).then((db) => {
    currentDb = db;
    currentDb.onversionchange = () => closeDb();
    return currentDb;
  });
}

function readCatalog(db: IDBDatabase): Promise<Catalog | null> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(STORE)) {
      resolve(null);
      return;
    }
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(CATALOG_KEY);
    req.onsuccess = () => resolve((req.result as Catalog | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function loadLegacyCatalog(): Promise<Catalog | null> {
  if (!canUseIndexedDb() || !indexedDB.databases) return null;
  const names = new Set((await indexedDB.databases()).map((db) => db.name));
  for (const name of LEGACY_DB_NAMES) {
    if (!names.has(name)) continue;
    const db = await openNamed(name);
    try {
      const catalog = await readCatalog(db);
      if (catalog) return catalog;
    } finally {
      db.close();
    }
  }
  return null;
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    const timer = window.setTimeout(resolve, 1200);
    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };
    req.onsuccess = done;
    req.onerror = done;
    req.onblocked = done;
  });
}

export async function wipeCatalogStorage(): Promise<void> {
  pruneLegacyLocalStorage();
  if (!canUseIndexedDb()) return;
  closeDb();
  await deleteDatabase(DB_NAME);
  for (const name of LEGACY_DB_NAMES) {
    await deleteDatabase(name);
  }
}

export async function loadCatalog(): Promise<Catalog | null> {
  if (!canUseIndexedDb()) return null;
  try {
    const db = await openDb();
    const current = await readCatalog(db);
    if (current) return current;
    closeDb();
    const legacy = await loadLegacyCatalog();
    if (!legacy) return null;
    await saveCatalog(legacy);
    return legacy;
  } catch {
    return null;
  }
}

export async function saveCatalog(catalog: Catalog): Promise<void> {
  if (!canUseIndexedDb()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    store.put(catalog, CATALOG_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function replaceCatalog(catalog: Catalog): Promise<void> {
  await wipeCatalogStorage();
  await saveCatalog(catalog);
}

export async function clearCatalog(): Promise<void> {
  await wipeCatalogStorage();
}
