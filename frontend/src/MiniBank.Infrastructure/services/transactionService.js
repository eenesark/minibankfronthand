import { apiClient } from '../api/client';

export const transactionService = {
  deposit: async (depositData) => {
    const response = await apiClient.post('/Transactions/deposit', depositData);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  withdraw: async (withdrawData) => {
    const response = await apiClient.post('/Transactions/withdraw', withdrawData);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  transfer: async (transferData) => {
    const response = await apiClient.post('/Transactions/transfer', transferData);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  getHistory: async (accountId) => {
    const response = await apiClient.get(`/Transactions/history/${accountId}`);
    return response.data.success ? response.data.data : [];
  }
};
