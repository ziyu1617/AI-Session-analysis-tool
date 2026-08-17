import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// 后端地址。前端只认 /api，密钥由后端持有，不进入浏览器。
const API_SERVER = process.env.API_SERVER || "http://127.0.0.1:3001";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: "8080",
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: API_SERVER,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  build: {
    outDir: "build",
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "lib",
        replacement: resolve(__dirname, "lib"),
      },
    ],
  },
});
