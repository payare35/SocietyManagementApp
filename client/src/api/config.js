import api from './axios';

export const fetchConfig = async () => {
  const res = await api.get('/config');
  return res.data.data;
};

export const updateConfig = async (data) => {
  const res = await api.put('/config', data);
  return res.data.data;
};
