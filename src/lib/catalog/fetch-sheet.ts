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
    return text;
  });
