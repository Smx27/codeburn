import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as onboardingController from '../controllers/onboarding.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/progress', onboardingController.getOnboardingProgress);

export default router;
