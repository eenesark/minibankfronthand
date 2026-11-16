import { useState, useCallback } from 'react';
import { customerService } from '../../MiniBank.Infrastructure';

/**
 * Müşteri Yönetimi Hook'u (Admin İşlemleri)
 */
export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getAll();
      setCustomers(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err.message || 'Müşteri listesi alınamadı.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (customerData) => {
    const res = await customerService.create(customerData);
    await fetchCustomers();
    return res;
  }, [fetchCustomers]);

  const updateCustomer = useCallback(async (id, customerData) => {
    const res = await customerService.update(id, customerData);
    await fetchCustomers();
    return res;
  }, [fetchCustomers]);

  return {
    customers,
    setCustomers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer
  };
}

