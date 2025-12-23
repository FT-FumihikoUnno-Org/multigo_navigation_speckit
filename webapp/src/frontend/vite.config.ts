import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Multi-Go App',
        short_name: 'MultiGo',
        description: 'Multi-Go Web Application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        // Disable PWA dev registration in development to avoid a service worker
        // hijacking network requests and serving stale or built assets that might
        // reference an absolute backend URL.
        enabled: process.env.NODE_ENV !== 'development',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  // Dev server proxy so frontend requests to /api and /auth are forwarded to backend
  server: {
    proxy: (() => {
      const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || process.env.VITE_API_URL || 'http://localhost:3000';
      return {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      };
    })(),
  },
});