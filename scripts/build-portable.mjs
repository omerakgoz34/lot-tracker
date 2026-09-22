import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist-portable");
const artifacts = join(root, "artifacts");

await build({ configFile: join(root, "vite.portable.ts") });

const js = await readFile(join(outDir, "portable.js"), "utf8");
let css = "";
try {
  css = await readFile(join(outDir, "portable.css"), "utf8");
} catch {
  const alt = (await import("node:fs")).readdirSync(outDir).find((name) => name.endsWith(".css"));
  if (alt) css = await readFile(join(outDir, alt), "utf8");
}

css = await inlineCssUrls(css, outDir);

const favicon = await readFile(join(root, "public", "favicon.svg"), "utf8");
const faviconHref = `data:image/svg+xml,${encodeURIComponent(favicon)}`;
const safeJs = js.replace(/<\/script/gi, "<\\/script");

const html = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="color-scheme" content="light dark" />
    <meta name="description" content="Artikel kodundan LOT numarasi. Excel veya Google Sheet, cevrimdisi arama." />
    <title>DEPO LOT TAKIP</title>
    <link rel="icon" type="image/svg+xml" href="${faviconHref}" />
    <style>${css}</style>
  </head>
  <body class="min-h-dvh bg-background text-foreground">
    <div id="root">
      <noscript>
        <main style="font-family:Segoe UI,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;color:#141414">
          <h1>DEPO LOT TAKIP</h1>
          <p>Bu dosya JavaScript ile calisir. Tarayicida JavaScript acik olmali.</p>
          <p>Windows: ZIP icindeki <strong>BASLAT.bat</strong> dosyasina cift tiklayin. HTML indirdikten sonra sag tik > Ozellikler > Engellemeyi Kaldir.</p>
        </main>
      </noscript>
    </div>
    <script>
window.globalThis = window.globalThis || window;
window.global = window.global || window;
window.process = window.process || { env: { NODE_ENV: "production" } };
${safeJs}
    </script>
  </body>
</html>
`;

await mkdir(artifacts, { recursive: true });
const htmlPath = join(artifacts, "DEPO-LOT-TAKIP.html");
await writeFile(htmlPath, html);

const bat = `@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -LiteralPath '%~dp0DEPO-LOT-TAKIP.html'" >nul 2>&1
start "" "%~dp0DEPO-LOT-TAKIP.html"
`;
const batPath = join(artifacts, "BASLAT.bat");
await writeFile(batPath, bat);

const zipPath = join(artifacts, "DEPO-LOT-TAKIP.zip");
await new Promise((resolveZip, rejectZip) => {
  const py = spawn("python3", ["-"], { stdio: ["pipe", "inherit", "inherit"] });
  py.on("exit", (code) => (code === 0 ? resolveZip() : rejectZip(new Error(`zip exit ${code}`))));
  py.on("error", rejectZip);
  py.stdin.end(`
import zipfile
z = zipfile.ZipFile(${JSON.stringify(zipPath)}, "w", zipfile.ZIP_DEFLATED)
z.write(${JSON.stringify(htmlPath)}, "DEPO-LOT-TAKIP.html")
z.write(${JSON.stringify(batPath)}, "BASLAT.bat")
z.close()
`);
});

console.log(
  `[portable] html ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, zip ${(await readFile(zipPath)).length / 1024 | 0} KB`,
);

async function inlineCssUrls(cssText, baseDir) {
  if (!cssText) return "";
  const urlRe = /url\((['"]?)([^'")]+)\1\)/g;
  const matches = [...cssText.matchAll(urlRe)];
  let out = cssText;
  for (const match of matches.reverse()) {
    const spec = match[2];
    if (!spec || spec.startsWith("data:") || spec.startsWith("http:") || spec.startsWith("https:")) continue;
    const filePath = resolve(baseDir, spec.split("?")[0].split("#")[0]);
    try {
      const bytes = await readFile(filePath);
      const mime = mimeFor(filePath);
      const data = `url(data:${mime};base64,${bytes.toString("base64")})`;
      out = out.slice(0, match.index) + data + out.slice(match.index + match[0].length);
    } catch {
      // leave as-is
    }
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
