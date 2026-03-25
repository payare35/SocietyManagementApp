import { validationResult } from 'express-validator';
import * as duesService from '../services/duesService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const generateDues = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
    const result = await duesService.generateDues(req.body.month);
    return sendSuccess(res, result, `Generated ${result.generated} dues, skipped ${result.skipped} existing`, 201);
  } catch (err) {
    next(err);
  }
};

export const getDues = async (req, res, next) => {
  try {
    const { month, status, search, page = 1, limit = 20 } = req.query;
    const result = await duesService.getDues({ month, status, search }, page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getMyDues = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await duesService.getMyDues(req.user.uid, page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
