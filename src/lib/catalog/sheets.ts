import { matrixToRecords } from "./parse";
import type { RawRow } from "./types";

export type SheetsRef = { id: string; gid: string };

const SHEETS_HOST = "docs.google.com";
const SHEET_ID = /^[a-zA-Z0-9_-]{20,160}$/;
const SHEET_GID = /^\d{1,18}$/;

function asSheetsRef(id: string, gid: string): SheetsRef | null {
  if (!SHEET_ID.test(id) || !SHEET_GID.test(gid)) return null;
  return { id, gid };
}

export function parseSheetsUrl(input: string): SheetsRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("/") && !trimmed.includes(":")) {
    return asSheetsRef(trimmed, "0");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== SHEETS_HOST) return null;
  if (url.username || url.password) return null;
  const idMatch = url.pathname.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
  const id = idMatch?.[1] ?? "";
  const gidFromQuery = url.searchParams.get("gid");
  if (gidFromQuery !== null && !SHEET_GID.test(gidFromQuery)) return null;
  const gidFromHash = url.hash.match(/(?:^#|&)gid=(\d{1,18})(?:&|$)/)?.[1] ?? "";
  return asSheetsRef(id, gidFromQuery || gidFromHash || "0");
}

type GvizTable = {
  status?: string;
  table?: {
    cols: Array<{ label?: string; id?: string }>;
    rows?: Array<{ c: Array<{ v?: unknown; f?: string } | null> | null }>;
  };
  errors?: Array<{ message?: string; detailed_message?: string }>;
};

function colLetter(index: number): string {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function cellText(cell: { v?: unknown; f?: string } | null | undefined): string {
  if (!cell) return "";
  const raw = cell.f ?? cell.v;
  return raw == null ? "" : String(raw).trim();
}

function gvizToRecords(data: GvizTable): { headers: string[]; rows: RawRow[] } {
  if (data.status === "error") {
    const msg =
      data.errors?.[0]?.detailed_message ||
      data.errors?.[0]?.message ||
      "Google Sheets returned an error.";
    throw new Error(msg);
  }
  const table = data.table;
  if (!table?.cols?.length) throw new Error("The sheet has no table data.");
  const labels = table.cols.map((col, i) => {
    const label = col?.label?.trim() ?? "";
    if (!label || label.length > 200 || /[\r\n]/.test(label)) return colLetter(i);
    return label;
  });
  const unlabeled = table.cols.every((col) => !col?.label?.trim());
  const matrix: string[][] = [];
  if (!unlabeled) matrix.push(labels);
  for (const row of table.rows ?? []) {
    if (!row) continue;
    const cells = Array.isArray(row.c) ? row.c : [];
    matrix.push(labels.map((_, i) => cellText(cells[i])));
  }
  return matrixToRecords(matrix);
}

function gvizUrl(id: string, gid: string): string {
  const ref = asSheetsRef(id, gid);
  if (!ref) throw new Error("Paste a Google Sheets link from the address bar.");
  const params = new URLSearchParams({
    tqx: "out:json",
    headers: "1",
    tq: "select *",
    gid: ref.gid,
  });
  return `https://${SHEETS_HOST}/spreadsheets/d/${encodeURIComponent(ref.id)}/gviz/tq?${params}`;
}

function parseGvizPayload(text: string): GvizTable {
  const marker = "google.visualization.Query.setResponse(";
  const start = text.indexOf(marker);
  if (start < 0) throw new Error("Could not read that sheet.");
  const body = text.slice(start + marker.length).replace(/\);\s*$/, "");
  const data = JSON.parse(body) as GvizTable;
  if (!data || typeof data !== "object") throw new Error("Could not read that sheet.");
  return data;
}

function canFetchSheets(): boolean {
  if (typeof location === "undefined") return true;
  return location.protocol === "https:" || location.protocol === "http:";
}

let loadQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(run: () => Promise<T>): Promise<T> {
  const queued = loadQueue.then(run, run);
  loadQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

async function loadViaFetch(id: string, gid: string): Promise<{ headers: string[]; rows: RawRow[] }> {
  let response: Response;
  try {
    response = await fetch(gvizUrl(id, gid), { credentials: "omit", mode: "cors" });
  } catch {
    throw new Error("Could not reach Google Sheets from this browser.");
  }
  if (!response.ok) throw new Error("Could not reach Google Sheets from this browser.");
  return gvizToRecords(parseGvizPayload(await response.text()));
}

function loadViaGvizJsonp(id: string, gid: string): Promise<{ headers: string[]; rows: RawRow[] }> {
  const src = gvizUrl(id, gid);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;

    const timeout = window.setTimeout(() => {
      finish(new Error("Timed out loading the Google Sheet."));
    }, 18000);

    function finish(err?: Error, value?: { headers: string[]; rows: RawRow[] }) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.remove();
      delete (window as unknown as { google?: unknown }).google;
      if (err) reject(err);
      else if (value) resolve(value);
    }

    (window as unknown as { google: unknown }).google = {
      visualization: {
        Query: {
          setResponse(data: GvizTable) {
            try {
              finish(undefined, gvizToRecords(data));
            } catch (err) {
              finish(err instanceof Error ? err : new Error("Could not read that sheet."));
            }
          },
        },
      },
    };

    script.src = src;
    script.async = true;
    script.onerror = () => {
      finish(new Error("Could not reach Google Sheets from this browser."));
    };
    document.head.appendChild(script);
  });
}

export async function loadGoogleSheet(url: string): Promise<{
  headers: string[];
  rows: RawRow[];
  ref: SheetsRef;
  title: string;
}> {
  const ref = parseSheetsUrl(url);
  if (!ref) {
    throw new Error("Paste a Google Sheets link from the address bar.");
  }

  const parsed = await enqueue(() =>
    canFetchSheets() ? loadViaFetch(ref.id, ref.gid) : loadViaGvizJsonp(ref.id, ref.gid),
  );
  return { ...parsed, ref, title: "" };
}
