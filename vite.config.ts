import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  plugins: [
    tsConfigPaths(),
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.app.json",
      include: ["./src"],
      exclude: ["*.json"],
    }),
  ],
  build: {
    target: "node20",
    outDir: "./dist",
    lib: {
      entry: "./src/index.ts",
      name: "ReactCurse",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      },
      external: [
        /node:/,
        "react",
        "react-reconciler",
        "react/jsx-runtime"
      ],
    },
  },
  resolve: {
    preserveSymlinks: true,
  },
}));