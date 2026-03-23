import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const isTauriDebug = Boolean(process.env.TAURI_ENV_DEBUG);

export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"]
    }
  },
  build: {
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: isTauriDebug ? false : "esbuild",
    sourcemap: isTauriDebug
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true
  }
});
