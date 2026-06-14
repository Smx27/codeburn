import { Router } from 'express';
import { authMiddleware, adminOrAbove } from '../middlewares/auth.middleware.js';
import * as invitationController from '../controllers/invitation.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOrAbove, invitationController.createInvitation);
router.get('/', invitationController.listInvitations);
router.post('/accept', invitationController.acceptInvitation);
router.delete('/:id', adminOrAbove, invitationController.revokeInvitation);
router.post('/:id/resend', adminOrAbove, invitationController.resendInvitation);

export default router;
