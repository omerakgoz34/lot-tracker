import { createHash } from "node:crypto";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public");

await cleanProductionFiles(outDir);
await build({ configFile: join(root, "vite.portable.ts") });

const miniXlsx = join(root, "node_modules", "xlsx", "dist", "xlsx.mini.min.js");
const xlsxName = await hashedName("xlsx", miniXlsx);
await writeFile(join(outDir, xlsxName), await readFile(miniXlsx));

async function hashedName(prefix, filePath) {
  const bytes = await readFile(filePath);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `${prefix}-${hash}${extname(filePath)}`;
}

function pick(files, pattern) {
  return files.find((name) => pattern.test(name) && !name.includes("[hash]"));
}

let files = (await readdir(outDir)).filter((name) => !name.startsWith(".") && name !== "__grok");
let scriptName = pick(files, /^scripts-.+\.js$/);
let styleName = pick(files, /^styles-.+\.css$/);

if (!scriptName) {
  const js = files.find((name) => name.endsWith(".js") && !name.startsWith("xlsx-"));
  if (!js) throw new Error("production build produced no JS");
  scriptName = await hashedName("scripts", join(outDir, js));
  await writeFile(join(outDir, scriptName), await readFile(join(outDir, js)));
  if (js !== scriptName) await rm(join(outDir, js), { force: true });
}
if (!styleName) {
  const css = files.find((name) => name.endsWith(".css"));
  if (!css) throw new Error("production build produced no CSS");
  styleName = await hashedName("styles", join(outDir, css));
  await writeFile(join(outDir, styleName), await readFile(join(outDir, css)));
  if (css !== styleName) await rm(join(outDir, css), { force: true });
}

styleName = await extractCssFonts(join(outDir, styleName), outDir);

const fonts = (await readdir(outDir))
  .filter((name) => name.endsWith(".woff2"))
  .sort();
const fontPreload = fonts
  .map((name) => `    <link rel="preload" href="./${name}" as="font" type="font/woff2" crossorigin />`)
  .join("\n");

const favicon = await readFile(join(outDir, "favicon.svg"));
const iconName = `icon-${createHash("sha256").update(favicon).digest("hex").slice(0, 16)}.svg`;
await writeFile(join(outDir, iconName), favicon);

const html = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="color-scheme" content="light dark" />
    <meta name="description" content="Artikel numarasından LOT numarası bulunur." />
    <title>DEPO LOT TAKIP</title>
    <link rel="icon" type="image/svg+xml" href="./${iconName}" />
    <style>
      html,body,#root{background:#fff;color:#141414;margin:0;min-height:100dvh}
      html.dark,html.dark body,html.dark #root{background:#0c0d0f;color:#f3f1ec}
    </style>
${fontPreload}
    <link rel="stylesheet" href="./${styleName}" />
    <link rel="preload" href="./${scriptName}" as="script" />
  </head>
  <body class="min-h-dvh bg-background text-foreground">
    <div id="root">
      <div class="flex min-h-dvh flex-col px-4 pb-8 pt-4 sm:px-6">
        <div class="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <header class="mb-6 flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-card-2 shadow-[var(--shadow-border)]" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="size-full"><rect x="1" y="0.75" width="22" height="22.5" rx="2.6" fill="currentColor" class="text-paper"/><rect x="1" y="0.75" width="22" height="22.5" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="6.6" r="2.05" fill="currentColor" class="text-hole"/><rect x="5" y="11.4" width="14" height="2.3" rx="0.7" fill="currentColor" class="text-accent-deep"/><rect x="5" y="16.4" width="9.5" height="2.3" rx="0.7" fill="currentColor" class="text-ink"/></svg>
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-medium tracking-tight text-foreground">DEPO LOT TAKİP</p>
                <p class="truncate text-xs text-subtle">Artikel → LOT</p>
              </div>
            </div>
          </header>
          <div>
            <h1 class="text-xl font-medium tracking-tight text-foreground">Katalog yükle</h1>
            <p class="mt-2 max-w-md text-sm leading-normal text-muted">Google Sheets bağlantısını yapıştırın veya bir Excel dosyası bırakın. Katalog yüklendikten sonra aramalar bu cihazda, çevrimdışı da çalışır.</p>
          </div>
        </div>
      </div>
      <noscript>
        <p class="mx-auto max-w-xl px-4 text-sm">Bu dosya JavaScript ile çalışır. Tarayıcıda JavaScript açık olmalı.</p>
      </noscript>
    </div>
    <script>
