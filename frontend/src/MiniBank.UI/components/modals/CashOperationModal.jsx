import React, { useState, useEffect } from 'react';
import './Modal.css';

export default function CashOperationModal({
  isOpen,
  onClose,
  onSubmit,
  accounts = [],
  initialAccountId,
  initialType = 'deposit', // 'deposit' veya 'withdraw'
  loading
}) {
  const [operationType, setOperationType] = useState('deposit');
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      const type = initialType || 'deposit';
      setOperationType(type);
      setFormData({
        accountId: initialAccountId || (accounts.length > 0 ? accounts[0].id : ''),
        amount: '',
        description: type === 'deposit' ? 'ATM Nakit Para Yatırma / Maaş' : 'ATM Nakit Para Çekme'
      });
    }
  }, [isOpen, initialAccountId, initialType]);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setOperationType(newType);
    setFormData(prev => ({
      ...prev,
      description: newType === 'deposit' ? 'ATM Nakit Para Yatırma / Maaş' : 'ATM Nakit Para Çekme'
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setFormData({
      accountId: '',
      amount: '',
      description: ''
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      type: operationType,
      data: {
        accountId: formData.accountId,
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || (operationType === 'deposit' ? 'ATM Nakit Para Yatırma' : 'Nakit Çekim')
      }
    });
    setFormData(prev => ({
      ...prev,
      amount: ''
    }));
  };

  const selectedAccount = accounts.find(a => a.id === formData.accountId);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className={`modal-icon ${operationType === 'deposit' ? 'modal-icon-green' : 'modal-icon-amber'}`}>
              <i className={operationType === 'deposit' ? "fa-solid fa-money-bill-wave" : "fa-solid fa-hand-holding-dollar"}></i>
            </div>
            <div>
              <h3 className="modal-title">
                {operationType === 'deposit' ? '💵 Bakiye Yükle (ATM Yatırma)' : '💸 Nakit Para Çekme'}
              </h3>
              <p className="modal-subtitle">
                {operationType === 'deposit' ? 'Hesaba dışarıdan nakit bakiye ekleme' : 'Hesaptan nakit bakiye çıkışı'}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={handleClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Seçimi (Yatır / Çek) */}
        <div style={{
          display: 'flex',
          padding: '0.75rem 1.5rem 0',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(17, 24, 39, 0.25)'
        }}>
          <button
            type="button"
            onClick={() => handleTypeChange('deposit')}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              background: operationType === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: operationType === 'deposit' ? '#34d399' : 'var(--text-muted)',
              borderBottom: operationType === 'deposit' ? '2px solid #34d399' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-plus-circle"></i>
            <span>Para Yatır (Deposit)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('withdraw')}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              background: operationType === 'withdraw' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: operationType === 'withdraw' ? '#fbbf24' : 'var(--text-muted)',
              borderBottom: operationType === 'withdraw' ? '2px solid #fbbf24' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-minus-circle"></i>
            <span>Para Çek (Withdraw)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">İşlem Yapılacak Hesap *</label>
              <select
                name="accountId"
                className="form-input"
                value={formData.accountId}
                onChange={handleChange}
                required
              >
                <option value="">Hesap Seçin...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.customerFullName || 'Hesap'} ({acc.iban}) - Bakiye: {(acc.balance || 0).toLocaleString('tr-TR')} {acc.currency || 'TRY'}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <span className="form-hint">
                  Mevcut Bakiye: <strong style={{ color: '#34d399' }}>{(selectedAccount.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedAccount.currency || 'TRY'}</strong>
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tutar (TL) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                name="amount"
                required
                placeholder="0.00"
                className="form-input font-mono"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Açıklama</label>
              <input
                type="text"
                name="description"
                placeholder={operationType === 'deposit' ? 'Örn: ATM Nakit Para Yatırma / Maaş' : 'Örn: Nakit Çekim'}
                className="form-input"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Vazgeç
            </button>
            <button
              type="submit"
              className={`btn-submit ${operationType === 'deposit' ? 'btn-submit-green' : 'btn-submit-amber'}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>İşlem Yapılıyor...</span>
                </>
              ) : (
                <>
                  <i className={operationType === 'deposit' ? "fa-solid fa-arrow-down" : "fa-solid fa-arrow-up"}></i>
                  <span>{operationType === 'deposit' ? 'Bakiyeyi Yükle' : 'Parayı Çek'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

