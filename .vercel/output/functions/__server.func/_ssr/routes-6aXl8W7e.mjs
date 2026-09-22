import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as RefreshCw, c as FileSpreadsheet, d as ArrowLeft, i as Settings2, l as Copy, o as Moon, r as Sun, s as LoaderCircle, t as Upload, u as Check } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-6aXl8W7e.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-card-2 text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "text-muted hover:bg-card-2 hover:text-foreground",
			danger: "bg-danger/15 text-danger hover:bg-danger/25"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-lg bg-card-2 px-3 py-2 text-sm text-foreground shadow-[var(--shadow-border)]", "placeholder:text-subtle", "transition-[box-shadow] duration-150 ease-out", "focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]", "disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
	ref,
	className: cn("text-xs font-medium tracking-wide text-muted", className),
	...props
}));
Label.displayName = "Label";
function normalize(value) {
	return value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").trim().replace(/\s+/g, " ").toLocaleUpperCase("en-US");
}
function uniqueHeaders(headers) {
	const seen = /* @__PURE__ */ new Map();
	return headers.map((raw, i) => {
		const base = raw.trim() || `Column ${i + 1}`;
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		return count === 0 ? base : `${base} (${count + 1})`;
	});
}
function parseCsv(text) {
	const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	if (!input.trim()) return [];
	const delimiter = detectDelimiter(input);
	const rows = [];
	let row = [];
	let cell = "";
	let inQuotes = false;
	for (let i = 0; i < input.length; i++) {
		const ch = input[i];
		if (inQuotes) {
			if (ch === "\"") {
				if (input[i + 1] === "\"") {
					cell += "\"";
					i += 1;
				} else inQuotes = false;
			} else cell += ch;
		} else if (ch === "\"") inQuotes = true;
		else if (ch === delimiter) {
			row.push(cell);
			cell = "";
		} else if (ch === "\n") {
			row.push(cell);
			cell = "";
			rows.push(row);
			row = [];
		} else cell += ch;
	}
	if (cell.length > 0 || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}
	return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
function detectDelimiter(text) {
	const first = text.split("\n").find((line) => line.trim()) ?? "";
	const counts = {
		",": 0,
		";": 0,
		"	": 0
	};
	let inQuotes = false;
	for (const ch of first) {
		if (ch === "\"") {
			inQuotes = !inQuotes;
			continue;
		}
		if (!inQuotes && ch in counts) counts[ch] += 1;
	}
	const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
	return best && best[1] > 0 ? best[0] : ",";
}
function matrixToRecords(matrix) {
	const start = matrix.findIndex((row) => row.some((c) => c.trim() !== ""));
	if (start < 0) throw new Error("The spreadsheet is empty.");
	const headers = uniqueHeaders(matrix[start].map((h) => h.trim()));
	const rows = [];
	for (const line of matrix.slice(start + 1)) {
		const rec = {};
		let empty = true;
		headers.forEach((h, i) => {
			const s = (line[i] ?? "").trim();
			rec[h] = s;
			if (s) empty = false;
		});
		if (!empty) rows.push(rec);
	}
	if (rows.length === 0) throw new Error("No data rows found under the header.");
	return {
		headers,
		rows
	};
}
function foldHeader(header) {
	return header.toLocaleLowerCase("en-US").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function scoreHeader(header, kind) {
	const h = foldHeader(header);
	if (!h) return 0;
	const articleExact = [
		"article",
		"article no",
		"article number",
		"article nr",
		"artikel",
		"artikel nr",
		"art no",
		"art nr",
		"art number",
		"sku",
		"sku no",
		"malzeme",
		"malzeme kodu",
		"stok kodu",
		"urun kodu",
		"product code",
		"product no",
		"product number",
		"item code",
		"item no",
		"part no",
		"part number",
		"pn",
		"ean",
		"barcode",
		"barkod"
	];
	const altExact = [
		"alternative",
		"alternative article",
		"alt article",
		"alt sku",
		"alternatif",
		"alternatif kod",
		"alternatif artikel",
		"equivalent",
		"old article",
		"old sku"
	];
	const lotExact = [
		"lot",
		"lot no",
		"lot number",
		"lot nr",
		"lot kodu",
		"parti",
		"parti no",
		"parti numarasi",
		"batch",
		"batch no",
		"batch number"
	];
	if (kind === "lot") {
		if (lotExact.includes(h)) return 100;
		if (/\blot\b/.test(h) || /\bbatch\b/.test(h) || /\bparti\b/.test(h)) return 70;
		return 0;
	}
	if (kind === "alternative") {
		if (altExact.includes(h)) return 100;
		if (/\balt\b/.test(h) || h.includes("alternat") || h.includes("equiv")) return 70;
		return 0;
	}
	if (articleExact.includes(h)) return 100;
	if (/\barticle\b/.test(h) || /\bartikel\b/.test(h) || /\bsku\b/.test(h) || h.includes("malzeme")) return 60;
	if (h.includes("kod") || h.includes("code") || h.includes("barcode") || h.includes("barkod")) return 40;
	return 0;
}
function detectColumns(headers) {
	let article = null;
	let alternative = null;
	let lot = null;
	let articleScore = 0;
	let altScore = 0;
	let lotScore = 0;
	for (const header of headers) {
		const a = scoreHeader(header, "article");
		const alt = scoreHeader(header, "alternative");
		const l = scoreHeader(header, "lot");
		if (a > articleScore) {
			article = header;
			articleScore = a;
		}
		if (alt > altScore) {
			alternative = header;
			altScore = alt;
		}
		if (l > lotScore) {
			lot = header;
			lotScore = l;
		}
	}
	if (article && alternative && article === alternative) {
		if (altScore >= articleScore) article = headers.find((h) => h !== alternative) ?? article;
		else alternative = null;
	}
	if (article && lot && article === lot) {
		if (lotScore >= articleScore) article = headers.find((h) => h !== lot) ?? article;
		else lot = headers.find((h) => h !== article) ?? lot;
	}
	if (alternative && lot && alternative === lot) alternative = null;
	const fallbackArticle = article ?? headers[0] ?? "";
	const fallbackLot = lot && lot !== fallbackArticle ? lot : headers.find((h) => h !== fallbackArticle) ?? fallbackArticle;
	return {
		article: fallbackArticle,
		alternative: alternative && alternative !== fallbackArticle && alternative !== fallbackLot ? alternative : null,
		lot: fallbackLot
	};
}
function pushMap(map, key, row) {
	const list = map.get(key);
	if (list) list.push(row);
	else map.set(key, [row]);
}
function buildIndex(rows, columns) {
	const article = /* @__PURE__ */ new Map();
	const alternative = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const a = normalize(row[columns.article] ?? "");
		if (a) pushMap(article, a, row);
		if (columns.alternative) {
			const alt = normalize(row[columns.alternative] ?? "");
			if (alt) pushMap(alternative, alt, row);
		}
	}
	return {
		article,
		alternative
	};
}
function fieldsFor(row) {
	const fields = [];
	for (const [label, value] of Object.entries(row)) {
		const trimmed = value.trim();
		if (!trimmed) continue;
		fields.push({
			label,
			value: trimmed
		});
	}
	return fields;
}
function toHit(row, columns, via) {
	return {
		lot: (row[columns.lot] ?? "").trim(),
		article: (row[columns.article] ?? "").trim(),
		alternative: columns.alternative ? (row[columns.alternative] ?? "").trim() : "",
		via,
		fields: fieldsFor(row)
	};
}
function lookupExact(query, index, columns) {
	const q = normalize(query);
	if (!q) return [];
	const primary = index.article.get(q);
	if (primary && primary.length > 0) return dedupeLots(primary.map((row) => toHit(row, columns, "article")));
	const alt = index.alternative.get(q);
	if (alt && alt.length > 0) return dedupeLots(alt.map((row) => toHit(row, columns, "alternative")));
	return [];
}
function dedupeLots(hits) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const hit of hits) {
		const key = normalize(hit.lot) || `${hit.article}::${hit.via}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(hit);
	}
	return out;
}
function isCsvLike(file) {
	const name = file.name.toLowerCase();
	return name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt") || file.type.includes("csv") || file.type.includes("tab-separated");
}
async function parseWorkbook(file) {
	const buffer = await file.arrayBuffer();
	if (isCsvLike(file)) {
		const parsed = matrixToRecords(parseCsv(new TextDecoder("utf-8").decode(buffer)));
		const name = file.name.replace(/\.[^.]+$/, "") || "Sheet";
		return {
			sheetNames: [name],
			sheets: { [name]: parsed }
		};
	}
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const workbook = XLSX.read(buffer, {
		type: "array",
		cellDates: false
	});
	if (!workbook.SheetNames.length) throw new Error("The workbook has no sheets.");
	const sheets = {};
	for (const name of workbook.SheetNames) {
		const sheet = workbook.Sheets[name];
		if (!sheet) continue;
		const asText = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			raw: false,
			defval: "",
			blankrows: false
		}).map((row) => row.map((cell) => cell == null ? "" : String(cell)));
		try {
			sheets[name] = matrixToRecords(asText);
		} catch {}
	}
	const sheetNames = workbook.SheetNames.filter((name) => sheets[name]);
	if (sheetNames.length === 0) throw new Error("No usable rows in this file.");
	return {
		sheetNames,
		sheets
	};
}
function parseSheetsUrl(input) {
	const trimmed = input.trim();
	if (!trimmed) return null;
	if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed) && !trimmed.includes("/")) return {
		id: trimmed,
		gid: "0"
	};
	try {
		const url = new URL(trimmed);
		if (!url.hostname.endsWith("google.com") && !url.hostname.endsWith("googleusercontent.com")) return null;
		const id = url.pathname.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/)?.[1] ?? url.searchParams.get("id");
		if (!id || id === "e") return null;
		const gidFromQuery = url.searchParams.get("gid");
		const gidFromHash = url.hash.match(/gid=([0-9]+)/)?.[1];
		return {
			id,
			gid: gidFromQuery || gidFromHash || "0"
		};
	} catch {
		return null;
	}
}
function colLetter(index) {
	let n = index;
	let out = "";
	do {
		out = String.fromCharCode(65 + n % 26) + out;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return out;
}
function cellText(cell) {
	if (!cell) return "";
	const raw = cell.f ?? cell.v;
	return raw == null ? "" : String(raw).trim();
}
function gvizToRecords(data) {
	if (data.status === "error") {
		const msg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || "Google Sheets returned an error.";
		throw new Error(msg);
	}
	const table = data.table;
	if (!table) throw new Error("The sheet has no table data.");
	const labels = table.cols.map((col, i) => {
		return col.label?.trim() || colLetter(i);
	});
	const unlabeled = table.cols.every((col) => !col.label?.trim());
	const matrix = [];
	if (!unlabeled) matrix.push(labels);
	for (const row of table.rows ?? []) matrix.push(labels.map((_, i) => cellText(row.c?.[i])));
	return matrixToRecords(matrix);
}
function loadViaGvizJsonp(id, gid) {
	return new Promise((resolve, reject) => {
		const prev = window.google;
		const script = document.createElement("script");
		let settled = false;
		const timeout = window.setTimeout(() => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Timed out loading the Google Sheet."));
		}, 18e3);
		function cleanup() {
			if (settled) return;
			settled = true;
			window.clearTimeout(timeout);
			script.remove();
			if (prev !== void 0) window.google = prev;
			else delete window.google;
		}
		window.google = { visualization: { Query: { setResponse(data) {
			cleanup();
			try {
				resolve(gvizToRecords(data));
			} catch (err) {
				reject(err);
			}
		} } } };
		script.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq=${encodeURIComponent("select *")}&gid=${gid}`;
		script.async = true;
		script.onerror = () => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Could not reach Google Sheets from this browser."));
		};
		document.head.appendChild(script);
	});
}
async function loadGoogleSheet(url) {
	const ref = parseSheetsUrl(url);
	if (!ref) throw new Error("Paste a Google Sheets link from the address bar.");
	try {
		return {
			...await loadViaGvizJsonp(ref.id, ref.gid),
			ref
		};
	} catch (err) {
		{
			const { fetchGoogleSheetCsv } = await import("./fetch-sheet-DIVnCebg.mjs");
			return {
				...matrixToRecords(parseCsv(await fetchGoogleSheetCsv({ data: ref }))),
				ref
			};
		}
	}
}
var SETTINGS_KEY = "lotkeep.settings.v1";
var DEFAULT_SETTINGS = {
	sheetUrl: "",
	source: null,
	columns: null,
	loadedAt: null,
	locale: "tr",
	theme: "light"
};
var DB_NAME = "lotkeep";
var DB_VERSION = 1;
var STORE = "kv";
var CATALOG_KEY = "catalog.v1";
function canUseBrowserStorage() {
	return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}
