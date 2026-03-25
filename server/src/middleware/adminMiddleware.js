import { sendError } from '../utils/responseFormatter.js';

export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 403, 'Forbidden: Admin access required');
  }
  next();
};
