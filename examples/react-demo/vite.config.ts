import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Demo intentionally includes the full workflow library and graph runtime.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "EVAL" && warning.id?.includes("litegraph.js")) {
          return;
        }
        warn(warning);
      },
    },
  },
});
