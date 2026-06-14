import { Router } from 'express';
import { authMiddleware, adminOrAbove } from '../middlewares/auth.middleware.js';
import * as organizationController from '../controllers/organization.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', organizationController.createOrganization);
router.get('/current', organizationController.getCurrentOrganization);
router.patch('/current', adminOrAbove, organizationController.updateCurrentOrganization);

export default router;
