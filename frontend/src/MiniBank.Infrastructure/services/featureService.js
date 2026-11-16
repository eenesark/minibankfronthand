import { apiClient } from '../api/client';

export const featureService = {
  /**
   * Sistemde tanımlı tüm bankacılık özellikleri kataloğunu döner
   * Endpoint: GET /api/Admin/features/catalog
   */
  getCatalog: async () => {
    const response = await apiClient.get('/Admin/features/catalog');
    return response.data.success ? response.data.data : [];
  },

  /**
   * Belirtilen müşterinin özelliklerini listeler
   * Endpoint: GET /api/Admin/customers/{customerId}/features
   */
  getCustomerFeatures: async (customerId) => {
    const response = await apiClient.get(`/Admin/customers/${customerId}/features`);
    return response.data.success ? response.data.data : [];
  },

  /**
   * Admin'in müşteriye belirli bir özelliği açıp kapatmasını veya özel parametre atamasını sağlar
   * Endpoint: POST /api/Admin/customers/{customerId}/features/set
   */
  setCustomerFeature: async (customerId, payload) => {
    const response = await apiClient.post(`/Admin/customers/${customerId}/features/set`, payload);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  /**
   * Admin'in müşteriye birden çok özelliği tek seferde toplu olarak güncellemesini sağlar
   * Endpoint: POST /api/Admin/customers/{customerId}/features/bulk
   */
  bulkUpdateCustomerFeatures: async (customerId, features) => {
    const response = await apiClient.post(`/Admin/customers/${customerId}/features/bulk`, features);
    return response.data.success ? response.data.data : [];
  }
};
