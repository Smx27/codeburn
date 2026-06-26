import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import ingestionRoutes from './routes/ingestion.routes.js';
import healthRoutes from './routes/health.route.js';
import openapiRoutes from './routes/openapi.route.js';
import { closePool } from './database/pool.js';
import { ingestAuthMiddleware } from './middlewares/auth.middleware.js';
import { ingestRateLimit } from './middlewares/rateLimit.middleware.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
    : undefined,
});

const NIRIKSH_BANNER = `
 ██╗██╗██╗  ██╗██╗██╗██╗  ██╗ ██████╗ ███████╗██╗██████╗ ██╗███╗   ██╗ ██████╗
███║██║██║  ██║██║██║██║  ██║██╔═══██╗██╔════╝██║██╔══██╗██║████╗  ██║██╔════╝
╚██║██║██║  ██║██║██║██║  ██║██║   ██║███████╗██║██████╔╝██║██╔██╗ ██║██║  ███╗
 ██║╚═╝██║  ██║╚═╝██║██║  ██║██║   ██║╚════██║██║██╔═══╝ ██║██║╚██╗██║██║   ██║
 ██║██╗╚█████╔╝██╗██║╚█████╔╝╚██████╔╝███████║██║██║     ██║██║ ╚████║╚██████╔╝
 ╚═╝╚═╝ ╚════╝ ╚═╝╚═╝ ╚════╝  ╚═════╝ ╚══════╝╚═╝╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝
                              ██████╗  █████╗ ███╗   ██╗██████╗ ██╗   ██╗██╗███████╗███████╗
                             ██╔════╝ ██╔══██╗████╗  ██║██╔══██╗╚██╗ ██╔╝██║██╔════╝██╔════╝
                             ██║  ███╗███████║██╔██╗ ██║██║  ██║ ╚████╔╝ ██║█████╗  ███████╗
                             ██║   ██║██╔══██║██║╚██╗██║██║  ██║  ╚██╔╝  ██║██╔══╝  ╚════██║
                             ╚██████╔╝██║  ██║██║ ╚████║██████╔╝   ██║   ██║███████╗███████║
                              ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝`;

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({ logger }));

app.use('/api/v1/ingest', ingestRateLimit, ingestAuthMiddleware, ingestionRoutes);
app.use('/api/v1', healthRoutes);
app.use('/api', openapiRoutes);

app.get('/', (req, res) => {
  res.json({ 
    name: 'AiInsight Ingestion API',
    version: process.env.npm_package_version ?? '0.1.0',
    docs: '/api/docs',
    openapi: '/api/openapi.json'
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(NIRIKSH_BANNER);
  logger.info(`Ingestion API listening on port ${PORT}`);
  logger.info(`API docs available at ${(process.env.BASE_URL || `http://localhost:${PORT}`)}/api/docs`);
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  server.close(async () => {
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app };