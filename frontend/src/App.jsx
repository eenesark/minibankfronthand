import React, { useState, useEffect } from 'react';
import './App.css';
import { LoginPage, AdminDashboard, CustomerPortal, Toast } from './MiniBank.UI';
import { authService } from './MiniBank.Infrastructure';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [toast, setToast] = useState(null);

  // Toast Helper (Global Bildirim Yöneticisi)
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Router State: 'login' | 'admin' | 'portal'
  const determineInitialRoute = () => {
    const hash = window.location.hash;
    const user = authService.getCurrentUser();
    const token = localStorage.getItem('token');

    // Sadece kullanıcı açıkça dashboard URL'sine gitmişse ve geçerli oturumu varsa panele git
    if (token && user) {
      if (hash.includes('/admin/dashboard') && user.role === 'Admin') {
        return 'admin';
      }
      if (hash.includes('/portal/dashboard') && user.role === 'Customer') {
        return 'portal';
      }
    }

    // Linke ilk tıklandığında (kök adres http://localhost:3000/), /login'de veya diğer durumlarda daima Giriş Sayfası açılır:
    return 'login';
  };

  const [currentRoute, setCurrentRoute] = useState(determineInitialRoute);

  // 401 Unauthorized dinleyicisi (Merkezi API Client'tan tetiklenir)
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setCurrentRoute('login');
      window.location.hash = '/login';
      showToast('Oturum süreniz doldu, lütfen tekrar giriş yapın.', 'error');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // 🛡️ ROUTE GUARD (SAYFA VE YETKİ KORUMA)
  useEffect(() => {
    const applyRouteGuard = () => {
      const hash = window.location.hash;
      const user = authService.getCurrentUser();
      const token = localStorage.getItem('token');

      // 1. Kök link veya Giriş ekranı istenmişse DAİMA Giriş Ekranını aç
      if (hash === '' || hash === '#' || hash === '#/' || hash.includes('/login')) {
        setCurrentRoute('login');
        if (window.location.hash !== '#/login') {
          window.location.hash = '/login';
        }
        return;
      }

      // 2. Korumalı sayfalara (admin veya portal) token olmadan girilmeye çalışılıyorsa -> Giriş'e yönlendir
      if (!token || !user) {
        setCurrentRoute('login');
        window.location.hash = '/login';
        showToast('Bu sayfayı görüntülemek için lütfen giriş yapın.', 'error');
        return;
      }

      // 3. Admin sayfasına erişim kontrolü
      if (hash.includes('/admin')) {
        if (user.role === 'Admin') {
          setCurrentRoute('admin');
        } else {
          // Müşteri admin paneline girmeye çalışırsa yetkisiz erişim uyarısı
          setCurrentRoute('portal');
          window.location.hash = '/portal/dashboard';
          showToast('⛔ Yetkisiz Erişim: Yönetici (Admin) paneline erişim izniniz yok.', 'error');
        }
        return;
      }

      // 4. Portal sayfasına erişim kontrolü
      if (hash.includes('/portal')) {
        if (user.role === 'Customer') {
          setCurrentRoute('portal');
        } else {
          // Admin müşteri portalına girmeye çalışırsa yönetici paneline yönlendir
          setCurrentRoute('admin');
          window.location.hash = '/admin/dashboard';
          showToast('Yönetici paneline yönlendirildiniz.', 'info');
        }
        return;
      }

      // Bilinmeyen hash'lerde varsayılan olarak giriş sayfasına dön
      setCurrentRoute('login');
      window.location.hash = '/login';
    };

    window.addEventListener('hashchange', applyRouteGuard);
    applyRouteGuard();

    return () => window.removeEventListener('hashchange', applyRouteGuard);
  }, [currentUser]);

  // Update hash when currentRoute changes
  useEffect(() => {
    if (currentRoute === 'admin') {
      window.location.hash = '/admin/dashboard';
    } else if (currentRoute === 'portal') {
      window.location.hash = '/portal/dashboard';
    } else {
      window.location.hash = '/login';
    }
  }, [currentRoute]);

  // Login Success Handler
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    if (userData.role === 'Admin') {
      setCurrentRoute('admin');
      window.location.hash = '/admin/dashboard';
      showToast(`Yönetim paneline hoş geldiniz, ${userData.fullName || 'Yönetici'}.`, 'success');
    } else {
      setCurrentRoute('portal');
      window.location.hash = '/portal/dashboard';
      showToast(`İnternet şubesine hoş geldiniz, ${userData.fullName || 'Müşteri'}.`, 'success');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentRoute('login');
    showToast('Güvenli çıkış yapıldı.', 'info');
  };

  return (
    <>
      {currentRoute === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onShowToast={showToast}
        />
      )}

      {currentRoute === 'admin' && (
        <AdminDashboard
          onLogout={handleLogout}
          onShowToast={showToast}
        />
      )}

      {currentRoute === 'portal' && (
        <CustomerPortal
          onLogout={handleLogout}
          onShowToast={showToast}
        />
      )}

      {/* Global Toast Bildirimleri (Yeşil Başarı / Kırmızı Hata) */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
