import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 3000,
    host: "0.0.0.0",
    strictPort: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
