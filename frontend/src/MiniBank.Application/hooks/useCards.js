import { useState, useCallback } from 'react';
import { cardService } from '../../MiniBank.Infrastructure/services/cardService';

export const useCards = (showToast) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cardService.getMyCards();
      setCards(data || []);
      return data;
    } catch (err) {
      if (showToast) showToast(err.message || 'Kartlar yüklenemedi.', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const toggleStatus = useCallback(async (cardId) => {
    try {
      const res = await cardService.toggleStatus(cardId);
      if (showToast) showToast(res?.message || 'Kart durumu güncellendi.', 'success');
      await fetchCards();
      return true;
    } catch (err) {
      if (showToast) showToast(err.message || 'Kart durumu değiştirilemedi.', 'error');
      return false;
    }
  }, [fetchCards, showToast]);

  const updateSettings = useCallback(async (cardId, settings) => {
    try {
      const res = await cardService.updateSettings(cardId, settings);
      if (showToast) showToast(res?.message || 'Kart ayarları başarıyla kaydedildi.', 'success');
      await fetchCards();
      return true;
    } catch (err) {
      if (showToast) showToast(err.message || 'Kart ayarları güncellenemedi.', 'error');
      return false;
    }
  }, [fetchCards, showToast]);

  const requestCard = useCallback(async (accountId) => {
    try {
      const res = await cardService.requestCard(accountId);
      if (showToast) showToast(res?.message || 'Banka kartınız başarıyla oluşturuldu!', 'success');
      await fetchCards();
      return true;
    } catch (err) {
      if (showToast) showToast(err.message || 'Kart oluşturulamadı.', 'error');
      return false;
    }
  }, [fetchCards, showToast]);

  const syncMissingCards = useCallback(async () => {
    try {
      await cardService.syncMissingCards();
      await fetchCards();
    } catch (err) {
      console.warn('Kart eşitleme çağrısı:', err.message);
    }
  }, [fetchCards]);

  return {
    cards,
    loading,
    selectedCard,
    setSelectedCard,
    fetchCards,
    toggleStatus,
    updateSettings,
    requestCard,
    syncMissingCards
  };
};

