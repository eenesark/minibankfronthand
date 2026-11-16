import { useState, useCallback } from 'react';
import { featureService } from '../../MiniBank.Infrastructure';

/**
 * Dinamik Özellik Yönetimi (Feature Management) Hook'u
 */
export function useFeatures() {
  const [features, setFeatures] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCatalog = useCallback(async () => {
    try {
      const data = await featureService.getCatalog();
      setCatalog(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.warn('Özellik kataloğu yüklenemedi:', err.message);
      return [];
    }
  }, []);

  const fetchCustomerFeatures = useCallback(async (customerId) => {
    if (!customerId) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await featureService.getCustomerFeatures(customerId);
      const list = Array.isArray(data) ? data : [];
      setFeatures(list);
      return list;
    } catch (err) {
      setError(err.message || 'Müşteri özellikleri yüklenemedi.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setFeature = useCallback(async (customerId, payload) => {
    setError(null);
    try {
      const updated = await featureService.setCustomerFeature(customerId, payload);
      setFeatures(prev =>
        prev.map(f => (f.featureKey === payload.featureKey ? { ...f, ...updated } : f))
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Özellik güncellenemedi.');
      throw err;
    }
  }, []);

  const bulkUpdateFeatures = useCallback(async (customerId, payloadList) => {
    setLoading(true);
    setError(null);
    try {
      const updatedList = await featureService.bulkUpdateCustomerFeatures(customerId, payloadList);
      const list = Array.isArray(updatedList) ? updatedList : [];
      setFeatures(list);
      return list;
    } catch (err) {
      setError(err.message || 'Toplu özellik güncellemesi başarısız.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    features,
    setFeatures,
    catalog,
    loading,
    error,
    fetchCatalog,
    fetchCustomerFeatures,
    setFeature,
    bulkUpdateFeatures
  };
}

