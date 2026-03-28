import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/ui/web-component/index.ts",
      name: "C1XWorkflowBuilder",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      // Keep heavy UI/runtime deps external so consumers do not inherit bundled eval/size warnings.
      external: ["litegraph.js", "@shoelace-style/shoelace"],
      onwarn(warning, warn) {
        if (warning.code === "EVAL" && warning.id?.includes("litegraph")) {
          return;
        }
        warn(warning);
      },
    },
  },
  plugins: [dts({ insertTypesEntry: true })],
});
