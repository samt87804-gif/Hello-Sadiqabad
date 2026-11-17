import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function offlinePrecacheManifest() {
  return {
    name: 'offline-public-route-precache',
    apply: 'build' as const,
    generateBundle(_options: unknown, bundle: Record<string, { type: string; fileName: string }>) {
      const assets = Object.values(bundle)
        .filter((item) => item.type === 'chunk' || item.type === 'asset')
        .map((item) => item.fileName)
        .filter((fileName) => /^assets\/.+-[A-Za-z0-9_-]{6,}\\.(?:js|css)$/.test(fileName))
        .map((fileName) => `/${fileName}`);
      this.emitFile({
        type: 'asset',
        fileName: 'offline-precache.json',
        source: JSON.stringify([...new Set(assets)]),
      });
    },
  };
}

export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), offlinePrecacheManifest()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
