import React, { useState, useEffect } from 'react';
import './Modal.css';
import { authService as authApi } from '../../../MiniBank.Infrastructure';

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  accounts = [],
  onProfileUpdated,
  onShowToast
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profil verisi geldiğinde düzenlenebilir alanları doldur
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || (profile.fullName ? profile.fullName.split(' ')[0] : ''),
        lastName: profile.lastName || (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : ''),
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        currentPassword: '',
        newPassword: ''
      });
      setError(null);
    }
  }, [profile, isOpen]);

  if (!isOpen || !profile) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Zorunlu alan kontrolü
    if (!formData.currentPassword) {
      setError('Güvenlik gereği profilinizi güncellemek için mevcut şifrenizi girmelisiniz.');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('Yeni şifre belirlemek istiyorsanız en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword ? formData.newPassword : null
      };

      const updated = await authApi.updateProfile(payload);
      onShowToast('Profil bilgileriniz başarıyla güncellendi!', 'success');
      
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Güncelleme sırasında bir hata oluştu.');
      onShowToast(err.message || 'Güncelleme başarısız.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon modal-icon-blue">
              <i className="fa-solid fa-id-card-clip"></i>
            </div>
            <div>
              <h3 className="modal-title">Hesap & Profil Bilgilerim</h3>
              <p className="modal-subtitle">Kişisel bilgilerinizi ve güvenlik ayarlarınızı yönetin</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="modal-body" style={{ overflowY: 'auto', paddingRight: '1.25rem' }}>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {/* GRUP 1: SALT OKUNUR ALANLAR */}
          <div style={{
            background: 'rgba(10, 14, 23, 0.5)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '0.7rem' }}></i>
              <span>Resmi Banka Kayıtları (Değiştirilemez)</span>
            </div>

            <div className="form-group-half">
              <div className="form-group">
                <label className="form-label">T.C. Kimlik Numarası</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="form-input font-mono"
                  value={profile.identityNumber || ''}
                  style={{ background: 'rgba(0, 0, 0, 0.3)', opacity: 0.8 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Müşteri Numarası</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="form-input font-mono"
                  value={profile.customerNumber || ''}
                  style={{ background: 'rgba(0, 0, 0, 0.3)', opacity: 0.8, color: '#60a5fa' }}
                />
              </div>
            </div>
          </div>

          {/* GRUP 2: DÜZENLENEBİLİR ALANLAR */}
          <form id="profileForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
              İletişim & Kişisel Bilgiler
            </div>

            <div className="form-group-half">
              <div className="form-group">
                <label className="form-label">Adınız *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Soyadınız *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group-half">
              <div className="form-group">
                <label className="form-label">E-Posta Adresi *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefon Numarası *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  className="form-input"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* GRUP 3: GÜVENLİK DOĞRULAMASI & ŞİFRE */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-shield-halved"></i>
                <span>Güvenlik Doğrulaması</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#f87171' }}>
                  Mevcut Şifreniz * (Değişiklikleri Onaylamak İçin Zorunlu)
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="Mevcut giriş şifrenizi girin"
                  className="form-input"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Yeni Şifre <span style={{ opacity: 0.7, fontWeight: 400 }}>(İsteğe bağlı, değiştirmek istemiyorsanız boş bırakın)</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  minLength={6}
                  placeholder="Yeni şifre (en az 6 karakter)"
                  className="form-input"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* GRUP 4: HESAPLAR & IBAN LİSTESİ */}
            {accounts.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  Kayıtlı Banka Hesaplarım ({accounts.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {accounts.map((acc, idx) => (
                    <div
                      key={acc.id || idx}
                      style={{
                        background: 'rgba(10, 14, 23, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.825rem'
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#e5e7eb', fontWeight: 600 }}>{acc.iban}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
                        {(acc.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency || 'TRY'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="profileForm"
            className="btn-submit btn-submit-blue"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Güncelleniyor...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

