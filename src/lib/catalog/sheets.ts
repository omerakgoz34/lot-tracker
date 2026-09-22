import { matrixToRecords, parseCsv } from "./parse";
import type { RawRow } from "./types";

export type SheetsRef = { id: string; gid: string };

export function parseSheetsUrl(input: string): SheetsRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed) && !trimmed.includes("/")) {
    return { id: trimmed, gid: "0" };
  }
  try {
    const url = new URL(trimmed);
    if (!url.hostname.endsWith("google.com") && !url.hostname.endsWith("googleusercontent.com")) {
      return null;
    }
    const idMatch = url.pathname.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
    const id = idMatch?.[1] ?? url.searchParams.get("id");
    if (!id || id === "e") return null;
    const gidFromQuery = url.searchParams.get("gid");
    const gidFromHash = url.hash.match(/gid=([0-9]+)/)?.[1];
    return { id, gid: gidFromQuery || gidFromHash || "0" };
  } catch {
    return null;
  }
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
  if (!table) throw new Error("The sheet has no table data.");
  const labels = table.cols.map((col, i) => {
    const label = col.label?.trim();
    return label || colLetter(i);
  });
  const unlabeled = table.cols.every((col) => !col.label?.trim());
  const matrix: string[][] = [];
  if (!unlabeled) matrix.push(labels);
  for (const row of table.rows ?? []) {
    matrix.push(labels.map((_, i) => cellText(row.c?.[i])));
  }
  return matrixToRecords(matrix);
}

function loadViaGvizJsonp(id: string, gid: string): Promise<{ headers: string[]; rows: RawRow[] }> {
  return new Promise((resolve, reject) => {
    const prev = (window as unknown as { google?: unknown }).google;
    const script = document.createElement("script");
    let settled = false;

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out loading the Google Sheet."));
    }, 18000);

    function cleanup() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.remove();
      if (prev !== undefined) (window as unknown as { google: unknown }).google = prev;
      else delete (window as unknown as { google?: unknown }).google;
    }

    (window as unknown as { google: unknown }).google = {
      visualization: {
        Query: {
          setResponse(data: GvizTable) {
            cleanup();
            try {
              resolve(gvizToRecords(data));
            } catch (err) {
              reject(err);
            }
          },
        },
      },
    };

    script.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq=${encodeURIComponent("select *")}&gid=${gid}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Could not reach Google Sheets from this browser."));
    };
    document.head.appendChild(script);
  });
}

export async function loadGoogleSheet(url: string): Promise<{
  headers: string[];
  rows: RawRow[];
  ref: SheetsRef;
}> {
  const ref = parseSheetsUrl(url);
  if (!ref) {
    throw new Error("Paste a Google Sheets link from the address bar.");
  }

  try {
    const parsed = await loadViaGvizJsonp(ref.id, ref.gid);
    return { ...parsed, ref };
  } catch (err) {
    if (!import.meta.env.VITE_PORTABLE) {
      const { fetchGoogleSheetCsv } = await import("./fetch-sheet");
      const csv = await fetchGoogleSheetCsv({ data: ref });
      return { ...matrixToRecords(parseCsv(csv)), ref };
    }
    throw err;
  }
}
