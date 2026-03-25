import { Router } from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  createSelfTransaction,
  getTransactions,
  getMyTransactions,
  getTransactionById,
  updateTransactionStatus,
} from '../controllers/transactionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();
router.use(authMiddleware);

const txValidation = [
  body('memberId').notEmpty().withMessage('Member ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
  body('type').isIn(['maintenance', 'penalty', 'other']).withMessage('Invalid type'),
];

const selfTxValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
];

router.post('/', adminMiddleware, txValidation, createTransaction);
router.post('/self', selfTxValidation, createSelfTransaction);
router.get('/', adminMiddleware, getTransactions);
router.get('/my', getMyTransactions);
router.get('/:id', getTransactionById);
router.put('/:id/status', adminMiddleware, updateTransactionStatus);

export default router;
