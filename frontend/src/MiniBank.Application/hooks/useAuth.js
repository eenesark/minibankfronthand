import { useState, useEffect, useCallback } from 'react';
import { authService, storageService } from '../../MiniBank.Infrastructure';

/**
 * Kimlik Doğrulama ve Oturum Yönetimi Hook'u
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 401 Unauthorized dinleyicisi
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      storageService.clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.login(credentials);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (registerData) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.register(registerData);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Kayıt yapılamadı.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await authService.updateProfile(payload);
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      return updated;
    } catch (err) {
      setError(err.message || 'Profil güncellenemedi.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    currentUser,
    setCurrentUser,
    isAuthenticated: Boolean(currentUser && storageService.getToken()),
    isAdmin: currentUser?.role === 'Admin',
    isCustomer: currentUser?.role === 'Customer',
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };
}

