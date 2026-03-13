import { defineConfig } from "vite";
import wails from "@wailsio/runtime/plugins/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [wails("./bindings")],
  build: {
    rollupOptions: {
      input: {
        // Main entry point
        main: resolve(__dirname, "index.html"),
        // Your discovery page entry point
        discover: resolve(__dirname, "src/pages/discover-servers.html"),
      },
    },
  },
});