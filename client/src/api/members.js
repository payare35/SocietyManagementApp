import api from './axios';

export const fetchMembers = async (params = {}) => {
  const res = await api.get('/members', { params });
  return res.data.data;
};

export const fetchMemberById = async (id) => {
  const res = await api.get(`/members/${id}`);
  return res.data.data;
};

export const createMember = async (data) => {
  const res = await api.post('/members', data);
  return res.data.data;
};

export const updateMember = async (id, data) => {
  const res = await api.put(`/members/${id}`, data);
  return res.data.data;
};

export const deleteMember = async (id) => {
  const res = await api.delete(`/members/${id}`);
  return res.data.data;
};
