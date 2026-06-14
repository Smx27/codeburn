import { Router } from 'express';
import { ingestBatch, ingestSessions, ingestEvents } from '../controllers/ingestion.controller.js';
import { BatchUploadSchema, SyncSessionSchema, SyncEventSchema } from '../validators/ingestion.validator.js';
import { z } from 'zod';

const router = Router();

// Validation middleware
function validateBody(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: result.error.flatten() 
      });
    }
    req.body = result.data;
    next();
  };
}

router.post('/batch', validateBody(BatchUploadSchema), ingestBatch);
router.post('/sessions', validateBody(z.object({
  organizationId: z.string().uuid(),
  machineId: z.string().uuid(),
  provider: z.string().min(1),
  sessions: z.array(SyncSessionSchema),
})), ingestSessions);
router.post('/events', validateBody(z.object({
  organizationId: z.string().uuid(),
  machineId: z.string().uuid(),
  provider: z.string().min(1),
  events: z.array(SyncEventSchema),
})), ingestEvents);

export default router;