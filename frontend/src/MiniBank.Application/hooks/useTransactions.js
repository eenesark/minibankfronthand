import { useState, useCallback } from 'react';
import { transactionService } from '../../MiniBank.Infrastructure';

/**
 * Hesap Hareketleri Hook'u
 */
export function useTransactions() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (accountId) => {
    if (!accountId) {
      setHistory([]);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getHistory(accountId);
      setHistory(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err.message || 'Hesap hareketleri getirilemedi.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    setHistory,
    loading,
    error,
    fetchHistory
  };
}

