import { auth } from '../config/firebase.js';
import { sendError } from '../utils/responseFormatter.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Unauthorized: No token provided');
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      role: decoded.role || 'member',
      email: decoded.email,
    };
    next();
  } catch {
    return sendError(res, 401, 'Unauthorized: Invalid or expired token');
  }
};
