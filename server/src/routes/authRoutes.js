import { Router } from 'express';
import { login, getMe, lookupEmail } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', authMiddleware, login);
router.get('/me', authMiddleware, getMe);

// Public: resolves which Firebase Auth email is registered for a given contact number.
// Used by the login page to support contact-number login for members with a real email.
router.post('/lookup', lookupEmail);

export default router;
