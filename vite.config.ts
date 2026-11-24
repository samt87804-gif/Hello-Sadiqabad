import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve, relative, sep } from 'node:path';
import { readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

function offlinePrecacheManifest(): Plugin {
  const publicRoot = resolve(process.cwd(), 'public');
  const publicImages = (directory: string): string[] => {
    try {
      return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolutePath = resolve(directory, entry.name);
        if (entry.isDirectory()) return publicImages(absolutePath);
        if (!entry.isFile() || !/\.(?:avif|gif|jpe?g|png|svg|webp|ico)$/i.test(entry.name)) return [];
        return ['/' + relative(publicRoot, absolutePath).split(sep).join('/')];
      });
    } catch {
      return [];
    }
  };
  return {
    name: 'offline-public-route-precache',
    apply: 'build' as const,
    generateBundle(_options: unknown, bundle: Record<string, { type: string; fileName: string }>) {
      const assets = Object.values(bundle)
        .filter((item) => item.type === 'chunk' || item.type === 'asset')
        .map((item) => item.fileName)
        .filter((fileName) =>
          /^assets\/.+-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(fileName) ||
          /^assets\/.+\.(?:avif|gif|jpe?g|png|svg|webp|ico)$/i.test(fileName)
        )
        .map((fileName) => '/' + fileName)
        .concat(publicImages(publicRoot));
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
