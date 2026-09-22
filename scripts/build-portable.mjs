import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist-portable");
const artifacts = join(root, "artifacts");

await build({ configFile: join(root, "vite.portable.ts") });

const htmlPath = join(outDir, "portable.html");
let html = await readFile(htmlPath, "utf8");

html = await inlineTag(html, /<link\b([^>]*?)href="([^"]+)"([^>]*)\/?>/g, async (full, pre, href, post) => {
  if (!/\brel=["']stylesheet["']/.test(`${pre} ${post}`)) return full;
  const cssPath = join(outDir, href.replace(/^\.\//, ""));
  let css = await readFile(cssPath, "utf8");
  css = await inlineCssUrls(css, dirname(cssPath));
  return `<style>${css}</style>`;
});

html = await inlineTag(html, /<script\b([^>]*?)src="([^"]+)"([^>]*)><\/script>/g, async (full, pre, src) => {
  const jsPath = join(outDir, src.replace(/^\.\//, ""));
  const js = await readFile(jsPath, "utf8");
  const typeMatch = pre.match(/\btype="([^"]+)"/);
  const type = typeMatch?.[1] ?? "module";
  return `<script type="${type}">${js.replace(/<\/script/gi, "<\\/script")}</script>`;
});

const favicon = await readFile(join(root, "public", "favicon.svg"), "utf8");
const faviconHref = `data:image/svg+xml,${encodeURIComponent(favicon)}`;
if (!html.includes('rel="icon"')) {
  html = html.replace("</head>", `<link rel="icon" type="image/svg+xml" href="${faviconHref}" />\n</head>`);
}

await mkdir(artifacts, { recursive: true });
const dest = join(artifacts, "DEPO-LOT-TAKIP.html");
await writeFile(dest, html);
console.log(`[portable] wrote ${dest} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

async function inlineTag(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)];
  let out = source;
  for (const match of matches.reverse()) {
    const replacement = await replacer(...match);
    out = out.slice(0, match.index) + replacement + out.slice(match.index + match[0].length);
  }
  return out;
}

async function inlineCssUrls(css, baseDir) {
  const urlRe = /url\((['"]?)([^'")]+)\1\)/g;
  const matches = [...css.matchAll(urlRe)];
  let out = css;
  for (const match of matches.reverse()) {
    const spec = match[2];
    if (spec.startsWith("data:") || spec.startsWith("http:") || spec.startsWith("https:")) continue;
    const filePath = resolve(baseDir, spec.split("?")[0].split("#")[0]);
    const bytes = await readFile(filePath);
    const mime = mimeFor(filePath);
    const data = `url(data:${mime};base64,${bytes.toString("base64")})`;
    out = out.slice(0, match.index) + data + out.slice(match.index + match[0].length);
  }
  return out;
}

function mimeFor(filePath) {
  if (filePath.endsWith(".woff2")) return "font/woff2";
  if (filePath.endsWith(".woff")) return "font/woff";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}
