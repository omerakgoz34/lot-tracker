import { matrixToRecords, parseCsv } from "./parse";
import type { RawRow } from "./types";

export type WorkbookData = {
  sheetNames: string[];
  sheets: Record<string, { headers: string[]; rows: RawRow[] }>;
};

function isCsvLike(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    name.endsWith(".tsv") ||
    name.endsWith(".txt") ||
    file.type.includes("csv") ||
    file.type.includes("tab-separated")
  );
}

export async function parseWorkbook(file: File): Promise<WorkbookData> {
  const buffer = await file.arrayBuffer();
  if (isCsvLike(file)) {
    const text = new TextDecoder("utf-8").decode(buffer);
    const parsed = matrixToRecords(parseCsv(text));
    const name = file.name.replace(/\.[^.]+$/, "") || "Sheet";
    return { sheetNames: [name], sheets: { [name]: parsed } };
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  if (!workbook.SheetNames.length) throw new Error("The workbook has no sheets.");

  const sheets: WorkbookData["sheets"] = {};
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    const asText = matrix.map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
    try {
      sheets[name] = matrixToRecords(asText);
    } catch {
      // skip empty tabs
    }
  }

  const sheetNames = workbook.SheetNames.filter((name) => sheets[name]);
  if (sheetNames.length === 0) throw new Error("No usable rows in this file.");
  return { sheetNames, sheets };
}
