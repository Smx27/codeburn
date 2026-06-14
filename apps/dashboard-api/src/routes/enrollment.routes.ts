import { Router } from 'express';
import { authMiddleware, adminOrAbove } from '../middlewares/auth.middleware.js';
import * as enrollmentController from '../controllers/enrollment.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOrAbove, enrollmentController.generateKey);
router.get('/', enrollmentController.listKeys);
router.delete('/:id', adminOrAbove, enrollmentController.revokeKey);
router.post('/:id/rotate', adminOrAbove, enrollmentController.rotateKey);

export default router;
