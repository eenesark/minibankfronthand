import { apiClient } from '../api/client';

export const dashboardService = {
  /**
   * Giriş yapan müşterinin sadeleştirilmiş ana ekran verisini döner.
   * GET /api/Dashboard/home veya GET /api/Dashboard
   * (Ana TL hesabı, finansal özet, son hareketler ve sol menü ağacı)
   */
  getHome: async () => {
    try {
      const response = await apiClient.get('/Dashboard/home').catch(() => apiClient.get('/Dashboard'));
      return response.data?.success ? response.data.data : null;
    } catch (err) {
      console.warn('Dashboard home verisi alınamadı:', err.message);
      return null;
    }
  },

  /**
   * Sol üstteki üç çizgi (☰ hamburger) menüsünün kategori ve alt sayfalarını döner.
   * GET /api/Dashboard/menu
   */
  getNavigationMenu: async () => {
    try {
      const response = await apiClient.get('/Dashboard/menu');
      return response.data?.success ? (response.data.data || []) : [];
    } catch (err) {
      console.warn('Dashboard menüsü alınamadı:', err.message);
      return [];
    }
  },

  /**
   * Kategoriye göre hesapları listeler
   * GET /api/Accounts/my-accounts?category={demand|currency|term-deposit}
   */
  getMyAccountsByCategory: async (category = '') => {
    try {
      const url = category ? `/Accounts/my-accounts?category=${encodeURIComponent(category)}` : '/Accounts/my-accounts';
      const response = await apiClient.get(url);
      return response.data?.success ? (response.data.data || []) : [];
    } catch (err) {
      console.warn('Kategori hesapları alınamadı:', err.message);
      return [];
    }
  },

  /**
   * Birincil ana Vadesiz TL hesabını getirir
   * GET /api/Accounts/primary
   */
  getPrimaryAccount: async () => {
    try {
      const response = await apiClient.get('/Accounts/primary');
      return response.data?.success ? response.data.data : null;
    } catch (err) {
      console.warn('Birincil hesap alınamadı:', err.message);
      return null;
    }
  }
};

