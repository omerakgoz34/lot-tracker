import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SheetRequest = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_]{16,}$/),
  gid: z.string().regex(/^[0-9]{1,12}$/),
});

export const fetchGoogleSheetCsv = createServerFn({ method: "POST" })
  .validator(SheetRequest)
  .handler(async ({ data }) => {
    const url = `https://docs.google.com/spreadsheets/d/${data.id}/gviz/tq?tqx=out:csv&gid=${data.gid}`;
    const res = await fetch(url, {
      headers: { Accept: "text/csv, text/plain;q=0.9, */*;q=0.8" },
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(
        `Sheet request failed (${res.status}). Share it as Anyone with the link.`,
      );
    }
    const text = await res.text();
    const trimmed = text.trim();
    if (
      trimmed.startsWith("<!DOCTYPE") ||
      trimmed.startsWith("<html") ||
      trimmed.startsWith("<HTML") ||
      trimmed.includes("accounts.google.com")
    ) {
      throw new Error("The sheet is not public. Share it as Anyone with the link, or upload an Excel file.");
    }
    if (!trimmed) throw new Error("The sheet came back empty.");
    return { csv: text, title: titleFromDisposition(res.headers.get("content-disposition")) };
  });

function decodeEntities(value: string): string {
  return value
    .replace(/&/gi, "&")
    .replace(/"/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/gi, "'")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"')
    .trim();
}

const GENERIC_TITLES = new Set([
  "google sheets",
  "google sheet",
  "google e-tablolar",
  "google e tablolar",
  "google spreadsheets",
  "google spreadsheet",
  "google docs",
  "google drive",
  "sign in",
  "giris yap",
  "giriş yap",
]);

export function cleanSheetTitle(raw: string): string {
  let title = decodeEntities(raw)
    .replace(/\s+[-–—]\s+Google.*$/i, "")
    .replace(/\.(xlsx|xls|csv|ods|tsv)$/i, "")
    .replace(/^"+|"+$/g, "")
    .trim();
  if (!title) return "";
  if (GENERIC_TITLES.has(title.toLocaleLowerCase("tr-TR"))) return "";
  if (GENERIC_TITLES.has(title.toLocaleLowerCase("en-US"))) return "";
  return title;
}

function titleFromDisposition(header: string | null): string {
  if (!header) return "";
  const star = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (star?.[1]) {
    try {
      return cleanSheetTitle(decodeURIComponent(star[1]));
    } catch {
      return cleanSheetTitle(star[1]);
    }
  }
  const plain = header.match(/filename\s*=\s*"([^"]+)"/i) || header.match(/filename\s*=\s*([^;]+)/i);
  return plain?.[1] ? cleanSheetTitle(plain[1]) : "";
}

function titleFromHtml(html: string): string {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /"doc_title"\s*:\s*"((?:\\.|[^"\\])*)"/,
    /"docTitle"\s*:\s*"((?:\\.|[^"\\])*)"/,
    /<title>([^<]+)<\/title>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const title = match?.[1] ? cleanSheetTitle(match[1]) : "";
    if (title) return title;
  }
  return "";
}

const TitleRequest = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_]{16,}$/),
});

export const fetchGoogleSheetTitle = createServerFn({ method: "POST" })
  .validator(TitleRequest)
  .handler(async ({ data }) => {
    const exportUrls = [
      `https://docs.google.com/spreadsheets/d/${data.id}/export?format=xlsx`,
      `https://docs.google.com/spreadsheets/d/${data.id}/export?format=csv&gid=0&range=A1`,
    ];
    for (const exportUrl of exportUrls) {
      try {
        const res = await fetch(exportUrl, { method: "GET", redirect: "follow" });
        const title = titleFromDisposition(res.headers.get("content-disposition"));
        try {
          await res.body?.cancel();
        } catch {
          // ignore
        }
        if (title) return title;
      } catch {
        // continue
      }
    }

    const htmlUrl = `https://docs.google.com/spreadsheets/d/${data.id}/htmlview`;
    try {
      const res = await fetch(htmlUrl, {
        headers: { Accept: "text/html,application/xhtml+xml;q=0.9" },
        redirect: "follow",
      });
      if (res.ok) {
        const html = await res.text();
        const title = titleFromHtml(html);
        if (title) return title;
      }
    } catch {
      // ignore
    }

    return "";
  });
