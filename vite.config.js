// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react()
  ],
  
  resolve: {
    alias: [
      // Signal Protocol and related libraries
      {
        find: 'libsignal-protocol',
        replacement: fileURLToPath(
          new URL('node_modules/libsignal-protocol/dist/libsignal-protocol.js', import.meta.url)
        )
      },
      {
        find: /libsignal-protocol\/src\/curve\.js/,
        replacement: fileURLToPath(
          new URL('src/shims/long-shim.js', import.meta.url)
        )
      },
      {
        find: 'long',
        replacement: fileURLToPath(
          new URL('src/shims/long-shim.js', import.meta.url)
        )
      },
      {
        find: 'bytebuffer',
        replacement: fileURLToPath(
          new URL('src/shims/bytebuffer-shim.js', import.meta.url)
        )
      },
      {
        find: 'mocha-bytebuffer',
        replacement: fileURLToPath(
          new URL('src/shims/bytebuffer-shim.js', import.meta.url)
        )
      },
      
      // Cookie and set-cookie handling
      {
        find: /^cookie(\/.*)?$/,
        replacement: fileURLToPath(
          new URL('src/shims/cookie-shim.js', import.meta.url)
        )
      },
      {
        find: /^set-cookie-parser(\/.*)?$/,
        replacement: fileURLToPath(
          new URL('src/shims/set-cookie-parser-shim.js', import.meta.url)
        )
      }
    ]
  },
  
  optimizeDeps: {
    exclude: [
      'libsignal-protocol',
      'bytebuffer',
      'long',
      'react-dom/client',
      'react-router-dom'
    ],
    include: [
      'set-cookie-parser-es'
    ]
  },
  
  build: {
    commonjsOptions: {
      include: [/node_modules/], // garantir CJS compatível
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('libsignal-protocol')) return 'vendor-signal';
            if (id.includes('cookie') || id.includes('set-cookie-parser')) return 'vendor-cookies';
            return 'vendor';
          }
        }
      }
    },
    target: 'esnext', // para suportar mais otimizações
    sourcemap: true,   // ajuda em debugging
    minify: 'esbuild'  // minificação rápida via esbuild
  },

  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.ngrok-free.app'],
    https: false, // Ativar SSL só se precisar depois
  }
});
