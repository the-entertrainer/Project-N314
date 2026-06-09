import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // VITE_BASE_PATH is set to '/Project-N314/' in the GitHub Pages workflow.
    // Vercel leaves it unset → defaults to '/' (root).
    base: env.VITE_BASE_PATH || '/',
    server: { port: 3000, host: '0.0.0.0' },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GNEWS_API_KEY':  JSON.stringify(env.GNEWS_API_KEY  || ''),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
  };
});
