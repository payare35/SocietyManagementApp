import api from './axios';

export const fetchExpenses = async (params = {}) => {
  const res = await api.get('/expenses', { params });
  return res.data.data;
};

export const fetchExpenseById = async (id) => {
  const res = await api.get(`/expenses/${id}`);
  return res.data.data;
};

export const createExpense = async (data) => {
  const res = await api.post('/expenses', data);
  return res.data.data;
};

export const updateExpense = async (id, data) => {
  const res = await api.put(`/expenses/${id}`, data);
  return res.data.data;
};

export const deleteExpense = async (id) => {
  const res = await api.delete(`/expenses/${id}`);
  return res.data.data;
};
