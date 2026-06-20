import { Router, Request, Response } from 'express';
import { queryOne, query } from '../database/pool.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await queryOne('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

router.get('/version', (req: Request, res: Response) => {
  res.json({ 
    version: process.env.npm_package_version ?? '0.1.0',
    name: 'aiinsight-ingestion-api'
  });
});

router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { machineId, organizationId } = req.body;
    if (!machineId || !organizationId) {
      res.status(400).json({ error: 'machineId and organizationId required' });
      return;
    }
    await query(
      'UPDATE machines SET last_seen = NOW(), status = $1 WHERE id = $2 AND organization_id = $3',
      ['ONLINE', machineId, organizationId]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

export default router;