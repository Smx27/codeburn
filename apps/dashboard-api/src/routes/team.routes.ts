import { Router } from 'express';
import { authMiddleware, adminOrAbove } from '../middlewares/auth.middleware.js';
import * as teamController from '../controllers/team.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', teamController.listTeams);
router.post('/', adminOrAbove, teamController.createTeam);
router.patch('/:id', adminOrAbove, teamController.updateTeam);
router.delete('/:id', adminOrAbove, teamController.deleteTeam);
router.post('/:id/members', adminOrAbove, teamController.addTeamMember);
router.delete('/:id/members/:userId', adminOrAbove, teamController.removeTeamMember);

export default router;
