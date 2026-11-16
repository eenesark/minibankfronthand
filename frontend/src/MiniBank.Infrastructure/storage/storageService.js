import { STORAGE_KEYS } from '../../MiniBank.Core';

/**
 * Tarayıcı Yerel Depolama (LocalStorage) Yöneticisi
 */
export const storageService = {
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },

  removeToken: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  getUser: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  removeUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getTermDeposits: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TERM_DEPOSITS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  setTermDeposits: (deposits) => {
    localStorage.setItem(STORAGE_KEYS.TERM_DEPOSITS, JSON.stringify(deposits || []));
  }
};

