import { apiClient } from '../api/client';

export const cardService = {
  /**
   * Giriş yapan müşterinin tüm kartlarını listeler
   * GET /api/cards veya GET /api/cards/my-cards
   */
  getMyCards: async () => {
    try {
      const response = await apiClient.get('/cards/my-cards').catch(() => apiClient.get('/cards'));
      return response.data?.success ? (response.data.data || []) : [];
    } catch (err) {
      console.warn('Kartlar yüklenemedi:', err.message);
      return [];
    }
  },

  /**
   * Kart Detayı
   * GET /api/cards/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/cards/${id}`);
    return response.data?.success ? response.data.data : null;
  },

  /**
   * Belirli bir hesaba ait kartı getirir
   * GET /api/cards/account/{accountId}
   */
  getByAccountId: async (accountId) => {
    const response = await apiClient.get(`/cards/account/${accountId}`);
    return response.data?.success ? response.data.data : null;
  },

  /**
   * Yeni Kart Talebi
   * POST /api/cards
   */
  requestCard: async (accountId) => {
    const response = await apiClient.post('/cards', { accountId });
    if (response.data?.success) {
      return { ...response.data.data, message: response.data.message };
    }
    throw new Error(response.data?.message || 'Kart oluşturulamadı.');
  },

  /**
   * Kart Ayarlarını Güncelle (Limitler, İnternet Alışverişi, Temassız, Yurtdışı)
   * PUT /api/cards/{id}/settings
   */
  updateSettings: async (id, settings) => {
    const response = await apiClient.put(`/cards/${id}/settings`, settings);
    if (response.data?.success) {
      return { ...response.data.data, message: response.data.message };
    }
    throw new Error(response.data?.message || 'Kart ayarları güncellenemedi.');
  },

  /**
   * Kartı Dondur / Aktif Et
   * PUT /api/cards/{id}/toggle-status
   */
  toggleStatus: async (id) => {
    const response = await apiClient.put(`/cards/${id}/toggle-status`);
    if (response.data?.success) {
      return { ...response.data.data, message: response.data.message };
    }
    throw new Error(response.data?.message || 'Kart durumu değiştirilemedi.');
  },

  /**
   * Kartı olmayan hesaplara otomatik kart ata / eşitle
   * POST /api/cards/sync-missing-cards
   */
  syncMissingCards: async () => {
    const response = await apiClient.post('/cards/sync-missing-cards');
    return response.data?.success ? response.data.data : null;
  }
};

