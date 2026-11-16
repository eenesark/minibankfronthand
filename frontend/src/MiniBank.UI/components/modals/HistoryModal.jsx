import React from 'react';
import './Modal.css';
import { formatCurrency } from '../../../MiniBank.Infrastructure';

export default function HistoryModal({
  isOpen,
  onClose,
  account,
  history = []
}) {
  if (!isOpen || !account) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon modal-icon-purple">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <h3 className="modal-title">Hesap Ekstresi & Dekontlar</h3>
              <p className="modal-subtitle font-mono">{account.iban}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#4b5563' }}></i>
              <p>Bu hesaba ait henüz işlem hareketi bulunmuyor.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map((tx) => {
                const isIncoming = tx.type === 'Deposit' || tx.type === 'TransferIn' || tx.type === 1 || tx.type === 3;
                return (
                  <div
                    key={tx.id}
                    style={{
                      background: 'rgba(10, 14, 23, 0.6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isIncoming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isIncoming ? '#34d399' : '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem'
                        }}
                      >
                        <i className={isIncoming ? "fa-solid fa-arrow-down-left" : "fa-solid fa-arrow-up-right"}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>
                          {tx.description || (isIncoming ? 'Gelen Transfer' : 'Giden Transfer')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(tx.createdAt).toLocaleString('tr-TR')}
                          {tx.targetIban && ` • Hedef: ${tx.targetIban}`}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: isIncoming ? '#34d399' : '#f87171'
                      }}
                    >
                      {isIncoming ? '+' : '-'}{formatCurrency(tx.amount || 0, tx.currency || account.currency || 'TRY')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

