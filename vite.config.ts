import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
