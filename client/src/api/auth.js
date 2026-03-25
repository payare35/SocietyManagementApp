import api from './axios';
import axios from 'axios';

export const loginVerify = async (token) => {
  const res = await api.post('/auth/login', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const getMe = async (token) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  const res = await axios.get(`${baseURL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

/**
 * Given a contact number, asks the backend for the Firebase Auth email
 * registered to that member (real email or synthetic contact@society.app).
 * Returns null if not found.
 */
export const lookupEmailByContact = async (contact) => {
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    const res = await axios.post(`${baseURL}/auth/lookup`, { contact });
    return res.data.data?.email || null;
  } catch {
    return null;
  }
};
