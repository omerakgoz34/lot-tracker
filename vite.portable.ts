import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), react()],
  resolve: {
    tsconfigPaths: true,
    alias: { "@": path.resolve(__dirname, "src") },
  },
  define: {
    "import.meta.env.VITE_PORTABLE": JSON.stringify("1"),
  },
  build: {
    outDir: "dist-portable",
    emptyOutDir: true,
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, "portable.html"),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
