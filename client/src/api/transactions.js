import api from './axios';

export const fetchTransactions = async (params = {}) => {
  const res = await api.get('/transactions', { params });
  return res.data.data;
};

export const fetchMyTransactions = async (params = {}) => {
  const res = await api.get('/transactions/my', { params });
  return res.data.data;
};

export const createTransaction = async (data) => {
  const res = await api.post('/transactions', data);
  return res.data.data;
};

export const createSelfTransaction = async (data) => {
  const res = await api.post('/transactions/self', data);
  return res.data.data;
};

export const updateTransactionStatus = async (id, status) => {
  const res = await api.put(`/transactions/${id}/status`, { status });
  return res.data.data;
};
