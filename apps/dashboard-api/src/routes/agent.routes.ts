import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as agentController from '../controllers/agent.controller.js';

const router = Router();

router.post('/register', agentController.registerAgent);
router.post('/heartbeat', agentController.heartbeat);
router.get('/config', authMiddleware, agentController.getAgentConfig);
router.get('/', authMiddleware, agentController.listAgents);
router.get('/:id', authMiddleware, agentController.getAgent);

export default router;
