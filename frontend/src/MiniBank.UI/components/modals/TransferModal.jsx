import React, { useState, useEffect } from 'react';
import './Modal.css';
import { formatCurrency, getCurrencyLabel } from '../../../MiniBank.Infrastructure';

export default function TransferModal({
  isOpen,
  onClose,
  onSubmit,
  accounts = [],
  initialFromAccountId,
  loading
}) {
  const [formData, setFormData] = useState({
    fromAccountId: '',
    targetIban: '',
    amount: '',
    description: 'Havale / EFT Transferi'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fromAccountId: initialFromAccountId || (accounts.length > 0 ? accounts[0].id : ''),
        targetIban: '',
        amount: '',
        description: 'Havale / EFT Transferi'
      });
    }
  }, [isOpen, initialFromAccountId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setFormData({
      fromAccountId: '',
      targetIban: '',
      amount: '',
      description: 'Havale / EFT Transferi'
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fromAccountId: formData.fromAccountId,
      targetIban: formData.targetIban.trim(),
      amount: parseFloat(formData.amount),
      description: formData.description
    });
    setFormData(prev => ({
      ...prev,
      targetIban: '',
      amount: ''
    }));
  };

  const selectedFromAccount = accounts.find(a => a.id === formData.fromAccountId);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon modal-icon-green">
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
            <div>
              <h3 className="modal-title">Güvenli Para Transferi</h3>
              <p className="modal-subtitle">Hesaplar arası anında EFT / Havale</p>
            </div>
          </div>
          <button className="btn-close" onClick={handleClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Gönderen Hesap *</label>
              <select
                name="fromAccountId"
                className="form-input"
                value={formData.fromAccountId}
                onChange={handleChange}
                required
              >
                <option value="">Hesap Seçin...</option>
                {accounts.map(acc => {
                  const currLabel = getCurrencyLabel(acc.currency);
                  return (
                    <option key={acc.id} value={acc.id}>
                      [{currLabel}] {acc.customerFullName || 'Hesap'} ({acc.iban}) - Bakiye: {formatCurrency(acc.balance || 0, acc.currency)}
                    </option>
                  );
                })}
              </select>
              {selectedFromAccount && (
                <span className="form-hint">
                  Kullanılabilir Bakiye: <strong style={{ color: '#34d399' }}>{formatCurrency(selectedFromAccount.balance || 0, selectedFromAccount.currency)}</strong>
                  <span style={{ marginLeft: '0.4rem', color: '#60a5fa', fontSize: '0.74rem' }}>
                    ({getCurrencyLabel(selectedFromAccount.currency)} Hesabı)
                  </span>
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Alıcı IBAN *</label>
              <input
                type="text"
                name="targetIban"
                required
                placeholder="TR..."
                className="form-input font-mono"
                value={formData.targetIban}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Transfer Tutarı ({(() => {
                  if (!selectedFromAccount) return 'TL';
                  const c = (selectedFromAccount.currency || 'TRY').toUpperCase();
                  return c === 'XAU' || c === 'GOLD' || c === 'ALTIN' ? 'Gram Altın' : c;
                })()}) *
              </label>
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
                placeholder="Örn: Kira, Fatura vb."
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
            <button type="submit" className="btn-submit btn-submit-green" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Transferi Tamamla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

