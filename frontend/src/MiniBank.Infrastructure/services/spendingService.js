import { apiClient } from '../api/client';

export const spendingService = {
  /**
   * Belirtilen ay ve yıl için harcama özeti, kategori dağılımı, grafikler ve bütçe durumunu döner.
   * GET /api/Spending/summary?month={month}&year={year}
   */
  getSummary: async (month, year) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await apiClient.get('/Spending/summary', { params });
      return response.data?.success ? response.data.data : null;
    } catch (err) {
      console.warn('Harcama özeti alınamadı:', err.message);
      return null;
    }
  },

  /**
   * Seçilen kategoriye ait harcama detay hareketlerini listeler.
   * GET /api/Spending/category/{category}?month={month}&year={year}
   */
  getCategoryTransactions: async (category, month, year) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await apiClient.get(`/Spending/category/${encodeURIComponent(category)}`, { params });
      return response.data?.success ? (response.data.data || []) : [];
    } catch (err) {
      console.warn('Kategori harcamaları alınamadı:', err.message);
      return [];
    }
  },

  /**
   * Kategoriye aylık harcama bütçesi tanımlar / günceller.
   * POST /api/Spending/budgets
   */
  setBudget: async (category, budgetLimit) => {
    const response = await apiClient.post('/Spending/budgets', {
      category,
      budgetLimit: parseFloat(budgetLimit)
    });
    if (response.data?.success) {
      return { ...response.data.data, message: response.data.message };
    }
    throw new Error(response.data?.message || 'Bütçe tanımlanamadı.');
  }
};

