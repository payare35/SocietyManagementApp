import { validationResult } from 'express-validator';
import * as transactionService from '../services/transactionService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
    const tx = await transactionService.createTransaction(req.body, req.user.uid);
    return sendSuccess(res, tx, 'Transaction recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const createSelfTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
    const tx = await transactionService.createSelfTransaction(req.body, req.user.uid);
    return sendSuccess(res, tx, 'Payment submitted for verification', 201);
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { status, month, memberId, search, page = 1, limit = 20 } = req.query;
    const result = await transactionService.getTransactions(
      { status, month, memberId, search },
      page,
      limit
    );
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getMyTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await transactionService.getMyTransactions(req.user.uid, page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const tx = await transactionService.getTransactionById(req.params.id);
    if (!tx) return sendError(res, 404, 'Transaction not found');
    if (req.user.role !== 'admin' && tx.memberId !== req.user.uid) {
      return sendError(res, 403, 'Forbidden');
    }
    return sendSuccess(res, tx);
  } catch (err) {
    next(err);
  }
};

export const updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'rejected', 'pending'].includes(status)) {
      return sendError(res, 400, 'Invalid status value');
    }
    const tx = await transactionService.updateTransactionStatus(req.params.id, status, req.user.uid);
    return sendSuccess(res, tx, 'Transaction status updated');
  } catch (err) {
    next(err);
  }
};
