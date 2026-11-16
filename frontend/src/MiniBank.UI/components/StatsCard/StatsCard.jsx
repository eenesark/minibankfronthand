import React from 'react';
import './StatsCard.css';
import { formatCurrency } from '../../../MiniBank.Infrastructure';

export default function StatsCard({ customers = [], accounts = [], transactionsCount = 0, stats = null }) {
  const totalDeposit = stats?.totalDeposit ?? accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0);
  const totalCustomers = stats?.totalCustomers ?? customers.length;
  const activeAccountsCount = stats?.activeAccounts ?? accounts.filter(a => a.isActive !== false).length;
  const totalOperations = stats?.totalTransactions ?? (transactionsCount > 0 ? transactionsCount : accounts.length * 2);

  return (
    <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      {/* 1. Toplam Mevduat */}
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">🏦 Bankadaki Toplam Mevduat</span>
          <span className="stat-value value-money" style={{ color: '#34d399', fontSize: '1.45rem' }}>
            {formatCurrency(totalDeposit)}
          </span>
          <span className="stat-badge badge-emerald">
            <i className="fa-solid fa-vault"></i> Güvenli Rezerv
          </span>
        </div>
        <div className="stat-icon-wrapper icon-emerald">
          <i className="fa-solid fa-building-columns"></i>
        </div>
      </div>

      {/* 2. Toplam Müşteri */}
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">👥 Toplam Müşteri Sayısı</span>
          <span className="stat-value">{totalCustomers}</span>
          <span className="stat-badge badge-blue">
            <i className="fa-solid fa-users"></i> Kayıtlı Portföy
          </span>
        </div>
        <div className="stat-icon-wrapper icon-blue">
          <i className="fa-solid fa-user-group"></i>
        </div>
      </div>

      {/* 3. Toplam Açık Hesap */}
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">💳 Toplam Açık Hesap</span>
          <span className="stat-value">{activeAccountsCount}</span>
          <span className="stat-badge badge-purple">
            <i className="fa-solid fa-circle-check"></i> Aktif IBAN
          </span>
        </div>
        <div className="stat-icon-wrapper icon-purple">
          <i className="fa-solid fa-credit-card"></i>
        </div>
      </div>

      {/* 4. Toplam İşlem Hacmi */}
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">🔄 Toplam İşlem Hacmi</span>
          <span className="stat-value">{totalOperations}</span>
          <span className="stat-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <i className="fa-solid fa-arrow-right-arrow-left"></i> Transfer & Nakit
          </span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
          <i className="fa-solid fa-chart-line"></i>
        </div>
      </div>
    </section>
  );
}
