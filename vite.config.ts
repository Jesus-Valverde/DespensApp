import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// HTTPS for preview: lets the PWA be installed from a phone on the same Wi-Fi
// (secure context). Accept the self-signed certificate warning once.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        lang: 'es',
        name: 'DespensApp',
        short_name: 'DespensApp',
        description: 'Gestión local de la despensa: productos, inventario y compras.',
        display: 'standalone',
        start_url: '/',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts'],
    // Heavy Dexie+DOM tests exceed the 5s default under full-suite parallel load,
    // and one-worker-per-file contention makes liveQuery renders flake.
    testTimeout: 15000,
    maxWorkers: 8,
  },
})
