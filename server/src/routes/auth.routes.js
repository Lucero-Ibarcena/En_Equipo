// [API: RUTAS DE CUENTA] Relaciona cada dirección de autenticación con su controlador.
import { Router } from 'express';
import {
  acknowledgeRecoveryController,
  loginController,
  logoutController,
  meController,
  recoverController,
  recoveryConfirmationPageController,
  registerController,
  resolveInvitationController,
  startPhoneVerificationController,
  startRecoveryController,
  updateProfileController,
  verifyPhoneController,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/recover/start', startRecoveryController);
router.get('/recover/confirm', recoveryConfirmationPageController);
router.post('/recover/confirm', acknowledgeRecoveryController);
router.post('/recover', recoverController);
router.post('/logout', logoutController);
router.get('/me', requireAuth, meController);
router.post('/invitations/:invitationId', requireAuth, resolveInvitationController);
router.patch('/profile', requireAuth, updateProfileController);
router.post('/phone/start', requireAuth, startPhoneVerificationController);
router.post('/phone/verify', requireAuth, verifyPhoneController);
export default router;
