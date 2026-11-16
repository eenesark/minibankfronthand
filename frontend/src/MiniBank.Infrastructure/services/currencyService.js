import { apiClient } from '../api/client';

export const currencyService = {
  /**
   * TCMB Canlı Döviz ve Altın Kurlarını çeker
   * Endpoint: GET /api/Currency/rates
   */
  getRates: async () => {
    const response = await apiClient.get('/Currency/rates');
    return response.data.success ? response.data.data : [];
  },

  /**
   * Canlı kur hesaplama / çevirme simülasyonu
   * Endpoint: POST /api/Currency/calculate
   */
  calculate: async (payload) => {
    const response = await apiClient.post('/Currency/calculate', payload);
    return response.data.success ? response.data.data : null;
  },

  /**
   * Müşteriye yeni Döviz (USD, EUR) veya Altın (XAU) hesabı açar
   * Endpoint: POST /api/Accounts/open-currency-account
   */
  openCurrencyAccount: async (payload) => {
    const response = await apiClient.post('/Accounts/open-currency-account', payload);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  /**
   * Canlı kurdan Döviz/Altın Alım veya Satım işlemi gerçekleştirir
   * Endpoint: POST /api/Currency/exchange
   */
  exchange: async (payload) => {
    const response = await apiClient.post('/Currency/exchange', payload);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  }
};
