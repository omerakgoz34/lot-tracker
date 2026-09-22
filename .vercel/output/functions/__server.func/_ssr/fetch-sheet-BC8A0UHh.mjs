import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fetch-sheet-BC8A0UHh.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var SheetRequest = object({
	id: string().regex(/^[a-zA-Z0-9-_]{16,}$/),
	gid: string().regex(/^[0-9]{1,12}$/)
});
var fetchGoogleSheetCsv_createServerFn_handler = createServerRpc({
	id: "b34f55b773706e6f32c7933973a37c5e87dd3958403c9cb4fc9d423cd474c99b",
	name: "fetchGoogleSheetCsv",
	filename: "src/lib/catalog/fetch-sheet.ts"
}, (opts) => fetchGoogleSheetCsv.__executeServer(opts));
var fetchGoogleSheetCsv = createServerFn({ method: "POST" }).validator(SheetRequest).handler(fetchGoogleSheetCsv_createServerFn_handler, async ({ data }) => {
	const url = `https://docs.google.com/spreadsheets/d/${data.id}/gviz/tq?tqx=out:csv&gid=${data.gid}`;
	const res = await fetch(url, {
		headers: { Accept: "text/csv, text/plain;q=0.9, */*;q=0.8" },
		redirect: "follow"
	});
	if (!res.ok) throw new Error(`Sheet request failed (${res.status}). Share it as Anyone with the link.`);
	const text = await res.text();
	const trimmed = text.trim();
	if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML") || trimmed.includes("accounts.google.com")) throw new Error("The sheet is not public. Share it as Anyone with the link, or upload an Excel file.");
	if (!trimmed) throw new Error("The sheet came back empty.");
	return text;
});
//#endregion
export { fetchGoogleSheetCsv_createServerFn_handler };
