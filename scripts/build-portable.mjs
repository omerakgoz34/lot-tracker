import { createHash } from "node:crypto";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public");

await cleanPortableFiles(outDir);
await build({ configFile: join(root, "vite.portable.ts") });

async function hashedName(prefix, filePath) {
  const bytes = await readFile(filePath);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `${prefix}-${hash}${extname(filePath)}`;
}

const files = (await readdir(outDir)).filter((name) => !name.startsWith(".") && name !== "__grok");
let scriptName = files.find((name) => /^scripts-.+\.js$/.test(name) && !name.includes("[hash]"));
let styleName = files.find((name) => /^styles-.+\.css$/.test(name) && !name.includes("[hash]"));

if (!scriptName) {
  const js = files.find((name) => name.endsWith(".js"));
  if (!js) throw new Error("portable build produced no JS");
  scriptName = await hashedName("scripts", join(outDir, js));
  await writeFile(join(outDir, scriptName), await readFile(join(outDir, js)));
  if (js !== scriptName) await rm(join(outDir, js), { force: true });
}
if (!styleName) {
  const css = files.find((name) => name.endsWith(".css"));
  if (!css) throw new Error("portable build produced no CSS");
  styleName = await hashedName("styles", join(outDir, css));
  await writeFile(join(outDir, styleName), await readFile(join(outDir, css)));
  if (css !== styleName) await rm(join(outDir, css), { force: true });
}

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
    <title>DEPO LOT TAKIP</title>
    <link rel="icon" type="image/svg+xml" href="./${iconName}" />
    <link rel="stylesheet" href="./${styleName}" />
  </head>
  <body class="min-h-dvh bg-background text-foreground">
    <div id="root">
      <noscript>
        <main style="font-family:Segoe UI,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;color:#141414">
          <h1>DEPO LOT TAKIP</h1>
          <p>Bu dosya JavaScript ile calisir. Tarayicida JavaScript acik olmali.</p>
        </main>
      </noscript>
    </div>
    <script>
window.globalThis = window.globalThis || window;
window.global = window.global || window;
window.process = window.process || { env: { NODE_ENV: "production" } };
    </script>
    <script src="./${scriptName}"></script>
  </body>
</html>
`;
await writeFile(join(outDir, "index.html"), html);

const listed = (await readdir(outDir))
  .filter((name) => name === "index.html" || /^(scripts-|styles-|icon-)/.test(name))
  .sort();
console.log(`[portable] public/${listed.join(", public/")}`);

async function cleanPortableFiles(dir) {
  const names = await readdir(dir);
  for (const name of names) {
    if (name === "__grok" || name === "favicon.svg") continue;
    const portable =
      name === "index.html" ||
      name === "BASLAT.bat" ||
      /^scripts-.+\.js$/.test(name) ||
      /^styles-.+\.css$/.test(name) ||
      /^icon-.+\.svg$/.test(name);
    if (portable) await rm(join(dir, name), { force: true });
  }
}
