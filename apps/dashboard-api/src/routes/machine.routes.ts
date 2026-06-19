import { Router } from 'express';
import * as machineController from '../controllers/machine.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:id', authMiddleware, machineController.getMachine);

export default router;
