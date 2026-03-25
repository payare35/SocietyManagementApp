import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
} from '../controllers/memberController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();
router.use(authMiddleware, adminMiddleware);

const createValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('contactNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid Indian mobile number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('flatNumber').notEmpty().withMessage('Flat number is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

const updateValidation = [
  body('contactNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid Indian mobile number'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.post('/', createValidation, createMember);
router.get('/', getMembers);
router.get('/:id', getMemberById);
router.put('/:id', updateValidation, updateMember);
router.delete('/:id', deleteMember);

export default router;
