import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Self-hosts Excalidraw fonts under /fonts (instead of the esm.sh CDN fallback):
 * served from node_modules in dev and copied into the build output.
 * The app points window.EXCALIDRAW_ASSET_PATH to "/".
 */
function excalidrawAssets(): Plugin {
  const require = createRequire(import.meta.url);
  const fontsDir = path.join(path.dirname(require.resolve('@excalidraw/excalidraw')), 'fonts');
  let outDir = path.resolve(__dirname, 'dist');

  return {
    name: 'excalidraw-assets',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use('/fonts', (req, res, next) => {
        const file = path.join(fontsDir, decodeURIComponent((req.url || '').split('?')[0]));
        if (!file.startsWith(fontsDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          return next();
        }
        res.setHeader('Content-Type', 'font/woff2');
        fs.createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      fs.cpSync(fontsDir, path.join(outDir, 'fonts'), { recursive: true });
    },
  };
}

/** Package name of a module inside node_modules (works with pnpm's .pnpm store layout). */
function packageName(id: string): string | undefined {
  const parts = id.split(/[\\/]node_modules[\\/]/);
  if (parts.length < 2) return undefined;
  const [scopeOrName, name] = parts[parts.length - 1].split(/[\\/]/);
  return scopeOrName.startsWith('@') ? `${scopeOrName}/${name}` : scopeOrName;
}

const EXCALIDRAW_WORKER = /@excalidraw[\\/]excalidraw[\\/].*subset-worker\.chunk\.js$/;
// Lazily imported main-thread counterpart of the worker (same heavy subsetting code)
const EXCALIDRAW_SUBSET_SHARED = /@excalidraw[\\/]excalidraw[\\/].*subset-shared\.chunk\.js$/;
let excalidrawWorkerDeps: Set<string> | undefined;

/**
 * Modules reachable from Excalidraw's font-subsetting worker entry. They must not share a chunk
 * with DOM code (Excalidraw's main bundle touches `window` at import time), otherwise the worker
 * fails to start and subsetting runs on the main thread.
 */
function getExcalidrawWorkerDeps(meta: { getModuleIds: () => IterableIterator<string>; getModuleInfo: (id: string) => { importedIds: readonly string[]; importers: readonly string[] } | null }) {
  if (excalidrawWorkerDeps) return excalidrawWorkerDeps;
  const deps = new Set<string>();
  const entry = [...meta.getModuleIds()].find((moduleId) => EXCALIDRAW_WORKER.test(moduleId));
  const queue = entry ? [...(meta.getModuleInfo(entry)?.importedIds ?? [])] : [];
  while (queue.length > 0) {
    const moduleId = queue.pop()!;
    if (deps.has(moduleId)) continue;
    deps.add(moduleId);
    queue.push(...(meta.getModuleInfo(moduleId)?.importedIds ?? []));
  }
  // Only cache once the module graph contains the worker
  if (entry) excalidrawWorkerDeps = deps;
  return deps;
}

export default defineConfig({
  plugins: [react(), tailwindcss(), excalidrawAssets()],
  build: {
    rollupOptions: {
      output: {
        // Library code must never depend on the app entry chunk. Excalidraw's font-subsetting
        // web worker imports the chunks its code lives in; if shared libraries (React, clsx...)
        // or Vite's preload helper are hoisted into the entry, evaluating the entry (which
        // bootstraps the DOM app) inside the worker fails and that work falls back to the main thread.
        manualChunks(id, meta) {
          if (id.includes('vite/preload-helper')) return 'vendor-vite';
          // Excalidraw's worker entry and its lazy main-thread fallback keep their own chunks
          if (EXCALIDRAW_WORKER.test(id) || EXCALIDRAW_SUBSET_SHARED.test(id)) return undefined;
          const workerDeps = getExcalidrawWorkerDeps(meta);
          if (workerDeps.has(id)) {
            // Tiny helpers also imported by the main bundle vs. the heavy worker-only code (kept lazy)
            const importers = meta.getModuleInfo(id)?.importers ?? [];
            const sharedWithMain = importers.some(
              (importer) => !workerDeps.has(importer) && !EXCALIDRAW_WORKER.test(importer) && !EXCALIDRAW_SUBSET_SHARED.test(importer),
            );
            return sharedWithMain ? 'vendor-excalidraw-common' : 'vendor-excalidraw-worker';
          }
          const pkg = packageName(id);
          if (pkg) return `vendor-${pkg.replace('/', '-').replace('@', '')}`;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    hmr: true,
  },
});
