import api from './axios';

export const uploadFile = async (file, folder = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/upload?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};
