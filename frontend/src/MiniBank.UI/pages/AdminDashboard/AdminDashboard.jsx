import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import StatsCard from '../../components/StatsCard/StatsCard';
import CustomerTable from '../../components/CustomerTable/CustomerTable';
import NewCustomerModal from '../../components/modals/NewCustomerModal';
import TransferModal from '../../components/modals/TransferModal';
import CashOperationModal from '../../components/modals/CashOperationModal';
import EditCustomerModal from '../../components/modals/EditCustomerModal';
import HistoryModal from '../../components/modals/HistoryModal';
import CustomerFeaturesModal from '../../components/modals/CustomerFeaturesModal';
import {
  customerService as customerApi,
  accountService as accountApi,
  transactionService as transactionApi,
  adminService as adminApi,
  authService as authApi,
  formatCurrency,
  formatShortDate
} from '../../../MiniBank.Infrastructure';

export default function AdminDashboard({ onLogout, onShowToast }) {
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Admin Tab: 'customers' | 'accounts' | 'profile'
  const [adminTab, setAdminTab] = useState('customers');
  const [accountSearch, setAccountSearch] = useState('');
  const [copiedIban, setCopiedIban] = useState(null);

  // Admin Profile & Settings State
  const [adminProfile, setAdminProfile] = useState(() => authApi.getCurrentUser());
  const [adminProfileForm, setAdminProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: ''
  });

  // Modal states
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalAccountId, setCashModalAccountId] = useState('');
  const [cashModalType, setCashModalType] = useState('deposit');
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedCustomerForFeatures, setSelectedCustomerForFeatures] = useState(null);

  // Targets
  const [transferFromAccountId, setTransferFromAccountId] = useState('');
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState(null);
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState(null);
  const [accountHistoryData, setAccountHistoryData] = useState([]);

  const fetchAdminProfile = async () => {
    try {
      const me = await authApi.getMe();
      if (me) {
        setAdminProfile(me);
        setAdminProfileForm(prev => ({
          ...prev,
          firstName: me.firstName || (me.fullName ? me.fullName.split(' ')[0] : 'Sistem'),
          lastName: me.lastName || (me.fullName ? me.fullName.split(' ').slice(1).join(' ') : 'Yöneticisi'),
          email: me.email || 'admin@minibank.com',
          phoneNumber: me.phoneNumber || '+90 555 000 00 01',
          currentPassword: '',
          newPassword: ''
        }));
      }
    } catch (e) {
      console.warn('Admin profili yüklenemedi:', e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custs, accs] = await Promise.all([
        customerApi.getAll(),
        accountApi.getAll()
      ]);
      setCustomers(custs || []);
      setAccounts(accs || []);

      // İstatistikleri hesapla veya çek
      const stats = await adminApi.getDashboardStats(custs || [], accs || []);
      setDashboardStats(stats);
      await fetchAdminProfile();
    } catch (err) {
      onShowToast(err.message, 'error');
      if (err.message.includes('401') || err.message.includes('yetki') || err.message.includes('Oturum')) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Create New Customer
  const handleCreateCustomer = async (formData) => {
    try {
      setActionLoading(true);
      const newCust = await customerApi.create(formData);
      onShowToast(newCust?.message || `${newCust.firstName} ${newCust.lastName} için müşteri ve banka hesabı otomatik açıldı!`, 'success');
      setShowNewCustomerModal(false);
      await fetchData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Create Account for Customer
  const handleCreateAccountForCustomer = async (customerId) => {
    try {
      setActionLoading(true);
      const res = await accountApi.create({
        customerId,
        currency: 'TRY',
        initialDeposit: 0
      });
      onShowToast(res?.message || 'Hesap ve IBAN başarıyla üretildi!', 'success');
      await fetchData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Money Transfer
  const handleTransfer = async (transferData) => {
    try {
      setActionLoading(true);
      const res = await transactionApi.transfer(transferData);
      onShowToast(res?.message || `${formatCurrency(transferData.amount)} transferi başarıyla tamamlandı!`, 'success');
      setShowTransferModal(false);
      await fetchData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. ATM Cash Operation (Deposit / Withdraw)
  const handleCashOperation = async ({ type, data }) => {
    try {
      setActionLoading(true);
      if (type === 'deposit') {
        const res = await transactionApi.deposit(data);
        onShowToast(res?.message || `${formatCurrency(data.amount)} başarıyla hesaba yüklendi!`, 'success');
      } else {
        const res = await transactionApi.withdraw(data);
        onShowToast(res?.message || `${formatCurrency(data.amount)} nakit çekim tamamlandı!`, 'success');
      }
      setShowCashModal(false);
      await fetchData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Update Customer
  const handleUpdateCustomer = async (id, updatedData) => {
    try {
      setActionLoading(true);
      const updated = await customerApi.update(id, updatedData);
      onShowToast(updated?.message || `${updated.firstName} ${updated.lastName} bilgileri güncellendi!`, 'success');
      setShowEditCustomerModal(false);
      await fetchData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. View History
  const handleViewHistory = async (account) => {
    setSelectedAccountForHistory(account);
    try {
      const history = await transactionApi.getHistory(account.id);
      setAccountHistoryData(history || []);
      setShowHistoryModal(true);
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // 7. Toggle Account Status (Pasife Al / Aktif Et)
  const handleToggleAccount = async (acc) => {
    const isCurrentlyActive = acc.isActive !== false;
    const actionLabel = isCurrentlyActive ? 'donduruldu (pasife alındı)' : 'yeniden aktif edildi';

    try {
      setActionLoading(true);
      await accountApi.toggleStatus(acc.id, isCurrentlyActive);
      onShowToast(`${acc.iban} hesabı ${actionLabel}!`, 'success');
      await fetchData();
    } catch (err) {
      onShowToast(err.message || 'Hesap durumu değiştirilemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Update Admin Profile & Password
  const handleAdminProfileSubmit = async (e) => {
    e.preventDefault();
    if (!adminProfileForm.currentPassword) {
      onShowToast('Profil ve şifre güncellemelerini kaydetmek için lütfen mevcut şifrenizi giriniz.', 'error');
      return;
    }

    if (adminProfileForm.newPassword && adminProfileForm.newPassword.length < 6) {
      onShowToast('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        firstName: adminProfileForm.firstName.trim(),
        lastName: adminProfileForm.lastName.trim(),
        email: adminProfileForm.email.trim(),
        phoneNumber: adminProfileForm.phoneNumber.trim(),
        currentPassword: adminProfileForm.currentPassword,
        newPassword: adminProfileForm.newPassword || null
      };

      const updated = await authApi.updateProfile(payload);
      onShowToast('Yönetici profil bilgileriniz ve şifreniz başarıyla güncellendi!', 'success');
      
      setAdminProfile(prev => ({ ...prev, ...updated }));
      setAdminProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: ''
      }));
    } catch (err) {
      onShowToast(err.message || 'Yönetici profili güncellenemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (iban) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    onShowToast('IBAN panoya kopyalandı!', 'success');
    setTimeout(() => setCopiedIban(null), 2000);
  };

  // Filtrelenmiş Hesaplar
  const filteredAccounts = accounts.filter(a => {
    const term = accountSearch.toLowerCase();
    const iban = (a.iban || '').toLowerCase();
    const name = (a.customerFullName || '').toLowerCase();
    return iban.includes(term) || name.includes(term);
  });

  return (
    <div className="app-layout">
      {/* Navbar */}
      <Navbar
        onOpenNewCustomer={() => setShowNewCustomerModal(true)}
        onOpenTransfer={() => {
          setTransferFromAccountId('');
          setShowTransferModal(true);
        }}
        onOpenCashOperation={() => {
          setCashModalAccountId('');
          setCashModalType('deposit');
          setShowCashModal(true);
        }}
        onOpenProfile={() => setAdminTab('profile')}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main className="main-content">
        {loading ? (
          <div className="loading-state">
            <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
            <p>MiniBank yönetim paneli verileri yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* 4 BÜYÜK İSTATİSTİK KARTI */}
            <StatsCard
              customers={customers}
              accounts={accounts}
              stats={dashboardStats}
            />

            {/* SEKME SEÇİCİ */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              margin: '1.75rem 0 1rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => setAdminTab('customers')}
                style={{
                  background: adminTab === 'customers' ? '#2563eb' : 'rgba(31, 41, 55, 0.6)',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fa-solid fa-users"></i>
                <span>Müşteri Yönetimi ({customers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('accounts')}
                style={{
                  background: adminTab === 'accounts' ? '#059669' : 'rgba(31, 41, 55, 0.6)',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fa-solid fa-credit-card"></i>
                <span>Hesap Yönetimi & Dondurma ({accounts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('profile')}
                style={{
                  background: adminTab === 'profile' ? '#7c3aed' : 'rgba(31, 41, 55, 0.6)',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginLeft: 'auto'
                }}
              >
                <i className="fa-solid fa-user-gear"></i>
                <span>Profilim & Yönetici Ayarları</span>
              </button>
            </div>

            {/* SEKME 1: MÜŞTERİLER TABLOSU */}
            {adminTab === 'customers' && (
              <CustomerTable
                customers={customers}
                accounts={accounts}
                onEditCustomer={(cust) => {
                  setSelectedCustomerToEdit(cust);
                  setShowEditCustomerModal(true);
                }}
                onManageFeatures={(cust) => {
                  setSelectedCustomerForFeatures(cust);
                  setShowFeaturesModal(true);
                }}
                onTransferFromAccount={(accId) => {
                  setTransferFromAccountId(accId);
                  setShowTransferModal(true);
                }}
                onCashOperationFromAccount={(accId) => {
                  setCashModalAccountId(accId);
                  setCashModalType('deposit');
                  setShowCashModal(true);
                }}
                onViewHistory={handleViewHistory}
                onCreateAccountForCustomer={handleCreateAccountForCustomer}
                onShowToast={onShowToast}
              />
            )}

            {/* SEKME 2: HESAP YÖNETİMİ (AKTİF/PASİF DONDURMA) TABLOSU */}
            {adminTab === 'accounts' && (
              <div className="table-container">
                <div className="table-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="table-title-group">
                    <h2 className="table-title">💳 Hesap Yönetimi (Dondur / Aktif Et)</h2>
                    <span className="table-subtitle">Tüm banka hesaplarının canlı durumu ve kontrolü</span>
                  </div>

                  <div style={{ position: 'relative', width: '320px' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '0.85rem' }}></i>
                    <input
                      type="text"
                      placeholder="IBAN veya Müşteri Ara..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
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
                </div>

                <div className="table-scroll">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Hesap Sahibi</th>
                        <th>IBAN Numarası</th>
                        <th>Para Birimi</th>
                        <th className="text-right">Bakiye</th>
                        <th className="text-center">Hesap Durumu</th>
                        <th className="text-center">İşlem / Dondurma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map(acc => {
                        const isAccActive = acc.isActive !== false;
                        const customer = customers.find(c => c.id === acc.customerId);
                        const ownerName = acc.customerFullName || (customer ? `${customer.firstName} ${customer.lastName}` : 'Müşteri');

                        return (
                          <tr key={acc.id} className="table-row">
                            <td>
                              <div className="user-name">{ownerName}</div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                {customer?.customerNumber || 'ID: ' + acc.customerId?.slice(0, 8)}
                              </span>
                            </td>

                            <td>
                              <div className="iban-group">
                                <span className="iban-badge" style={{ opacity: isAccActive ? 1 : 0.6 }}>{acc.iban}</span>
                                <button
                                  title="IBAN'ı Kopyala"
                                  className="btn-icon-copy"
                                  onClick={() => handleCopy(acc.iban)}
                                >
                                  <i className={copiedIban === acc.iban ? "fa-solid fa-check text-green" : "fa-regular fa-copy"}></i>
                                </button>
                              </div>
                            </td>

                            <td>
                              <span className="font-mono">{acc.currency || 'TRY'}</span>
                            </td>

                            <td className="text-right">
                              <span className="balance-text" style={{ color: isAccActive ? '#34d399' : '#9ca3af' }}>
                                {formatCurrency(acc.balance || 0, acc.currency)}
                              </span>
                            </td>

                            <td className="text-center">
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  background: isAccActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isAccActive ? '#34d399' : '#f87171',
                                  border: `1px solid ${isAccActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                }}
                              >
                                <i className={`fa-solid ${isAccActive ? 'fa-circle-check' : 'fa-circle-pause'}`}></i>
                                <span>{isAccActive ? 'Aktif' : 'Dondurulmuş'}</span>
                              </span>
                            </td>

                            <td className="text-center">
                              <div className="action-buttons">
                                {/* Dondur / Aktif Et Butonu */}
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleToggleAccount(acc)}
                                  title={isAccActive ? "Hesabı Dondur (Pasife Al)" : "Hesabı Yeniden Aktif Et"}
                                  style={{
                                    background: isAccActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isAccActive ? '#f87171' : '#34d399',
                                    border: `1px solid ${isAccActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  <i className={`fa-solid ${isAccActive ? 'fa-pause' : 'fa-play'}`}></i>
                                  <span>{isAccActive ? 'Dondur' : 'Aktif Et'}</span>
                                </button>

                                {/* Para Yükle */}
                                <button
                                  title="ATM Bakiye Yükle"
                                  className="action-btn action-cash"
                                  onClick={() => {
                                    setCashModalAccountId(acc.id);
                                    setCashModalType('deposit');
                                    setShowCashModal(true);
                                  }}
                                >
                                  <i className="fa-solid fa-money-bill-wave"></i>
                                </button>

                                {/* Geçmiş */}
                                <button
                                  title="Dekont & Hareketler"
                                  className="action-btn action-history"
                                  onClick={() => handleViewHistory(acc)}
                                >
                                  <i className="fa-solid fa-receipt"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SEKME 3: YÖNETİCİ PROFİLİ & GÜVENLİK AYARLARI */}
            {adminTab === 'profile' && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                maxWidth: '780px',
                margin: '0 auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}>
                {/* Başlık Alanı */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  marginBottom: '1.75rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
                  }}>
                    <i className="fa-solid fa-user-shield"></i>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', margin: 0 }}>
                      Yönetici Profilim & Güvenlik Ayarları
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                      Yönetici kimlik bilgilerinizi güncelleyin ve sisteme giriş şifrenizi yenileyin
                    </p>
                  </div>
                </div>

                {/* 1. GRUP: Salt Okunur Yönetici Rol Bilgisi */}
                <div style={{
                  background: 'rgba(10, 14, 23, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.75rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.25rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Kullanıcı Adı / TCKN
                    </span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb', fontFamily: 'var(--font-mono)', marginTop: '0.35rem' }}>
                      {adminProfile?.identityNumber || adminProfile?.username || 'admin'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Sistem Rolü
                    </span>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span style={{
                        background: 'rgba(124, 58, 237, 0.2)',
                        color: '#c4b5fd',
                        border: '1px solid rgba(124, 58, 237, 0.35)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <i className="fa-solid fa-shield-halved"></i>
                        Sistem Yöneticisi (Admin)
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Erişim Yetkisi
                    </span>
                    <div style={{ fontSize: '0.875rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <i className="fa-solid fa-circle-check"></i>
                      Tam Yetkili Yönetici
                    </div>
                  </div>
                </div>

                {/* 2. GRUP: Form (Ad, Soyad, E-posta, Telefon & Şifre Değiştirme) */}
                <form onSubmit={handleAdminProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Yönetici Adı *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Adınız"
                        value={adminProfileForm.firstName}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Yönetici Soyadı *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Soyadınız"
                        value={adminProfileForm.lastName}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">E-Posta Adresi *</label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="admin@minibank.com"
                        value={adminProfileForm.email}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefon Numarası *</label>
                      <input
                        type="tel"
                        required
                        className="form-input"
                        placeholder="+90 555 000 00 01"
                        value={adminProfileForm.phoneNumber}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* ŞİFRE DEĞİŞTİRME & GÜVENLİK ALANI */}
                  <div style={{
                    background: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(124, 58, 237, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#c4b5fd',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <i className="fa-solid fa-key"></i>
                      <span>Yönetici Şifre Değiştirme & Güvenlik Doğrulaması</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                      <label className="form-label" style={{ color: '#f87171' }}>
                        Mevcut Şifreniz * (Değişiklikleri ve Yeni Şifreyi Kaydetmek İçin Zorunludur)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Mevcut şifrenizi girin (Örn: Admin123*)"
                        className="form-input"
                        value={adminProfileForm.currentPassword}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Yeni Yönetici Şifresi <span style={{ opacity: 0.7, fontWeight: 400 }}>(İsteğe bağlı, değiştirmek istiyorsanız en az 6 karakter girin)</span>
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        placeholder="Yeni şifrenizi girin (değiştirmek istemiyorsanız boş bırakın)"
                        className="form-input"
                        value={adminProfileForm.newPassword}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn"
                    disabled={actionLoading}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      color: 'white',
                      padding: '0.95rem',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
                      marginTop: '0.5rem'
                    }}
                  >
                    {actionLoading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Güncelleniyor...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Yönetici Bilgilerini ve Yeni Şifreyi Kaydet</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>MiniBank © 2026 • .NET 10 & React N-Tier Dijital Bankacılık Mimarisi (Yönetici Paneli)</p>
      </footer>

      {/* Modals */}
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onSubmit={handleCreateCustomer}
        loading={actionLoading}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSubmit={handleTransfer}
        accounts={accounts}
        initialFromAccountId={transferFromAccountId}
        loading={actionLoading}
      />

      <CashOperationModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        onSubmit={handleCashOperation}
        accounts={accounts}
        initialAccountId={cashModalAccountId}
        initialType={cashModalType}
        loading={actionLoading}
      />

      <EditCustomerModal
        isOpen={showEditCustomerModal}
        onClose={() => setShowEditCustomerModal(false)}
        customer={selectedCustomerToEdit}
        onSubmit={handleUpdateCustomer}
        loading={actionLoading}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        account={selectedAccountForHistory}
        history={accountHistoryData}
      />

      <CustomerFeaturesModal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        customer={selectedCustomerForFeatures}
        onShowToast={onShowToast}
      />
    </div>
  );
}
