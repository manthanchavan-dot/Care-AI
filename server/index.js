import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createApp } from './app.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const localEnvPath = path.resolve(serverDir, '.env');
const rootEnvPath = path.resolve(serverDir, '..', '.env');
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : rootEnvPath;
dotenv.config({ path: envPath });

const app = createApp();

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  // Create the real HTTP server ourselves so we can hand it to Vite below.
  // This is required for Vite's HMR websocket to work correctly when Vite
  // is mounted as middleware inside an existing Express server — without
  // it, the HMR client in the browser can never establish its websocket,
  // keeps retrying, and Vite falls back to forcing full-page reloads
  // instead of doing a proper hot update. That's what was causing the
  // page to keep reloading itself repeatedly in dev.
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use((await import('express')).default.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CareSlot AI running on http://0.0.0.0:${PORT}`);
  });
}

start();
