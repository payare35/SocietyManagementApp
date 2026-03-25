import { Router } from 'express';
import { body } from 'express-validator';
import { generateDues, getDues, getMyDues } from '../controllers/duesController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();
router.use(authMiddleware);

router.post(
  '/generate',
  adminMiddleware,
  [body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format')],
  generateDues
);
router.get('/', adminMiddleware, getDues);
router.get('/my', getMyDues);

export default router;
