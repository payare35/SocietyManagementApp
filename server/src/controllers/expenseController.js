import { validationResult } from 'express-validator';
import * as expenseService from '../services/expenseService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
    const expense = await expenseService.createExpense(req.body, req.user.uid);
    return sendSuccess(res, expense, 'Expense created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const result = await expenseService.getExpenses({ type, startDate, endDate }, page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    if (!expense) return sendError(res, 404, 'Expense not found');
    return sendSuccess(res, expense);
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    if (!expense) return sendError(res, 404, 'Expense not found');
    return sendSuccess(res, expense, 'Expense updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    return sendSuccess(res, { id: req.params.id }, 'Expense deleted successfully');
  } catch (err) {
    next(err);
  }
};
