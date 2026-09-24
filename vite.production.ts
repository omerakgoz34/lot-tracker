import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [tailwindcss(), react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      react: "preact/compat",
      "react-dom/client": "preact/compat/client",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  define: {
    "import.meta.env.VITE_PRODUCTION": JSON.stringify("1"),
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": JSON.stringify({ NODE_ENV: "production" }),
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(import.meta.dirname, "src/production-main.tsx"),
      name: "DepoLotTakip",
      formats: ["iife"],
      fileName: () => "scripts-[hash].js",
    },
    rollupOptions: {
      external: ["xlsx"],
      output: {
        globals: { xlsx: "XLSX" },
        inlineDynamicImports: true,
        entryFileNames: "scripts-[hash].js",
        chunkFileNames: "scripts-[hash].js",
        assetFileNames: (asset) => {
          const name = asset.names?.[0] || asset.name || "asset";
          if (name.endsWith(".css")) return "styles-[hash][extname]";
          if (/\.(svg|png|jpe?g|gif|webp|ico)$/i.test(name)) return "icon-[hash][extname]";
          if (/\.(woff2?|otf|ttf)$/i.test(name)) return "[name][extname]";
          return "[name]-[hash][extname]";
        },
      },
    },
  },
});
