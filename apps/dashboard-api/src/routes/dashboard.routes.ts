import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware, orgAdminOnly } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/overview', authMiddleware, dashboardController.getOverview);
router.get('/providers', authMiddleware, dashboardController.getProviders);
router.get('/models', authMiddleware, dashboardController.getModels);
router.get('/users', authMiddleware, dashboardController.getUsers);
router.get('/projects', authMiddleware, dashboardController.getProjects);
router.get('/trends', authMiddleware, dashboardController.getTrends);
router.post('/backfill', authMiddleware, orgAdminOnly, dashboardController.triggerBackfill);

router.get('/organization', authMiddleware, dashboardController.getOrganizationOverview);
router.get('/agents', authMiddleware, dashboardController.getAgents);
router.get('/sync-jobs', authMiddleware, dashboardController.getSyncJobs);
router.get('/onboarding', authMiddleware, dashboardController.getOnboardingStatus);

export default router;