import { getAdminStats } from '../services/dashboardService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await getAdminStats();
    return sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
};
