import { apiClient } from '../api/client';
import { storageService } from '../storage/storageService';

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/Auth/login', credentials);
    if (response.data.success) {
      const data = response.data.data;
      if (data?.token) {
        storageService.setToken(data.token);
        storageService.setUser(data);
      }
      return { ...data, message: response.data.message };
    }
    return null;
  },

  register: async (registerData) => {
    const response = await apiClient.post('/Auth/register', registerData);
    if (response.data.success) {
      const data = response.data.data;
      if (data?.token) {
        storageService.setToken(data.token);
        storageService.setUser(data);
      }
      return { ...data, message: response.data.message };
    }
    return null;
  },

  forgotPassword: async (resetData) => {
    const response = await apiClient.post('/Auth/forgot-password', resetData);
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data
    };
  },

  getMe: async () => {
    const response = await apiClient.get('/Auth/me');
    return response.data.success ? response.data.data : null;
  },

  updateProfile: async (payload) => {
    const response = await apiClient.put('/Auth/me', payload);
    if (response.data.success) {
      const result = response.data.data;
      try {
        const existing = storageService.getUser() || {};
        const updated = {
          ...existing,
          ...result,
          fullName: result.fullName || `${result.firstName || ''} ${result.lastName || ''}`.trim()
        };
        storageService.setUser(updated);
      } catch {}
      return { ...result, message: response.data.message };
    }
    return null;
  },

  logout: () => {
    storageService.clearSession();
  },

  getCurrentUser: () => {
    return storageService.getUser();
  }
};
