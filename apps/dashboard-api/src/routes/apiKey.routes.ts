import { Router } from 'express';
import { authMiddleware, adminOrAbove } from '../middlewares/auth.middleware.js';
import * as apiKeyController from '../controllers/apiKey.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', apiKeyController.listApiKeys);
router.post('/', adminOrAbove, apiKeyController.createApiKey);
router.delete('/:id', adminOrAbove, apiKeyController.deleteApiKey);

export default router;
