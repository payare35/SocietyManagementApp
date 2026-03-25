import * as configService from '../services/configService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const getConfig = async (req, res, next) => {
  try {
    const config = await configService.getConfig();
    if (!config) return sendError(res, 404, 'Society config not found');
    return sendSuccess(res, config);
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const config = await configService.updateConfig(req.body);
    return sendSuccess(res, config, 'Config updated successfully');
  } catch (err) {
    next(err);
  }
};
