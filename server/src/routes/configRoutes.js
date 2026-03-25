import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/configController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getConfig);
router.put('/', adminMiddleware, updateConfig);

export default router;
