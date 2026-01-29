import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Custom plugin to resolve @/* imports
const aliasPlugin = {
  name: "alias",
  setup(build) {
    // Resolve @/* to src/*
    build.onResolve({ filter: /^@\// }, (args) => {
      const relativePath = args.path.replace(/^@\//, "");
      const basePath = join(rootDir, "src", relativePath);

      // Try different extensions
      const extensions = [".ts", ".tsx", ".js", ".jsx", ""];
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (existsSync(fullPath)) {
          return { path: fullPath };
        }
        // Also try index files
        const indexPath = join(basePath, `index${ext}`);
        if (existsSync(indexPath)) {
          return { path: indexPath };
        }
      }

      return { path: basePath + ".ts" };
    });
  },
};

await esbuild.build({
  entryPoints: [join(rootDir, "api/_serverless.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(rootDir, "api/index.js"),
  plugins: [aliasPlugin],
  external: [
    // Don't bundle native/binary modules
    "@electric-sql/pglite",
    "pg-native",
  ],
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirname_fn } from 'path';
const require = createRequire(import.meta.url);
`,
  },
});

console.log("✅ Serverless function bundled to api/index.js");
