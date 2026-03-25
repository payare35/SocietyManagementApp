import api from './axios';

export const fetchDues = async (params = {}) => {
  const res = await api.get('/dues', { params });
  return res.data.data;
};

export const fetchMyDues = async (params = {}) => {
  const res = await api.get('/dues/my', { params });
  return res.data.data;
};

export const generateDues = async (month) => {
  const res = await api.post('/dues/generate', { month });
  return res.data.data;
};
