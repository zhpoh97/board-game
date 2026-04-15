import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { createSocketServer } from './socket/index.js';
import { log } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static client build in production
const clientDist = join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// SPA fallback: serve index.html for any non-API route
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

const httpServer = createServer(app);
createSocketServer(httpServer);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  log('Server', `Cockroach Poker server running on port ${PORT}`);
});
