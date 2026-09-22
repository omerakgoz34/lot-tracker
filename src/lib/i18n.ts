export type Locale = "tr" | "en" | "de";
export type Theme = "light" | "dark";

export const LOCALES: Locale[] = ["tr", "en", "de"];

export const LOCALE_LABEL: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "German",
};

export const LOCALE_BCP47: Record<Locale, string> = {
  tr: "tr",
  en: "en",
  de: "de",
};

const dict = {
  tr: {
    appName: "DEPO LOT TAKİP",
    tagline: "Artikel → LOT",
    loadCatalog: "Katalog yükle",
    loadHint:
      "Google Sheets bağlantısını yapıştırın veya bir Excel dosyası bırakın. Katalog yüklendikten sonra aramalar bu cihazda, çevrimdışı da çalışır.",
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
    prefs: "Ayarlar",
  },
  en: {
    appName: "DEPO LOT TAKİP",
    tagline: "Article → LOT",
    loadCatalog: "Load a catalog",
    loadHint:
      "Paste a Google Sheets link or drop an Excel file. Lookups stay on this device and work offline after the catalog is loaded.",
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
    prefs: "Settings",
  },
  de: {
    appName: "DEPO LOT TAKİP",
    tagline: "Artikel → LOT",
    loadCatalog: "Katalog laden",
    loadHint:
      "Fügen Sie einen Google-Sheets-Link ein oder legen Sie eine Excel-Datei ab. Nach dem Laden funktionieren Suchen auf diesem Gerät auch offline.",
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
    prefs: "Einstellungen",
  },
} as const;

export type MessageKey = keyof typeof dict.tr;

export function t(locale: Locale, key: MessageKey): string {
  return dict[locale][key];
}

export function formatAgo(ts: number, locale: Locale, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return t(locale, "justNow");
  if (s < 3600) return `${Math.round(s / 60)} ${t(locale, "minutesAgo")}`;
  if (s < 86400) return `${Math.round(s / 3600)} ${t(locale, "hoursAgo")}`;
  return `${Math.round(s / 86400)} ${t(locale, "daysAgo")}`;
}

export function localeTag(locale: Locale): string {
  if (locale === "tr") return "tr-TR";
  if (locale === "de") return "de-DE";
  return "en-US";
}
