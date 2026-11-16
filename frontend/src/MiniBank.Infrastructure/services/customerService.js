import { apiClient } from '../api/client';

export const customerService = {
  getAll: async () => {
    const response = await apiClient.get('/Customers');
    return response.data.success ? response.data.data : [];
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Customers/${id}`);
    return response.data.success ? response.data.data : null;
  },

  create: async (customerData) => {
    const response = await apiClient.post('/Customers', customerData);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  update: async (id, customerData) => {
    const response = await apiClient.put(`/Customers/${id}`, customerData);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  }
};
