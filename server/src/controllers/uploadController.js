import { uploadFile } from '../services/uploadService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const upload = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 400, 'No file provided');
    const folder = req.query.folder || 'general';
    const result = await uploadFile(req.file, folder);
    return sendSuccess(res, result, 'File uploaded successfully');
  } catch (err) {
    next(err);
  }
};
