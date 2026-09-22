import * as XLSX from "xlsx";

const globalRef = globalThis as typeof globalThis & { XLSX: typeof XLSX };
globalRef.XLSX = XLSX;
