import api from './api';

export function getTransactions() {
  return api.get('/api/transactions');
}

export function createTransaction(payload) {
  return api.post('/api/transactions', payload);
}

export function updateTransaction(id, payload) {
  return api.put(`/api/transactions/${id}`, payload);
}

export function deleteTransaction(id) {
  return api.delete(`/api/transactions/${id}`);
}
