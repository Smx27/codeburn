import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cors from 'cors';
import helmet from 'helmet';
import dashboardRoutes from './routes/dashboard.routes.js';
import authRoutes from './routes/auth.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import teamRoutes from './routes/team.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import agentRoutes from './routes/agent.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import sessionRoutes from './routes/session.routes.js';
import machineRoutes from './routes/machine.routes.js';
import apiKeyRoutes from './routes/apiKey.routes.js';
import healthRoutes from './routes/health.route.js';
import { closePool } from './database/pool.js';
import { authRateLimit, generalRateLimit } from './middlewares/rateLimit.middleware.js';
import { startOfflineDetection } from './jobs/offlineDetection.js';
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: process.env.NODE_ENV !== 'production',
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});
const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health' || req.url === '/api/v1/version',
  },
}));

app.use('/api/v1/auth', authRateLimit, authRoutes);
app.use('/api/v1/dashboard', generalRateLimit, dashboardRoutes);
app.use('/api/v1/organizations', generalRateLimit, organizationRoutes);
app.use('/api/v1/teams', generalRateLimit, teamRoutes);
app.use('/api/v1/invitations', generalRateLimit, invitationRoutes);
app.use('/api/v1/enrollment-keys', generalRateLimit, enrollmentRoutes);
app.use('/api/v1/agents', generalRateLimit, agentRoutes);
app.use('/api/v1/onboarding', generalRateLimit, onboardingRoutes);
app.use('/api/v1/sessions', generalRateLimit, sessionRoutes);
app.use('/api/v1/machines', generalRateLimit, machineRoutes);
app.use('/api/v1/api-keys', generalRateLimit, apiKeyRoutes);
app.use('/api/v1', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'AiInsight Dashboard API',
    version: process.env.npm_package_version ?? '0.1.0',
    docs: '/api/v1/health',
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Dashboard API listening on port ${PORT}`);
  startOfflineDetection();
});

async function shutdown() {
  logger.info('Shutting down...');
  server.close(async () => {
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app };