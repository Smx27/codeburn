import { Router } from 'express';
import * as sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, sessionController.listSessions);
router.get('/:id', authMiddleware, sessionController.getSession);

export default router;
