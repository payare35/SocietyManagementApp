import { getUserProfile, lookupAuthEmailByContact } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const login = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) return sendError(res, 404, 'User profile not found');
    return sendSuccess(res, profile, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) return sendError(res, 404, 'User profile not found');
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const lookupEmail = async (req, res, next) => {
  try {
    const { contact } = req.body;
    if (!contact || !/^[6-9]\d{9}$/.test(contact)) {
      return sendError(res, 400, 'Provide a valid 10-digit Indian mobile number');
    }
    const email = await lookupAuthEmailByContact(contact);
    if (!email) return sendError(res, 404, 'No active member found with this contact number');
    return sendSuccess(res, { email });
  } catch (err) {
    next(err);
  }
};
