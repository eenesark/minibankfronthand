import React, { useState, useEffect } from 'react';
import './Modal.css';

export const CardSettingsModal = ({ isOpen, onClose, card, onSaveSettings, onToggleStatus, loading }) => {
  const [formData, setFormData] = useState({
    isOnlineShoppingAllowed: true,
    isContactlessAllowed: true,
    isInternationalAllowed: false,
    dailyLimit: 25000,
    dailyAtmWithdrawLimit: 7500
  });

  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (card) {
      setFormData({
        isOnlineShoppingAllowed: card.isOnlineShoppingAllowed ?? true,
        isContactlessAllowed: card.isContactlessAllowed ?? true,
        isInternationalAllowed: card.isInternationalAllowed ?? false,
        dailyLimit: card.dailyLimit ?? 25000,
        dailyAtmWithdrawLimit: card.dailyAtmWithdrawLimit ?? 7500
      });
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const isActive = card.status === 'Active' || card.status === 1 || card.isActive !== false;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(card.id, {
      isOnlineShoppingAllowed: formData.isOnlineShoppingAllowed,
      isContactlessAllowed: formData.isContactlessAllowed,
      isInternationalAllowed: formData.isInternationalAllowed,
      dailyLimit: Number(formData.dailyLimit),
      dailyAtmWithdrawLimit: Number(formData.dailyAtmWithdrawLimit)
    });
  };

  const formatCardNum = (num) => {
    if (!num) return '•••• •••• •••• ••••';
    return num.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const expiry = card.expiryMonth && card.expiryYear 
    ? `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
    : (card.expiryDate || '12/28');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: '1.2rem' }}>
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Banka Kartı Yönetimi</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {card.accountIban || 'Banka Hesabına Bağlı Kart'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem' }}>
          {/* FİZİKSEL DİJİTAL KART GÖRÜNÜMÜ */}
          <div style={{
            background: isActive 
              ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)' 
              : 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, letterSpacing: '1px', fontSize: '1rem' }}>
                <i className="fa-solid fa-building-columns"></i>
                <span>MINIBANK</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>DEBIT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.3)',
                  color: isActive ? '#34d399' : '#fca5a5',
                  fontWeight: 600,
                  border: `1px solid ${isActive ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                }}>
                  {isActive ? '● Aktif' : '● Geçici Kapalı'}
                </span>
                <i className="fa-solid fa-wifi" style={{ transform: 'rotate(90deg)', fontSize: '1.1rem', opacity: 0.9 }}></i>
              </div>
            </div>

            {/* Kart Çipi */}
            <div style={{
              width: '45px',
              height: '34px',
              background: 'linear-gradient(135deg, #fcd34d 0%, #b45309 100%)',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              border: '1px solid #fef08a'
            }}></div>

            {/* Kart Numarası */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.35rem', letterSpacing: '2.5px', fontFamily: 'monospace', fontWeight: 600 }}>
                {formatCardNum(card.cardNumber)}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(card.cardNumber, 'cardNum')}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
                title="Kart Numarasını Kopyala"
              >
                <i className={copiedField === 'cardNum' ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
              </button>
            </div>

            {/* Alt Bilgiler: Kart Sahibi, Son Kullanma, CVV */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.75, letterSpacing: '0.5px' }}>Kart Sahibi</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                  {card.cardHolderName || 'MÜŞTERİ ADI'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.75, letterSpacing: '0.5px' }}>SKT</div>
                  <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }}>{expiry}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.75, letterSpacing: '0.5px' }}>CVV</div>
                  <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }}>{card.cvv || '•••'}</div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-1px' }}>
                  VISA
                </div>
              </div>
            </div>
          </div>

          {/* KART DURUMU HIZLI BUTONU */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive ? '#f87171' : '#34d399' }}>
                {isActive ? 'Kartı Geçici Olarak Dondur' : 'Kartı Yeniden Kullanıma Aç'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {isActive 
                  ? 'Kartınız kaybolduysa veya geçici olarak kullanıma kapatmak istiyorsanız dondurabilirsiniz.' 
                  : 'Kartınız şu anda kapalıdır. İşlem yapmak için hemen aktif edebilirsiniz.'}
              </div>
            </div>
            <button
              type="button"
              className="btn"
              disabled={loading}
              onClick={() => onToggleStatus(card.id)}
              style={{
                background: isActive ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem'
              }}
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : isActive ? (
                <><i className="fa-solid fa-lock" style={{ marginRight: '0.35rem' }}></i> Dondur</>
              ) : (
                <><i className="fa-solid fa-lock-open" style={{ marginRight: '0.35rem' }}></i> Aktif Et</>
              )}
            </button>
          </div>

          {/* GÜVENLİK VE LİMİT AYARLARI FORMU */}
          <form onSubmit={handleSubmit}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-sliders" style={{ color: '#3b82f6' }}></i>
              Kart Yetki ve Güvenlik Ayarları
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* İnternet Alışverişi */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                    <i className="fa-solid fa-globe"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>İnternetten Alışveriş (E-Ticaret)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online sitelerde 3D Secure ve kartlı harcamalar</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  checked={formData.isOnlineShoppingAllowed}
                  onChange={e => setFormData({ ...formData, isOnlineShoppingAllowed: e.target.checked })}
                />
              </label>

              {/* Temassız Ödeme */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <i className="fa-solid fa-wifi" style={{ transform: 'rotate(90deg)' }}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Temassız Ödeme Özelliği</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POS cihazlarında şifresiz hızlı dokundur-öde</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  checked={formData.isContactlessAllowed}
                  onChange={e => setFormData({ ...formData, isContactlessAllowed: e.target.checked })}
                />
              </label>

              {/* Yurtdışı Kullanımı */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                    <i className="fa-solid fa-plane-departure"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Yurtdışı İşlemleri</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yabancı e-ticaret siteleri ve yurtdışı POS harcamaları</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
                  checked={formData.isInternationalAllowed}
                  onChange={e => setFormData({ ...formData, isInternationalAllowed: e.target.checked })}
                />
              </label>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-gauge-high" style={{ color: '#8b5cf6' }}></i>
              Günlük Limit Tanımlamaları
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Günlük Harcama Limiti (TL)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="500"
                  value={formData.dailyLimit}
                  onChange={e => setFormData({ ...formData, dailyLimit: e.target.value })}
                  required
                />
                <span className="form-hint" style={{ fontSize: '0.72rem' }}>POS ve Sanal POS toplam limiti</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Günlük ATM Para Çekme Limiti (TL)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="500"
                  value={formData.dailyAtmWithdrawLimit}
                  onChange={e => setFormData({ ...formData, dailyAtmWithdrawLimit: e.target.value })}
                  required
                />
                <span className="form-hint" style={{ fontSize: '0.72rem' }}>ATM'den çekilebilecek maksimum nakit</span>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Vazgeç
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                <span>Ayarları Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

