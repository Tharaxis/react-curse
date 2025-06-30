import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  plugins: [
    tsConfigPaths(),
  ],
  build: {
    target: "node20",
    outDir: "./dist",
    emptyOutDir: false,
    lib: {
      entry: "./example/index.tsx",
      name: "Example",
      formats: ["es"],
      fileName: "example",
    },
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      },
      external: [
        "react",
        "../dist/index.js",
      ],
    },
  },
  resolve: {
    preserveSymlinks: true,
  },
}));