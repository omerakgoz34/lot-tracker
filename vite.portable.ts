import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
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
    outDir: "dist-portable",
    emptyOutDir: true,
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(import.meta.dirname, "src/portable-main.tsx"),
      name: "DepoLotTakip",
      formats: ["iife"],
      fileName: () => "portable.js",
    },
  },
});
