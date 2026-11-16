import React from 'react';
import './Navbar.css';

export default function Navbar({
  onOpenNewCustomer,
  onOpenTransfer,
  onOpenCashOperation,
  onOpenProfile,
  onLogout
}) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="navbar-icon">
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <div className="navbar-titles">
            <div className="brand-title">
              MINIBANK
              <span className="version-tag">Admin Panel</span>
            </div>
            <p className="brand-subtitle">Merkezi Banka Yönetim Portalı</p>
          </div>
        </div>

        <div className="navbar-actions">
          <a
            href="http://localhost:5257/scalar/v1"
            target="_blank"
            rel="noreferrer"
            className="btn btn-scalar"
          >
            <i className="fa-solid fa-code"></i>
            <span>API Docs (Scalar)</span>
            <i className="fa-solid fa-arrow-up-right-from-square icon-small"></i>
          </a>

          <button className="btn btn-primary" onClick={onOpenNewCustomer}>
            <i className="fa-solid fa-user-plus"></i>
            <span>Yeni Müşteri & Hesap</span>
          </button>

          <button className="btn btn-transfer" onClick={onOpenTransfer}>
            <i className="fa-solid fa-money-bill-transfer"></i>
            <span>Para Transferi</span>
          </button>

          <button className="btn btn-atm" onClick={onOpenCashOperation}>
            <i className="fa-solid fa-money-bill-wave"></i>
            <span>ATM Nakit</span>
          </button>

          {onOpenProfile && (
            <button
              className="btn btn-admin-profile"
              onClick={onOpenProfile}
              style={{
                background: 'rgba(124, 58, 237, 0.2)',
                color: '#c4b5fd',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                cursor: 'pointer'
              }}
              title="Yönetici Profil Bilgilerim ve Şifre Değiştirme"
            >
              <i className="fa-solid fa-user-gear"></i>
              <span>Profilim & Ayarlar</span>
            </button>
          )}

          {onLogout && (
            <button
              className="btn btn-logout"
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                cursor: 'pointer'
              }}
              title="Yönetici Oturumunu Kapat"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Çıkış</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
