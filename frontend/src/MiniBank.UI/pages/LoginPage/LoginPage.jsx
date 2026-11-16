import React, { useState } from 'react';
import './LoginPage.css';
import { authService } from '../../../MiniBank.Infrastructure';

export default function LoginPage({ onLoginSuccess, onShowToast }) {
  // authMode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState('login');

  // loginRole: 'customer' | 'admin' (Aktif Giriş Türü)
  const [loginRole, setLoginRole] = useState('customer');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    identityNumberOrUsername: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    identityNumber: '',
    email: '',
    phoneNumber: '+90 ',
    password: ''
  });

  // Forgot password form state
  const [forgotForm, setForgotForm] = useState({
    identityNumber: '',
    emailOrPhone: '',
    newPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authService.login({
        identityNumberOrUsername: loginForm.identityNumberOrUsername.trim(),
        password: loginForm.password
      });

      onShowToast(data.message || `Giriş başarılı! Hoş geldiniz, ${data.fullName || data.role}.`, 'success');
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      onShowToast(err.message || 'Giriş başarısız.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register (Müşteri Ol)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (registerForm.password.length < 6) {
      setError('Şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register({
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        identityNumber: registerForm.identityNumber.trim(),
        email: registerForm.email.trim(),
        phoneNumber: registerForm.phoneNumber.trim(),
        password: registerForm.password
      });

      onShowToast(data.message || `Tebrikler! Müşteri kaydınız ve banka hesabınız otomatik oluşturuldu.`, 'success');
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Kayıt işlemi sırasında bir hata oluştu.');
      onShowToast(err.message || 'Kayıt başarısız.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password (Şifremi Unuttum - YALNIZCA MÜŞTERİLER)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Kural: Yönetici şifreleri bu ekrandan sıfırlanamaz!
    const ident = forgotForm.identityNumber.trim().toLowerCase();
    if (ident === 'admin') {
      setError('⛔ Yönetici (Admin) hesaplarının şifresi bu ekrandan sıfırlanamaz. Yöneticiler şifrelerini yalnızca admin paneline giriş yaptıktan sonra "Profilim & Yönetici Ayarları" menüsünden değiştirebilir.');
      return;
    }

    if (forgotForm.newPassword.length < 6) {
      setError('Yeni şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.forgotPassword({
        identityNumber: forgotForm.identityNumber.trim(),
        emailOrPhone: forgotForm.emailOrPhone.trim(),
        newPassword: forgotForm.newPassword
      });

      onShowToast(res.message || 'Müşteri şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.', 'success');
      
      // Giriş ekranına dön ve TC'yi otomatik doldur
      setLoginForm({
        identityNumberOrUsername: forgotForm.identityNumber.trim(),
        password: ''
      });
      setLoginRole('customer');
      setAuthMode('login');
    } catch (err) {
      setError(err.message || 'Şifre sıfırlanamadı. Bilgilerinizi kontrol edin.');
      onShowToast(err.message || 'Şifre sıfırlama başarısız.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className={`login-card ${authMode === 'register' ? 'login-card-wide' : ''}`} style={{ maxWidth: authMode === 'register' ? '500px' : '440px' }}>
        
        {/* Üst Geri Dön Butonu (Kayıt veya Şifre ekranındaysa en tepede) */}
        {authMode !== 'login' && (
          <div className="login-top-bar">
            <button
              type="button"
              className="btn-back-top"
              onClick={() => {
                setError(null);
                setAuthMode('login');
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Giriş Ekranına Dön</span>
            </button>
          </div>
        )}

        {/* Üst Logo ve Başlık */}
        <div className="login-brand">
          <div className="login-logo" style={{
            background: loginRole === 'admin' && authMode === 'login'
              ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
              : 'linear-gradient(135deg, #2563eb, #4f46e5)'
          }}>
            <i className={
              authMode === 'register' ? "fa-solid fa-user-plus" :
              authMode === 'forgot' ? "fa-solid fa-key" :
              loginRole === 'admin' ? "fa-solid fa-shield-halved" :
              "fa-solid fa-building-columns"
            }></i>
          </div>
          <h1 className="login-title">
            {authMode === 'register' && 'MiniBank Müşterisi Olun'}
            {authMode === 'forgot' && 'Müşteri Şifre Belirleme'}
            {authMode === 'login' && (loginRole === 'admin' ? 'MiniBank Yönetici Girişi' : 'MiniBank Bireysel Şube')}
          </h1>
          <p className="login-subtitle">
            {authMode === 'register' && 'Anında vadesiz hesap ve dijital IBAN açılışı'}
            {authMode === 'forgot' && 'Güvenlik doğrulaması ile yeni müşteri şifrenizi tanımlayın'}
            {authMode === 'login' && (loginRole === 'admin' ? 'Banka Yönetimi ve Operasyon Portalı' : 'İnternet Bankacılığı Güvenli Giriş')}
          </p>
        </div>

        {/* Hata Bildirimi */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: '#f87171',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {/* 1. GİRİŞ FORMU */}
        {authMode === 'login' && (
          <>
            {/* Rol Seçici Sekmeler (Bireysel Müşteri vs Yönetici Admin) */}
            <div className="login-role-tabs">
              <button
                type="button"
                className={`login-role-tab ${loginRole === 'customer' ? 'active-customer' : ''}`}
                onClick={() => {
                  setLoginRole('customer');
                  setError(null);
                  setLoginForm({ identityNumberOrUsername: '', password: '' });
                }}
              >
                <i className="fa-solid fa-user"></i>
                <span>Bireysel Müşteri</span>
              </button>
              <button
                type="button"
                className={`login-role-tab ${loginRole === 'admin' ? 'active-admin' : ''}`}
                onClick={() => {
                  setLoginRole('admin');
                  setError(null);
                  setLoginForm({ identityNumberOrUsername: '', password: '' });
                }}
              >
                <i className="fa-solid fa-shield-halved"></i>
                <span>Yönetici (Admin)</span>
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  {loginRole === 'admin' ? 'Yönetici Kullanıcı Adı veya TCKN' : 'T.C. Kimlik Numarası'}
                </label>
                <div className="login-input-wrapper">
                  <i className={`fa-solid ${loginRole === 'admin' ? 'fa-user-shield' : 'fa-id-card'} login-input-icon`}></i>
                  <input
                    type="text"
                    required
                    className="login-input"
                    maxLength={loginRole === 'customer' ? 11 : undefined}
                    placeholder={loginRole === 'admin' ? 'Örn: admin' : '11 haneli T.C. Kimlik No'}
                    value={loginForm.identityNumberOrUsername}
                    onChange={(e) => setLoginForm({ ...loginForm, identityNumberOrUsername: e.target.value })}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {loginRole === 'admin' ? 'Yönetici Şifresi' : 'Giriş Şifresi'}
                </label>
                <div className="login-input-wrapper">
                  <i className="fa-solid fa-lock login-input-icon"></i>
                  <input
                    type="password"
                    required
                    className="login-input"
                    placeholder="••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-login"
                disabled={loading}
                style={{
                  background: loginRole === 'admin'
                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                    : 'linear-gradient(135deg, #2563eb, #4f46e5)'
                }}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket"></i>
                    <span>{loginRole === 'admin' ? 'Yönetici Girişi Yap' : 'Bireysel Şubeye Giriş Yap'}</span>
                  </>
                )}
              </button>
            </form>

            {/* BİREYSEL MÜŞTERİ BAĞLANTILARI: Şifremi Unuttum & Kayıt Ol */}
            {loginRole === 'customer' && (
              <div className="auth-nav-links">
                <button
                  type="button"
                  className="auth-nav-btn"
                  onClick={() => {
                    setError(null);
                    setAuthMode('forgot');
                  }}
                >
                  <i className="fa-solid fa-unlock-keyhole"></i>
                  <span>Şifremi Unuttum / İlk Şifremi Belirle</span>
                </button>

                <button
                  type="button"
                  className="auth-nav-btn auth-nav-btn-highlight"
                  onClick={() => {
                    setError(null);
                    setAuthMode('register');
                  }}
                >
                  <i className="fa-solid fa-sparkles"></i>
                  <span>Hesabınız yok mu? <strong>Hemen Müşteri Olun</strong></span>
                </button>
              </div>
            )}

            {/* YÖNETİCİ GÜVENLİK BİLGİLENDİRMESİ: Şifremi Unuttum Çıkmaz! */}
            {loginRole === 'admin' && (
              <div className="admin-security-note">
                <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.15rem', color: '#a78bfa', marginTop: '0.15rem' }}></i>
                <div>
                  <strong style={{ color: '#ffffff' }}>Yönetici Güvenlik Protokolü:</strong>
                  <p style={{ margin: '0.2rem 0 0', opacity: 0.9 }}>
                    Yönetici hesapları için harici şifre sıfırlama kapalıdır. Şifre değişimi oturum açıldıktan sonra üst menüdeki <strong>"Profilim & Yönetici Ayarları"</strong> kısmından yapılır.
                  </p>
                </div>
              </div>
            )}

          </>
        )}

        {/* 2. KAYIT OL / MÜŞTERİ OL FORMU */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Adınız *</label>
                <input
                  type="text"
                  required
                  className="login-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="Örn: Can"
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Soyadınız *</label>
                <input
                  type="text"
                  required
                  className="login-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="Örn: Öztürk"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">T.C. Kimlik Numarası *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-id-card login-input-icon"></i>
                <input
                  type="text"
                  maxLength={11}
                  required
                  className="login-input"
                  placeholder="11 haneli TCKN"
                  value={registerForm.identityNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, identityNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-Posta Adresi *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-envelope login-input-icon"></i>
                <input
                  type="email"
                  required
                  className="login-input"
                  placeholder="can.ozturk@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Telefon Numarası *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-phone login-input-icon"></i>
                <input
                  type="tel"
                  required
                  className="login-input"
                  placeholder="+90 555 999 88 77"
                  value={registerForm.phoneNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Giriş Şifresi Belirleyin (En az 6 karakter) *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-lock login-input-icon"></i>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="login-input"
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-register-submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Hesabınız Açılıyor...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Müşteri Ol & Hesabı Aç</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-cancel-auth"
              disabled={loading}
              onClick={() => {
                setError(null);
                setAuthMode('login');
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Vazgeç ve Giriş Ekranına Dön</span>
            </button>
          </form>
        )}

        {/* 3. ŞİFREMİ UNUTTUM / YENİ ŞİFRE BELİRLE FORMU (SADECE MÜŞTERİLER) */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="login-form">
            <div style={{
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              color: '#fbbf24',
              fontSize: '0.8rem',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              lineHeight: '1.45'
            }}>
              <i className="fa-solid fa-circle-info" style={{ marginTop: '0.15rem', color: '#f59e0b', fontSize: '1rem' }}></i>
              <span>
                Bu ekran <strong>yalnızca Bireysel Müşteriler</strong> içindir. Yönetici (Admin) şifreleri buradan değiştirilemez; yöneticiler şifrelerini sisteme giriş yaptıktan sonra <strong>"Profilim & Yönetici Ayarları"</strong> bölümünden güncelleyebilir.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Müşteri T.C. Kimlik Numarası *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-id-card login-input-icon"></i>
                <input
                  type="text"
                  maxLength={11}
                  required
                  className="login-input"
                  placeholder="11 haneli TCKN"
                  value={forgotForm.identityNumber}
                  onChange={(e) => setForgotForm({ ...forgotForm, identityNumber: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kayıtlı E-Posta veya Telefon *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-shield-halved login-input-icon"></i>
                <input
                  type="text"
                  required
                  className="login-input"
                  placeholder="Sistemdeki e-posta veya telefonunuz"
                  value={forgotForm.emailOrPhone}
                  onChange={(e) => setForgotForm({ ...forgotForm, emailOrPhone: e.target.value })}
                />
              </div>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                Güvenlik doğrulaması için sistemdeki bilgilerinizle birebir eşleşmelidir.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Yeni Şifreniz (En az 6 karakter) *</label>
              <div className="login-input-wrapper">
                <i className="fa-solid fa-lock login-input-icon"></i>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="login-input"
                  placeholder="Yeni şifrenizi girin"
                  value={forgotForm.newPassword}
                  onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-forgot-submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Şifre Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-key"></i>
                  <span>Şifremi Belirle / Güncelle</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-cancel-auth"
              disabled={loading}
              onClick={() => {
                setError(null);
                setAuthMode('login');
              }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Vazgeç ve Giriş Ekranına Dön</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

