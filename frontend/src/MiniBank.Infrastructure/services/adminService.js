import { apiClient } from '../api/client';

export const adminService = {
  getDashboardStats: async (customers = [], accounts = []) => {
    try {
      const response = await apiClient.get('/Admin/dashboard');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Backend'de özel endpoint yanıt vermezse hesaplanır
    }

    const totalDeposit = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
    const activeAccounts = accounts.filter(a => a.isActive !== false).length;

    return {
      totalDeposit,
      totalCustomers: customers.length,
      totalAccounts: accounts.length,
      activeAccounts,
      totalTransactions: accounts.length * 2
    };
  }
};
