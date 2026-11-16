import { useState, useCallback } from 'react';
import { accountService, transactionService } from '../../MiniBank.Infrastructure';

/**
 * Hesap Yönetimi ve Finansal İşlemler Hook'u
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAll();
      setAccounts(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err.message || 'Hesaplar yüklenemedi.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (accountData) => {
    const newAcc = await accountService.create(accountData);
    await fetchAccounts();
    return newAcc;
  }, [fetchAccounts]);

  const deposit = useCallback(async ({ accountId, amount, description }) => {
    const res = await transactionService.deposit({ accountId, amount, description });
    await fetchAccounts();
    return res;
  }, [fetchAccounts]);

  const withdraw = useCallback(async ({ accountId, amount, description }) => {
    const res = await transactionService.withdraw({ accountId, amount, description });
    await fetchAccounts();
    return res;
  }, [fetchAccounts]);

  const transfer = useCallback(async ({ fromAccountId, targetIban, amount, description }) => {
    const res = await transactionService.transfer({ fromAccountId, targetIban, amount, description });
    await fetchAccounts();
    return res;
  }, [fetchAccounts]);

  const toggleAccountStatus = useCallback(async (accountId, currentStatus) => {
    const res = await accountService.toggleStatus(accountId, currentStatus);
    await fetchAccounts();
    return res;
  }, [fetchAccounts]);

  return {
    accounts,
    setAccounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    deposit,
    withdraw,
    transfer,
    toggleAccountStatus
  };
}

