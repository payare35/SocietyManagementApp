import { Router } from 'express';
import { body } from 'express-validator';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();
router.use(authMiddleware);

const createValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
];

router.post('/', adminMiddleware, createValidation, createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', adminMiddleware, updateExpense);
router.delete('/:id', adminMiddleware, deleteExpense);

export default router;