function parseSource(value) {
	if (!value || typeof value !== "object") return null;
	const src = value;
	if (src.kind === "sheets" && src.url && src.id && src.gid) return {
		kind: "sheets",
		url: src.url,
		id: src.id,
		gid: src.gid
	};
	if (src.kind === "file" && src.fileName) return {
		kind: "file",
		fileName: src.fileName
	};
	return null;
}
function loadSettings() {
	if (!canUseBrowserStorage()) return { ...DEFAULT_SETTINGS };
	try {
		const raw = window.localStorage.getItem(SETTINGS_KEY);
		if (!raw) return { ...DEFAULT_SETTINGS };
		const parsed = JSON.parse(raw);
		const locale = parsed.locale === "en" || parsed.locale === "de" ? parsed.locale : "tr";
		const theme = parsed.theme === "dark" ? "dark" : "light";
		return {
			sheetUrl: typeof parsed.sheetUrl === "string" ? parsed.sheetUrl : "",
			source: parseSource(parsed.source),
			columns: parsed.columns ?? null,
			loadedAt: typeof parsed.loadedAt === "number" ? parsed.loadedAt : null,
			locale,
			theme
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}
function saveSettings(settings) {
	if (!canUseBrowserStorage()) return;
	window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("IndexedDB failed"));
	});
}
async function loadCatalog() {
	if (!canUseBrowserStorage()) return null;
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, "readonly");
			const req = tx.objectStore(STORE).get(CATALOG_KEY);
			req.onsuccess = () => {
				const value = req.result;
				resolve(value ?? null);
			};
			req.onerror = () => reject(req.error);
			tx.oncomplete = () => db.close();
		});
	} catch {
		return null;
	}
}
async function saveCatalog(catalog) {
	if (!canUseBrowserStorage()) return;
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(catalog, CATALOG_KEY);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
}
async function clearCatalog() {
	if (!canUseBrowserStorage()) return;
	try {
		const db = await openDb();
		await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.objectStore(STORE).delete(CATALOG_KEY);
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		});
	} catch {}
}
var LOCALES = [
	"tr",
	"en",
	"de"
];
var LOCALE_LABEL = {
	tr: "Türkçe",
	en: "English",
	de: "German"
};
var dict = {
	tr: {
		appName: "DEPO LOT TAKİP",
		tagline: "Artikel → LOT",
		loadCatalog: "Katalog yükle",
		loadHint: "Google Sheets bağlantısını yapıştırın veya bir Excel dosyası bırakın. Katalog yüklendikten sonra aramalar bu cihazda, çevrimdışı da çalışır.",
		googleSheet: "Google Sheet",
		spreadsheetLink: "Tablo bağlantısı",
		shareHint: "Tabloyu “Bağlantısı olan herkes” olarak paylaşın. URL’deki gid sekmesini seçer.",
		loadSheet: "Tabloyu yükle",
		excelOrCsv: "Excel veya CSV",
		dropHint: "Çalışma kitabını buraya bırakın veya dosya seçin. .xlsx, .xls, .csv",
		chooseFile: "Dosya seç",
		columns: "Sütunlar",
		columnsHint: "Arama yalnızca artikel, yoksa alternatif artikel sütununda tam eşleşme arar.",
		article: "Artikel",
		alternativeArticle: "Alternatif artikel",
		lot: "LOT",
		none: "Yok",
		lookUp: "Artikel ara",
		refresh: "Yenile",
		rows: "satır",
		clearCatalog: "Kayıtlı kataloğu sil",
		articleNumber: "Artikel kodu",
		articlePlaceholder: "Yapıştırın veya yazın, Enter",
		idleHint: "Yalnızca artikel sütununda, yoksa alternatif artikel sütununda tam eşleşme.",
		products: "ürün",
		pressToFocus: "Odaklamak için /",
		copy: "Kopyala",
		copied: "Kopyalandı",
		matchedOn: "Eşleşme",
		matchedAlt: "Alternatif artikel",
		noLot: "Bu artikel için LOT yok",
		missHint: "Yalnızca artikel veya alternatif artikel sütunlarındaki tam eşleşmeler kullanılır.",
		pasteLinkFirst: "Önce bir Google Sheets bağlantısı yapıştırın.",
		notSheetsLink: "Bu bir Google Sheets bağlantısı değil. Adres çubuğundaki URL’yi kullanın veya dosya yükleyin.",
		loadFailed: "Tablo yüklenemedi.",
		fileFailed: "Dosya okunamadı.",
		justNow: "az önce",
		minutesAgo: "dk önce",
		hoursAgo: "sa önce",
		daysAgo: "g önce",
		settings: "Katalog ayarları",
		back: "Aramaya dön",
		themeLight: "Açık",
		themeDark: "Koyu",
		catalog: "Katalog",
		language: "Dil",
		appearance: "Görünüm",
		prefs: "Ayarlar"
	},
	en: {
		appName: "DEPO LOT TAKİP",
		tagline: "Article → LOT",
		loadCatalog: "Load a catalog",
		loadHint: "Paste a Google Sheets link or drop an Excel file. Lookups stay on this device and work offline after the catalog is loaded.",
		googleSheet: "Google Sheet",
		spreadsheetLink: "Spreadsheet link",
		shareHint: "Share the sheet as Anyone with the link. The gid in the URL selects the tab.",
		loadSheet: "Load sheet",
		excelOrCsv: "Excel or CSV",
		dropHint: "Drop a workbook here, or choose a file. .xlsx, .xls, .csv",
		chooseFile: "Choose file",
		columns: "Columns",
		columnsHint: "Lookup uses exact matches on article, then alternative article.",
		article: "Article",
		alternativeArticle: "Alternative article",
		lot: "LOT",
		none: "None",
		lookUp: "Look up articles",
		refresh: "Refresh",
		rows: "rows",
		clearCatalog: "Clear saved catalog",
		articleNumber: "Article number",
		articlePlaceholder: "Paste or type, then Enter",
		idleHint: "Exact match on the article column, then the alternative article column.",
		products: "products",
		pressToFocus: "Press / to focus",
		copy: "Copy",
		copied: "Copied",
		matchedOn: "Matched on",
		matchedAlt: "Alternative article",
		noLot: "No LOT for this article",
		missHint: "Only exact matches on the article or alternative article columns are used.",
		pasteLinkFirst: "Paste a Google Sheets link first.",
		notSheetsLink: "That is not a Google Sheets link. Use the address-bar URL, or upload a file.",
		loadFailed: "Could not load the sheet.",
		fileFailed: "Could not read that file.",
		justNow: "just now",
		minutesAgo: "m ago",
		hoursAgo: "h ago",
		daysAgo: "d ago",
		settings: "Catalog settings",
		back: "Back to lookup",
		themeLight: "Light",
		themeDark: "Dark",
		catalog: "Catalog",
		language: "Language",
		appearance: "Appearance",
		prefs: "Settings"
	},
	de: {
		appName: "DEPO LOT TAKİP",
		tagline: "Artikel → LOT",
		loadCatalog: "Katalog laden",
		loadHint: "Fügen Sie einen Google-Sheets-Link ein oder legen Sie eine Excel-Datei ab. Nach dem Laden funktionieren Suchen auf diesem Gerät auch offline.",
		googleSheet: "Google Sheet",
		spreadsheetLink: "Tabellen-Link",
		shareHint: "Tabelle als „Jeder, der über den Link verfügt“ freigeben. Die gid in der URL wählt das Blatt.",
		loadSheet: "Tabelle laden",
		excelOrCsv: "Excel oder CSV",
		dropHint: "Arbeitsmappe hier ablegen oder Datei wählen. .xlsx, .xls, .csv",
		chooseFile: "Datei wählen",
		columns: "Spalten",
		columnsHint: "Suche nur exakte Treffer in Artikel, sonst in Alternativartikel.",
		article: "Artikel",
		alternativeArticle: "Alternativartikel",
		lot: "LOT",
		none: "Keine",
		lookUp: "Artikel suchen",
		refresh: "Aktualisieren",
		rows: "Zeilen",
		clearCatalog: "Gespeicherten Katalog löschen",
		articleNumber: "Artikelnummer",
		articlePlaceholder: "Einfügen oder tippen, dann Enter",
		idleHint: "Exakte Übereinstimmung in der Artikelspalte, sonst in der Alternativartikelspalte.",
		products: "Produkte",
		pressToFocus: "/ zum Fokussieren",
		copy: "Kopieren",
		copied: "Kopiert",
		matchedOn: "Treffer über",
		matchedAlt: "Alternativartikel",
		noLot: "Kein LOT für diesen Artikel",
		missHint: "Es werden nur exakte Treffer in Artikel- oder Alternativartikelspalte verwendet.",
		pasteLinkFirst: "Zuerst einen Google-Sheets-Link einfügen.",
		notSheetsLink: "Das ist kein Google-Sheets-Link. Adressleisten-URL verwenden oder Datei laden.",
		loadFailed: "Tabelle konnte nicht geladen werden.",
		fileFailed: "Datei konnte nicht gelesen werden.",
		justNow: "gerade eben",
		minutesAgo: "Min. her",
		hoursAgo: "Std. her",
		daysAgo: "T. her",
		settings: "Katalogeinstellungen",
		back: "Zurück zur Suche",
		themeLight: "Hell",
		themeDark: "Dunkel",
		catalog: "Katalog",
		language: "Sprache",
		appearance: "Darstellung",
		prefs: "Einstellungen"
	}
};
function t(locale, key) {
	return dict[locale][key];
}
function formatAgo(ts, locale, now = Date.now()) {
	const s = Math.max(0, Math.round((now - ts) / 1e3));
	if (s < 45) return t(locale, "justNow");
	if (s < 3600) return `${Math.round(s / 60)} ${t(locale, "minutesAgo")}`;
	if (s < 86400) return `${Math.round(s / 3600)} ${t(locale, "hoursAgo")}`;
	return `${Math.round(s / 86400)} ${t(locale, "daysAgo")}`;
}
function localeTag(locale) {
	if (locale === "tr") return "tr-TR";
	if (locale === "de") return "de-DE";
	return "en-US";
}
function applyChrome(locale, theme) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.classList.toggle("dark", theme === "dark");
	root.lang = locale;
	document.querySelector("meta[name=\"theme-color\"]")?.setAttribute("content", theme === "dark" ? "#0c0d0f" : "#ffffff");
}
async function copyText(value) {
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
function LotKeepApp() {
	const [settings, setSettings] = (0, import_react.useState)(DEFAULT_SETTINGS);
	const [catalog, setCatalog] = (0, import_react.useState)(null);
	const [screen, setScreen] = (0, import_react.useState)("source");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		applyChrome(DEFAULT_SETTINGS.locale, DEFAULT_SETTINGS.theme);
		let cancelled = false;
		(async () => {
			const stored = loadSettings();
			const data = await loadCatalog();
			if (cancelled) return;
			applyChrome(stored.locale, stored.theme);
			const usable = stored.source ? data : null;
			if (!stored.source && data) clearCatalog();
			if (!stored.source && (stored.columns || stored.loadedAt)) {
				stored.columns = null;
				stored.loadedAt = null;
				saveSettings(stored);
			}
			setSettings(stored);
			setCatalog(usable);
			setScreen(usable && stored.columns ? "lookup" : "source");
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	const persistSettings = (0, import_react.useCallback)((next) => {
		setSettings(next);
		saveSettings(next);
		applyChrome(next.locale, next.theme);
	}, []);
	const persist = (0, import_react.useCallback)((next, nextCatalog) => {
		persistSettings(next);
		setCatalog(nextCatalog);
		if (nextCatalog) saveCatalog(nextCatalog);
		else clearCatalog();
	}, [persistSettings]);
	const onLoaded = (0, import_react.useCallback)((nextCatalog, source, columns) => {
		persist({
			...settings,
			source,
			columns,
			loadedAt: Date.now(),
			sheetUrl: source.kind === "sheets" ? source.url : settings.sheetUrl
		}, nextCatalog);
		setError(null);
		setScreen("lookup");
	}, [persist, settings]);
	const onColumnsChange = (0, import_react.useCallback)((columns) => {
		persistSettings({
			...settings,
			columns
		});
	}, [persistSettings, settings]);
	const onClear = (0, import_react.useCallback)(() => {
		persist({
			...settings,
			source: null,
			columns: null,
			loadedAt: null
		}, null);
		setScreen("source");
		setError(null);
	}, [persist, settings]);
	const columns = settings.columns;
	const index = (0, import_react.useMemo)(() => catalog && columns ? buildIndex(catalog.rows, columns) : null, [catalog, columns]);
	const locale = settings.locale;
	const tr = (0, import_react.useCallback)((key) => t(locale, key), [locale]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh flex-col px-4 pb-8 pt-4 sm:px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-xl flex-1 flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
				settings,
				hasCatalog: Boolean(catalog && columns),
				screen,
				onToggle: () => setScreen(screen === "lookup" ? "source" : "lookup")
			}), screen === "source" || !catalog || !columns || !index ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceView, {
				settings,
				catalog,
				busy,
				error,
				tr,
				setBusy,
				setError,
				setSheetUrl: (sheetUrl) => persistSettings({
					...settings,
					sheetUrl
				}),
				onLoaded,
				onColumnsChange,
				onClear,
				onDone: () => setScreen("lookup"),
				onLocale: (next) => persistSettings({
					...settings,
					locale: next
				}),
				onTheme: (next) => persistSettings({
					...settings,
					theme: next
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookupView, {
				catalog,
				settings,
				index,
				tr,
				onOpenSource: () => setScreen("source")
			})]
		})
	});
}
function Header({ settings, hasCatalog, screen, onToggle }) {
	const tr = (key) => t(settings.locale, key);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "mb-6 flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-9 shrink-0 items-center justify-center rounded-md bg-card shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LotMark, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium tracking-tight text-foreground",
					children: tr("appName")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: tr("tagline")
				})]
			})]
		}), hasCatalog ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			size: "icon",
			onClick: onToggle,
			"aria-label": screen === "lookup" ? tr("settings") : tr("back"),
			children: screen === "lookup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {})
		}) : null]
	});
}
function LotMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: "size-5",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "5.5",
				y: "4.5",
				width: "13",
				height: "15",
				rx: "1.8",
				fill: "currentColor",
				className: "text-paper",
				stroke: "currentColor",
				strokeWidth: "1",
				style: { stroke: "color-mix(in oklab, var(--ink) 28%, transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "8",
				r: "1.4",
				fill: "currentColor",
				className: "text-hole"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "8",
				y: "12",
				width: "8",
				height: "1.6",
				rx: "0.6",
				fill: "currentColor",
				className: "text-accent-deep"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "8",
				y: "15.4",
				width: "5.5",
				height: "1.6",
				rx: "0.6",
				fill: "currentColor",
				className: "text-ink"
			})
		]
	});
}
function LookupView({ catalog, settings, index, tr, onOpenSource }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [committed, setCommitted] = (0, import_react.useState)("");
	const inputRef = (0, import_react.useRef)(null);
	const columns = settings.columns;
	(0, import_react.useEffect)(() => {
		inputRef.current?.focus();
	}, []);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			e.preventDefault();
			inputRef.current?.focus();
			inputRef.current?.select();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const liveHits = (0, import_react.useMemo)(() => lookupExact(query, index, columns), [
		query,
		index,
		columns
	]);
	const committedHits = (0, import_react.useMemo)(() => lookupExact(committed, index, columns), [
		committed,
		index,
		columns
	]);
	const showHits = liveHits.length > 0 ? liveHits : query.trim() && committed.trim() === query.trim() ? committedHits : [];
	const showMiss = Boolean(committed.trim()) && committed.trim() === query.trim() && liveHits.length === 0;
	const sourceLabel = settings.source?.kind === "sheets" ? tr("googleSheet") : settings.source?.kind === "file" ? settings.source.fileName : tr("catalog");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				onSubmit: (e) => {
					e.preventDefault();
					setCommitted(query);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "article-input",
					className: "mb-2 block px-1",
					children: tr("articleNumber")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					id: "article-input",
					name: "article",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					onPaste: () => {
						requestAnimationFrame(() => {
							const next = inputRef.current?.value ?? "";
							setQuery(next);
							setCommitted(next);
						});
					},
					onFocus: (e) => e.currentTarget.select(),
					autoCapitalize: "off",
					autoComplete: "off",
					autoCorrect: "off",
					spellCheck: false,
					inputMode: "search",
					placeholder: tr("articlePlaceholder"),
					className: "h-14 w-full rounded-lg bg-card-2 px-4 font-mono text-lg tracking-wide text-foreground shadow-[var(--shadow-border)] placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-subtle focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 min-h-48",
				"aria-live": "polite",
				children: showHits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-3",
					children: showHits.map((hit, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LotTag, {
						hit,
						tr
					}, `${hit.lot}-${hit.article}-${i}`))
				}) : showMiss ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MissCard, {
					query,
					tr
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-1 text-sm text-subtle",
					children: tr("idleHint")
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex items-center justify-between gap-3 pt-8 text-xs text-subtle",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onOpenSource,
					className: "min-h-11 text-left transition-colors duration-150 hover:text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-muted",
							children: catalog.rows.length.toLocaleString(localeTag(settings.locale))
						}),
						` ${tr("products")} · `,
						sourceLabel,
						settings.loadedAt ? ` · ${formatAgo(settings.loadedAt, settings.locale)}` : ""
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: tr("pressToFocus")
				})]
			})
		]
	});
}
function LotTag({ hit, tr }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	async function copyLot() {
		if (!hit.lot) return;
		if (!await copyText(hit.lot)) return;
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "lot-tag",
		role: "button",
		tabIndex: 0,
		onClick: () => void copyLot(),
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				copyLot();
			}
		},
		"aria-label": `${tr("lot")} ${hit.lot}. ${tr("copy")}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "lot-tag-hole",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3 pl-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.16em] text-ink-muted",
					children: tr("lot")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-ink-muted",
					children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), copied ? tr("copied") : tr("copy")]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 break-all font-mono text-lot font-medium leading-tight tracking-tight text-ink",
				children: hit.lot || "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-5 space-y-1.5 border-t border-ink/10 pt-4 text-sm",
				children: [hit.via === "alternative" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-ink-muted",
						children: tr("matchedOn")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "text-ink",
						children: tr("matchedAlt")
					})]
				}) : null, hit.fields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "shrink-0 text-ink-muted",
						children: field.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "text-right font-mono text-ink break-all",
						children: field.value
					})]
				}, field.label))]
			})
		]
	});
}
function MissCard({ query, tr }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl bg-card px-5 py-6 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-foreground",
				children: tr("noLot")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-mono text-sm text-muted",
				children: query.trim()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-subtle",
				children: tr("missHint")
			})
		]
	});
}
function SourceView({ settings, catalog, busy, error, tr, setBusy, setError, setSheetUrl, onLoaded, onColumnsChange, onClear, onDone, onLocale, onTheme }) {
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	const columns = settings.columns;
	const headers = catalog?.headers ?? [];
	async function loadSheet(urlOverride) {
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
			const mapping = detectColumns(loaded.headers);
			onLoaded({
				headers: loaded.headers,
				rows: loaded.rows
			}, {
				kind: "sheets",
				url,
				id: loaded.ref.id,
				gid: loaded.ref.gid
			}, mapping);
		} catch {
			setError(tr("loadFailed"));
		} finally {
			setBusy(false);
		}
	}
	async function loadFile(file) {
		setBusy(true);
		setError(null);
		try {
			const workbook = await parseWorkbook(file);
			const first = workbook.sheetNames[0];
			const parsed = workbook.sheets[first];
			const mapping = detectColumns(parsed.headers);
			onLoaded({
				headers: parsed.headers,
				rows: parsed.rows,
				sheetNames: workbook.sheetNames,
				activeSheet: first
			}, {
				kind: "file",
				fileName: file.name
			}, mapping);
		} catch {
			setError(tr("fileFailed"));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-medium tracking-tight text-foreground",
				children: tr("loadCatalog")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-sm leading-normal text-muted",
				children: tr("loadHint")
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2 px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-4 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium text-foreground",
							children: tr("googleSheet")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "sheet-url",
						className: "mb-2 block px-1",
						children: tr("spreadsheetLink")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "sheet-url",
						value: settings.sheetUrl,
						onChange: (e) => setSheetUrl(e.target.value),
						placeholder: "https://docs.google.com/spreadsheets/d/…",
						autoCapitalize: "off",
						autoCorrect: "off",
						spellCheck: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 px-1 text-xs leading-normal text-subtle",
						children: tr("shareHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-4 w-full",
						onClick: () => void loadSheet(),
						disabled: busy,
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }) : null, tr("loadSheet")]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: cn("dropzone rounded-3xl p-4", dragging && "dropzone-active"),
				onDragEnter: (e) => {
					e.preventDefault();
					setDragging(true);
				},
				onDragOver: (e) => {
					e.preventDefault();
					setDragging(true);
				},
				onDragLeave: () => setDragging(false),
				onDrop: (e) => {
					e.preventDefault();
					setDragging(false);
					const file = e.dataTransfer.files[0];
					if (file) loadFile(file);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium text-foreground",
							children: tr("excelOrCsv")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 px-1 text-sm text-muted",
						children: tr("dropHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: ".xlsx,.xls,.csv,.ods,.tsv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
						className: "hidden",
						onChange: (e) => {
							const file = e.target.files?.[0];
							if (file) loadFile(file);
							e.currentTarget.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "mt-4 w-full",
						onClick: () => fileRef.current?.click(),
						disabled: busy,
						children: tr("chooseFile")
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger",
				role: "alert",
				children: error
			}) : null,
			catalog && columns ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "px-1 text-sm font-medium text-foreground",
						children: tr("columns")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 px-1 text-xs text-subtle",
						children: tr("columnsHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSelect, {
								id: "col-article",
								label: tr("article"),
								value: columns.article,
								headers,
								noneLabel: tr("none"),
								onChange: (article) => onColumnsChange({
									...columns,
									article
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSelect, {
								id: "col-alt",
								label: tr("alternativeArticle"),
								value: columns.alternative ?? "",
								headers,
								allowNone: true,
								noneLabel: tr("none"),
								onChange: (alternative) => onColumnsChange({
									...columns,
									alternative: alternative || null
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSelect, {
								id: "col-lot",
								label: tr("lot"),
								value: columns.lot,
								headers,
								noneLabel: tr("none"),
								onChange: (lot) => onColumnsChange({
									...columns,
									lot
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							onClick: onDone,
							children: tr("lookUp")
						}), settings.source?.kind === "sheets" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							onClick: () => void loadSheet(settings.source?.kind === "sheets" ? settings.source.url : void 0),
							disabled: busy,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {}), tr("refresh")]
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 px-1 text-xs text-subtle",
						children: [
							catalog.rows.length.toLocaleString(localeTag(settings.locale)),
							" ",
							tr("rows"),
							settings.source?.kind === "file" ? ` · ${settings.source.fileName}` : null,
							settings.source?.kind === "sheets" ? ` · ${tr("googleSheet")}` : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClear,
						className: "mt-1 px-1 text-left text-xs text-subtle transition-colors duration-150 hover:text-danger",
						children: tr("clearCatalog")
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "px-1 text-sm font-medium text-foreground",
						children: tr("prefs")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 px-1 text-xs font-medium text-muted",
							children: tr("language")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1",
							role: "radiogroup",
							"aria-label": tr("language"),
							children: LOCALES.map((locale) => {
								const active = settings.locale === locale;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "radio",
									"aria-checked": active,
									onClick: () => onLocale(locale),
									className: cn("h-11 min-w-11 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out", active ? "bg-primary text-primary-foreground" : "text-muted shadow-[var(--shadow-border)] hover:text-foreground"),
									children: LOCALE_LABEL[locale]
								}, locale);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 px-1 text-xs font-medium text-muted",
							children: tr("appearance")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-1",
							role: "radiogroup",
							"aria-label": tr("appearance"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "radio",
								"aria-checked": settings.theme === "light",
								onClick: () => onTheme("light"),
								className: cn("inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out", settings.theme === "light" ? "bg-primary text-primary-foreground" : "text-muted shadow-[var(--shadow-border)] hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }), tr("themeLight")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "radio",
								"aria-checked": settings.theme === "dark",
								onClick: () => onTheme("dark"),
								className: cn("inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-150 ease-out", settings.theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted shadow-[var(--shadow-border)] hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }), tr("themeDark")]
							})]
						})]
					})
				]
			})
		]
	});
}
function FieldSelect({ id, label, value, headers, onChange, allowNone = false, noneLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
		htmlFor: id,
		className: "mb-1.5 block px-1",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
		id,
		value,
		onChange: (e) => onChange(e.target.value),
		className: "h-11 w-full rounded-lg bg-card-2 px-3 text-sm text-foreground shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]",
		children: [allowNone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: "",
			children: noneLabel
		}) : null, headers.map((header) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: header,
			children: header
		}, header))]
	})] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LotKeepApp, {});
}
//#endregion
export { Home as component };
