import { apiClient } from '../api/client';

export const assistantService = {
  /**
   * Akıllı Bankacılık Asistanına (Ugi) soru veya komut gönderir
   * Endpoint: POST /api/Assistant/chat
   * @param {string} message - Kullanıcının doğal dil mesajı
   * @param {string} [currentPage] - Kullanıcının o an bulunduğu sayfa
   * @returns {Promise<{ reply: string, action: string, route?: string, parameters?: object, quickSuggestions: string[], message?: string }>}
   */
  chat: async (message, currentPage = '') => {
    const response = await apiClient.post('/Assistant/chat', {
      message: message.trim(),
      currentPage
    });

    if (response.data.success) {
      const data = response.data.data;
      return {
        ...data,
        message: response.data.message
      };
    }

    throw new Error(response.data.message || 'Asistan yanıt veremedi.');
  }
};

