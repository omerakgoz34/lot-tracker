import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: false,
  resolve: {
    tsconfigPaths: true,
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(import.meta.dirname, "src/xlsx-global.ts"),
      name: "XLSX",
      formats: ["iife"],
      fileName: () => "xlsx-[hash].js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "xlsx-[hash].js",
      },
    },
  },
});
