import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { viewFile } from '../controllers/fileController.js';

const router = Router();
router.use(authMiddleware);
router.get('/view', viewFile);

export default router;
