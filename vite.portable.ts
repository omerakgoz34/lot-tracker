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
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  define: {
    "import.meta.env.VITE_PORTABLE": JSON.stringify("1"),
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": JSON.stringify({ NODE_ENV: "production" }),
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(import.meta.dirname, "src/portable-main.tsx"),
      name: "DepoLotTakip",
      formats: ["iife"],
      fileName: () => "scripts-[hash].js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "scripts-[hash].js",
        chunkFileNames: "scripts-[hash].js",
        assetFileNames: (asset) => {
          const name = asset.names?.[0] || asset.name || "asset";
          if (name.endsWith(".css")) return "styles-[hash][extname]";
          if (/\.(svg|png|jpe?g|gif|webp|ico)$/i.test(name)) return "icon-[hash][extname]";
          return "[name]-[hash][extname]";
        },
      },
    },
  },
});
