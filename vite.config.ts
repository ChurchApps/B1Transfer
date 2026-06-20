import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // apphelper reads process.env.REACT_APP_* (mapped to import.meta.env below), so expose that prefix too.
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 3102,
    open: true
  },
  build: {
    outDir: "build",
    sourcemap: true
  },
  define: {
    global: "globalThis",
    "process.env": "import.meta.env"
  },
  resolve: { alias: { buffer: "buffer" } }
});
