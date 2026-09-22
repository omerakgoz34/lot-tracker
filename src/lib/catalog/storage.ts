import { DEFAULT_SETTINGS, SETTINGS_KEY, type Catalog, type Settings, type Source } from "./types";

const DB_NAME = "lotkeep";
const DB_VERSION = 1;
const STORE = "kv";
const CATALOG_KEY = "catalog.v1";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function parseSource(value: unknown): Source | null {
  if (!value || typeof value !== "object") return null;
  const src = value as { kind?: string; url?: string; id?: string; gid?: string; fileName?: string };
  if (src.kind === "sheets" && src.url && src.id && src.gid) {
    return { kind: "sheets", url: src.url, id: src.id, gid: src.gid };
  }
  if (src.kind === "file" && src.fileName) {
    return { kind: "file", fileName: src.fileName };
  }
  return null;
}

export function loadSettings(): Settings {
  if (!canUseBrowserStorage()) return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings> & { source?: unknown };
    const locale = parsed.locale === "en" || parsed.locale === "de" ? parsed.locale : "tr";
    const theme = parsed.theme === "dark" ? "dark" : "light";
    return {
      sheetUrl: typeof parsed.sheetUrl === "string" ? parsed.sheetUrl : "",
      source: parseSource(parsed.source),
      columns: parsed.columns ?? null,
      loadedAt: typeof parsed.loadedAt === "number" ? parsed.loadedAt : null,
      locale,
      theme,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB failed"));
  });
}

export async function loadCatalog(): Promise<Catalog | null> {
  if (!canUseBrowserStorage()) return null;
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(CATALOG_KEY);
      req.onsuccess = () => {
        const value = req.result as Catalog | undefined;
        resolve(value ?? null);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function saveCatalog(catalog: Catalog): Promise<void> {
  if (!canUseBrowserStorage()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(catalog, CATALOG_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearCatalog(): Promise<void> {
  if (!canUseBrowserStorage()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(CATALOG_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}
