import { Router, Request, Response } from 'express';
import { getPool } from '../database/pool.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

router.get('/version', (req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version ?? '0.1.0',
    name: 'aiinsight-dashboard-api',
  });
});

export default router;