import { apiClient } from '../api/client';

export const accountService = {
  getAll: async () => {
    const response = await apiClient.get('/Accounts');
    return response.data.success ? response.data.data : [];
  },

  create: async (accountData) => {
    const response = await apiClient.post('/Accounts', accountData);
    if (response.data.success) {
      const data = response.data.data;
      return data ? { ...data, message: response.data.message } : { message: response.data.message };
    }
    return null;
  },

  /**
   * Vadeli Mevduat Hesabı Açar (POST /api/TimeDeposit/open veya /api/Accounts/open-term-deposit)
   */
  openTermDeposit: async (payload) => {
    try {
      const response = await apiClient.post('/TimeDeposit/open', {
        demandAccountId: payload.fromAccountId || payload.demandAccountId,
        amount: payload.amount,
        days: payload.termDays || payload.days
      });
      if (response.data.success) {
        return { ...response.data.data, message: response.data.message };
      }
    } catch (err) {
      // Eğer yetki hatası ise (örn: özellik kapalıysa) doğrudan fırlat
      if (err.message && (err.message.includes('yetki') || err.message.includes('yetkilendirilmemiştir'))) {
        throw err;
      }
      // Alternatif legacy endpoint dene
      const fallbackRes = await apiClient.post('/Accounts/open-term-deposit', payload).catch(() =>
        apiClient.post('/Accounts', {
          customerId: payload.customerId,
          currency: 'TRY',
          initialDeposit: payload.amount,
          accountType: 'TimeDeposit',
          termDays: payload.termDays,
          interestRate: payload.interestRate
        })
      );
      if (fallbackRes?.data?.success) {
        return { ...fallbackRes.data.data, message: fallbackRes.data.message };
      }
    }
    return null;
  },

  /**
   * Giriş yapan müşterinin tüm vadeli mevduat hesaplarını listeler
   * Endpoint: GET /api/TimeDeposit/my-accounts
   */
  getMyTimeDeposits: async () => {
    try {
      const response = await apiClient.get('/TimeDeposit/my-accounts');
      return response.data.success ? response.data.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Vadeli Mevduatı Kapatır
   */
  closeTermDeposit: async (payload) => {
    const termId = typeof payload === 'string' ? payload : payload.id || payload.accountId;
    const response = await apiClient.post(`/TimeDeposit/${termId}/close`).catch(() =>
      apiClient.post('/Accounts/close-term-deposit', payload)
    );
    return response.data.success ? { ...response.data.data, message: response.data.message } : null;
  },

  // Hesabı Dondur (Pasife Al) veya Aktif Et
  toggleStatus: async (accountId, currentStatus) => {
    const newStatus = !currentStatus;
    const response = await apiClient.put(`/Accounts/${accountId}`, { isActive: newStatus }).catch(() =>
      apiClient.put(`/Accounts/${accountId}/status`, { isActive: newStatus })
    );
    return response.data.success ? { ...response.data.data, message: response.data.message } : null;
  }
};
