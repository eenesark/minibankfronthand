import React, { useState } from 'react';
import './CustomerTable.css';
import { formatCurrency, formatShortDate } from '../../../MiniBank.Infrastructure';

export default function CustomerTable({
  customers = [],
  accounts = [],
  onEditCustomer,
  onManageFeatures,
  onTransferFromAccount,
  onCashOperationFromAccount,
  onViewHistory,
  onCreateAccountForCustomer,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIban, setCopiedIban] = useState(null);

  const handleCopy = (iban) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    onShowToast('IBAN panoya kopyalandı!', 'success');
    setTimeout(() => setCopiedIban(null), 2000);
  };

  // Canlı Arama Filtreleme
  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.toLowerCase();
    const fullName = `${cust.firstName || ''} ${cust.lastName || ''}`.toLowerCase();
    const tc = String(cust.identityNumber || '').toLowerCase();
    const cNo = String(cust.customerNumber || '').toLowerCase();
    const email = String(cust.email || '').toLowerCase();
    const phone = String(cust.phoneNumber || '').toLowerCase();
    return fullName.includes(term) || tc.includes(term) || cNo.includes(term) || email.includes(term) || phone.includes(term);
  });

  return (
    <div className="table-container">
      <div className="table-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="table-title-group">
          <h2 className="table-title">👥 Müşteri Listesi & Yönetimi</h2>
          <span className="table-subtitle">Tüm müşteri hesapları ve operasyonel yetkiler</span>
        </div>

        {/* Canlı Arama Kutusu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '0.85rem' }}></i>
            <input
              type="text"
              placeholder="Ad, Soyad, TC No veya Müşteri No ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                background: 'rgba(10, 14, 23, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
          <span className="badge-total">{filteredCustomers.length} Müşteri</span>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="table-empty">
          <i className="fa-solid fa-folder-open empty-icon"></i>
          <p className="empty-title">
            {searchTerm ? `"${searchTerm}" ile eşleşen müşteri bulunamadı.` : 'Henüz kayıtlı müşteri bulunmuyor.'}
          </p>
          <p className="empty-desc">Yeni müşteri oluşturmak için üstteki butonu kullanabilirsiniz.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Müşteri No</th>
                <th>Ad Soyad</th>
                <th>T.C. Kimlik No</th>
                <th>İletişim</th>
                <th>Banka Hesabı (IBAN)</th>
                <th className="text-right">Toplam Bakiye</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => {
                const custAccount = cust.account || accounts.find(a => a.customerId === cust.id);
                const isAccActive = custAccount?.isActive !== false;

                return (
                  <tr key={cust.id} className="table-row">
                    {/* Müşteri No */}
                    <td>
                      <span className="tag-customerno">
                        {cust.customerNumber || 'MB---'}
                      </span>
                    </td>

                    {/* Ad Soyad */}
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {cust.firstName ? cust.firstName[0].toUpperCase() : 'M'}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{cust.firstName} {cust.lastName}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Kayıt: {formatShortDate(cust.createdAt || Date.now())}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* TC No */}
                    <td>
                      <span className="font-mono text-tc">{cust.identityNumber}</span>
                    </td>

                    {/* İletişim */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{cust.email || '-'}</span>
                        <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{cust.phoneNumber || '-'}</span>
                      </div>
                    </td>

                    {/* IBAN */}
                    <td>
                      {custAccount ? (
                        <div className="iban-group">
                          <span className="iban-badge" style={{ opacity: isAccActive ? 1 : 0.6 }}>
                            {custAccount.iban}
                          </span>
                          <button
                            title="IBAN'ı Kopyala"
                            className="btn-icon-copy"
                            onClick={() => handleCopy(custAccount.iban)}
                          >
                            <i className={copiedIban === custAccount.iban ? "fa-solid fa-check text-green" : "fa-regular fa-copy"}></i>
                          </button>
                        </div>
                      ) : (
                        <div className="no-account-group">
                          <span className="text-warning-badge">Hesap Yok</span>
                          <button
                            title="Bu müşteriye otomatik hesap aç"
                            className="btn-quick-create-acc"
                            onClick={() => onCreateAccountForCustomer(cust.id)}
                          >
                            <i className="fa-solid fa-plus"></i> Hesap Aç
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Bakiye */}
                    <td className="text-right">
                      {custAccount ? (
                        <span className="balance-text" style={{ color: isAccActive ? '#34d399' : '#9ca3af' }}>
                          {formatCurrency(custAccount.balance || 0, custAccount.currency)}
                        </span>
                      ) : (
                        <span className="balance-empty">-</span>
                      )}
                    </td>

                    {/* İşlemler */}
                    <td className="text-center">
                      <div className="action-buttons">
                        {custAccount ? (
                          <>
                            {/* Para Yatırma / Bakiye Düzeltme Modalı */}
                            <button
                              title="Bakiye Yükle / Para Yatır (POST /api/Transactions/deposit)"
                              className="action-btn action-cash"
                              onClick={() => onCashOperationFromAccount(custAccount.id)}
                            >
                              <i className="fa-solid fa-money-bill-wave"></i>
                            </button>

                            {/* Hesap Geçmişi / Dekontlar */}
                            <button
                              title="Hesaplarını & Dekontlarını Gör (GET /api/Transactions/history)"
                              className="action-btn action-history"
                              onClick={() => onViewHistory(custAccount)}
                            >
                              <i className="fa-solid fa-receipt"></i>
                            </button>

                            {/* Transfer */}
                            <button
                              title="Transfer Yap"
                              className="action-btn action-transfer"
                              onClick={() => onTransferFromAccount(custAccount.id)}
                            >
                              <i className="fa-solid fa-paper-plane"></i>
                            </button>
                          </>
                        ) : (
                          <button
                            title="Hesap Aç"
                            className="action-btn action-add-acc"
                            onClick={() => onCreateAccountForCustomer(cust.id)}
                          >
                            <i className="fa-solid fa-credit-card"></i>
                          </button>
                        )}

                        {/* Özellik & Yetki Yönetimi (Feature Management) */}
                        <button
                          title="Bankacılık Özelliklerini ve Yetkilerini Yönet (Vadeli, FX, Transfer Limit vb.)"
                          className="action-btn"
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#a78bfa',
                            border: '1px solid rgba(139, 92, 246, 0.3)'
                          }}
                          onClick={() => onManageFeatures && onManageFeatures(cust)}
                        >
                          <i className="fa-solid fa-sliders"></i>
                        </button>

                        {/* Düzenle */}
                        <button
                          title="Müşteri Bilgilerini Düzenle (PUT /api/Customers/{id})"
                          className="action-btn action-edit"
                          onClick={() => onEditCustomer(cust)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
