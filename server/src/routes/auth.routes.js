import { Router } from 'express';
import { loginController, logoutController, meController, recoverController, registerController, resolveInvitationController, rotateRecoveryCodeController, updateProfileController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/recover', recoverController);
router.post('/logout', logoutController);
router.get('/me', requireAuth, meController);
router.post('/invitations/:invitationId', requireAuth, resolveInvitationController);
router.patch('/profile', requireAuth, updateProfileController);
router.post('/recovery-code', requireAuth, rotateRecoveryCodeController);

export default router;
