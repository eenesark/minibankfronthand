import axios from 'axios';
import { STORAGE_KEYS } from '../../MiniBank.Core';

// Vite Proxy üzerinden (http://localhost:5257) veya ortam değişkeninden API Base URL
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/**
 * Axios Tabanlı Merkezi HTTP İstemcisi
 * - Her isteğe otomatik Bearer token ekler
 * - Ortak ApiResponse ({ success, message, data, errors, statusCode }) yapısını doğrular
 * - 401 durumunda token temizleyip oturum kapatma olayını tetikler
 * - Kullanıcı bildirimleri için doğrudan backend'in response.data.message mesajını error nesnesine bağlar
 */
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// REQUEST INTERCEPTOR: Otomatik Token Ekleme
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: ApiResponse Zarf Kontrolü ve Merkezi Hata Yönetimi
apiClient.interceptors.response.use(
  (response) => {
    // Backend'den dönen standart ApiResponse yapısı: { success, message, data, errors, statusCode }
    const apiRes = response.data;

    // Eğer sunucu ApiResponse formatında dönmüşse ve success: false ise hata fırlat
    if (apiRes && typeof apiRes === 'object' && 'success' in apiRes) {
      if (!apiRes.success) {
        const error = new Error(apiRes.message || 'İşlem başarısız.');
        error.response = response;
        error.apiResponse = apiRes;
        return Promise.reject(error);
      }
    }

    return response;
  },
  (error) => {
    // 401 Unauthorized: Oturum sonlandırma
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // Backend ApiResponse içerisindeki message alanını doğrudan al ve error.message yap
    const backendMessage =
      error.response?.data?.message ||
      (Array.isArray(error.response?.data?.errors) && error.response.data.errors[0]) ||
      error.message ||
      'Sunucu ile iletişim kurulurken bir hata oluştu.';

    error.message = backendMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
