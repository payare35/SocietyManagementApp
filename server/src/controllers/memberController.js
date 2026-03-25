import { validationResult } from 'express-validator';
import * as memberService from '../services/memberService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const createMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
    const member = await memberService.createMember(req.body, req.user.uid);
    return sendSuccess(res, member, 'Member created successfully', 201);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return sendError(res, 409, 'A member with this contact number or email already exists');
    }
    next(err);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const result = await memberService.getMembers(search, page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getMemberById = async (req, res, next) => {
  try {
    const member = await memberService.getMemberById(req.params.id);
    if (!member) return sendError(res, 404, 'Member not found');
    return sendSuccess(res, member);
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());
    const member = await memberService.updateMember(req.params.id, req.body);
    if (!member) return sendError(res, 404, 'Member not found');
    return sendSuccess(res, member, 'Member updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    await memberService.deleteMember(req.params.id);
    return sendSuccess(res, { id: req.params.id }, 'Member deactivated successfully');
  } catch (err) {
    next(err);
  }
};