window.globalThis = window.globalThis || window;
window.global = window.global || window;
window.process = window.process || { env: { NODE_ENV: "production" } };
window.__XLSX_SRC__ = "./${xlsxName}";
    </script>
    <script src="./${scriptName}" defer></script>
  </body>
</html>
`;
await writeFile(join(outDir, "index.html"), html);
await writeFile(join(outDir, ".nojekyll"), "");

const listed = (await readdir(outDir))
  .filter((name) =>
    name === "index.html" ||
    /^(scripts-|styles-|icon-|xlsx-)/.test(name) ||
    /\.(woff2?|otf|ttf)$/.test(name),
  )
  .sort();
console.log(`[production] public/${listed.join(", public/")}`);

async function fontNameIndex() {
  const index = new Map();
  const families = ["ibm-plex-sans", "ibm-plex-mono"];
  for (const family of families) {
    const dir = join(root, "node_modules", "@fontsource", family, "files");
    for (const name of await readdir(dir)) {
      if (!/\.(woff2?|otf|ttf)$/i.test(name)) continue;
      const bytes = await readFile(join(dir, name));
      index.set(createHash("sha256").update(bytes).digest("hex"), name);
    }
  }
  return index;
}

async function extractCssFonts(cssPath, dir) {
  let css = await readFile(cssPath, "utf8");
  css = css.replace(/font-display:\s*(auto|swap|block|fallback)/gi, "font-display:optional");
  css = css.replace(/@font-face\s*\{/g, (block) =>
    /font-display:/.test(block) ? block : "@font-face{font-display:optional;",
  );
  const names = await fontNameIndex();
  const re =
    /url\(\s*(['"]?)data:(font\/(?:woff2?|opentype)|application\/(?:font-woff2?|octet-stream));base64,([A-Za-z0-9+/=\s]+)\1\s*\)/g;
  const seen = new Map();
  const writes = [];
  css = css.replace(re, (_full, _q, mime, b64) => {
    if (!String(mime).includes("woff2")) return "";
    const bytes = Buffer.from(String(b64).replace(/\s+/g, ""), "base64");
    const digest = createHash("sha256").update(bytes).digest("hex");
    let fileName = seen.get(digest);
    if (!fileName) {
      fileName = names.get(digest) || `font-${digest.slice(0, 16)}.woff2`;
      seen.set(digest, fileName);
      writes.push(writeFile(join(dir, fileName), bytes));
    }
    return `url(./${fileName})`;
  });
  css = css.replace(/src:url\((\.\/[^)]+\.woff2)\)format\("woff2"\),format\("woff"\)/g, 'src:url($1)format("woff2")');
  css = css.replace(/,format\("woff"\)/g, "");
  css = css.replace(/format\("woff"\),/g, "");
  await Promise.all(writes);
  await writeFile(cssPath, css);
  return cssPath.split("/").pop();
}

async function cleanProductionFiles(dir) {
  const names = await readdir(dir);
  for (const name of names) {
    if (name === "__grok" || name === "favicon.svg") continue;
    const generated =
      name === "index.html" ||
      name === "BASLAT.bat" ||
      /^scripts-.+\.js$/.test(name) ||
      /^styles-.+\.css$/.test(name) ||
      /^xlsx-.+\.js$/.test(name) ||
      /^icon-.+\.svg$/.test(name) ||
      /^font-.+\.(woff2|woff|otf|ttf)$/.test(name) ||
      /^ibm-plex-.+\.(woff2|woff|otf|ttf)$/.test(name);
    if (generated) await rm(join(dir, name), { force: true });
  }
}
