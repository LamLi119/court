import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      vue(),
      {
        name: 'spa-fallback-admin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.method !== 'GET' || !req.url) return next();
            const pathname = req.url.split('?')[0];
            if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return next();
            const indexPath = path.resolve(server.config.root, 'index.html');
            fs.readFile(indexPath, 'utf-8', (err, html) => {
              if (err) return next(err);
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
            });
          });
        },
      },
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
