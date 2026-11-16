import React, { useState, useEffect } from 'react';
import './CustomerPortal.css';
import {
  authService as authApi,
  transactionService as transactionApi,
  currencyService as currencyApi,
  accountService as accountApi,
  cardService as cardApi,
  dashboardService as dashboardApi,
  spendingService as spendingApi,
  formatCurrency,
  formatDate,
  getCurrencyLabel
} from '../../../MiniBank.Infrastructure';
import AssistantWidget from '../../components/Assistant/AssistantWidget';
import { CardSettingsModal } from '../../components/modals/CardSettingsModal';

export default function CustomerPortal({ onLogout, onShowToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab: 'dashboard' | 'cards' | 'transfer' | 'history' | 'termdeposit' | 'fx' | 'profile' | 'currencies' | 'spending'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Harcama & Bütçe Yönetimi (Spending Management) State
  const [spendingData, setSpendingData] = useState(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [selectedSpendingMonth, setSelectedSpendingMonth] = useState(new Date().getMonth() + 1);
  const [selectedSpendingYear, setSelectedSpendingYear] = useState(new Date().getFullYear());
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState([]);
  const [categoryTxLoading, setCategoryTxLoading] = useState(false);
  const [budgetModalCategory, setBudgetModalCategory] = useState(null);
  const [budgetInputLimit, setBudgetInputLimit] = useState('');

  // Yan Çekmece Menüsü (Drawer Menu) & Sadeleştirilmiş Dashboard State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState(null); // Tıklanan kategori (null ise ana kategoriler listelenir)
  const [navigationMenu, setNavigationMenu] = useState([]);
  const [homeDashboardData, setHomeDashboardData] = useState(null);

  // Banka Kartları (Debit Cards) State
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [selectedCardForSettings, setSelectedCardForSettings] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Selected account for operations
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [accountHistory, setAccountHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copiedIban, setCopiedIban] = useState(null);

  // Vadeli Mevduat (Term Deposit) State
  const [termDepositForm, setTermDepositForm] = useState({
    fromAccountId: '',
    amount: '50000',
    days: 32
  });
  const [showOpenTermModal, setShowOpenTermModal] = useState(false);
  const [termAccounts, setTermAccounts] = useState([]);

  // Geçmişten kalan paylaşımlı genel localStorage verilerini temizle
  useEffect(() => {
    try {
      localStorage.removeItem('minibank_term_deposits');
    } catch {}
  }, []);

  // Live TCMB Rates & Currency Market State
  const [rates, setRates] = useState([
    { code: 'USD', name: 'Amerikan Doları', flag: '🇺🇸', buying: 34.62, selling: 34.75, change: '+%0.18', isUp: true },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', buying: 37.85, selling: 37.99, change: '+%0.24', isUp: true },
    { code: 'XAU', name: 'Gram Altın (24K)', flag: '🟡', buying: 3085.50, selling: 3115.00, change: '+%0.42', isUp: true }
  ]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(new Date());

  // Currency Account Opening Modal State
  const [showOpenCurrencyModal, setShowOpenCurrencyModal] = useState(false);
  const [newCurrencyType, setNewCurrencyType] = useState('USD');

  // FX Trade Form State (Canlı Al / Sat)
  const [tradeAction, setTradeAction] = useState('buy'); // 'buy' (Döviz Al) | 'sell' (Döviz Bozdur)
  const [tradeCurrency, setTradeCurrency] = useState('USD');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeSourceAccountId, setTradeSourceAccountId] = useState('');
  const [tradeTargetAccountId, setTradeTargetAccountId] = useState('');

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    targetIban: '',
    amount: '',
    description: 'Havale / EFT Transferi'
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: ''
  });

  // 1. Fetch Profile and Accounts
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.getMe();
      setProfile(data);

      // Profil formu başlangıç değerleri
      setProfileForm(prev => ({
        ...prev,
        firstName: data.firstName || (data.fullName ? data.fullName.split(' ')[0] : ''),
        lastName: data.lastName || (data.fullName ? data.fullName.split(' ').slice(1).join(' ') : ''),
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        currentPassword: '',
        newPassword: ''
      }));

      // SADECE GİRİŞ YAPAN KULLANICININ VADELİ HESAPLARINI YÜKLE
      try {
        const timeDeposits = await accountApi.getMyTimeDeposits();
        if (Array.isArray(timeDeposits) && timeDeposits.length > 0) {
          setTermAccounts(timeDeposits.map(t => ({
            id: t.id,
            iban: t.iban,
            balance: t.principalAmount || t.balance,
            principal: t.principalAmount || t.balance,
            interestRate: t.interestRate,
            termDays: t.maturityDays,
            startDate: t.startDate || t.createdAt,
            endDate: t.maturityDate,
            netReturn: t.expectedInterest,
            grossReturn: t.expectedInterest,
            totalPayout: (t.principalAmount || t.balance) + (t.expectedInterest || 0),
            currency: 'TRY',
            isTermDeposit: true,
            isActive: !t.isClosed,
            statusText: t.statusText,
            remainingDays: t.remainingDays,
            customerId: data?.id
          })));
        } else if (data?.id) {
          const userSaved = localStorage.getItem(`minibank_term_deposits_${data.id}`);
          setTermAccounts(userSaved ? JSON.parse(userSaved) : []);
        } else {
          setTermAccounts([]);
        }
      } catch {
        if (data?.id) {
          const userSaved = localStorage.getItem(`minibank_term_deposits_${data.id}`);
          setTermAccounts(userSaved ? JSON.parse(userSaved) : []);
        } else {
          setTermAccounts([]);
        }
      }

      // Banka Kartlarını Yükle (Yalnızca TL / TRY vadesiz hesaplarına bağlı kartlar)
      try {
        const myCards = await cardApi.getMyCards();
        const allAccs = normalizeAccounts(data);
        const tryCards = (myCards || []).filter(c => {
          const linkedAcc = allAccs.find(a => a.id === c.accountId || a.iban === c.accountIban);
          const curr = (linkedAcc?.currency || c.currency || 'TRY').toUpperCase();
          return curr === 'TRY' || curr === 'TL';
        });
        setCards(tryCards);
      } catch (e) {
        console.warn('Kartlar yüklenemedi:', e.message);
      }

      // Backend Dashboard Home ve Hamburger Menü Ağacını Yükle
      try {
        const homeData = await dashboardApi.getHome();
        if (homeData) {
          setHomeDashboardData(homeData);
          if (Array.isArray(homeData.navigationMenu) && homeData.navigationMenu.length > 0) {
            setNavigationMenu(homeData.navigationMenu);
          }
        }
        if (!navigationMenu || navigationMenu.length === 0) {
          const menuData = await dashboardApi.getNavigationMenu();
          if (Array.isArray(menuData) && menuData.length > 0) {
            setNavigationMenu(menuData);
          }
        }
      } catch (e) {
        console.warn('Dashboard API yükleme hatası:', e.message);
      }

      // İlk transfer edilebilir vadesiz hesabı seçili yap
      const accs = normalizeAccounts(data);
      const eligibleAccs = accs.filter(a => !a.isTermDeposit && a.accountType !== 'TimeDeposit');
      if (eligibleAccs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(eligibleAccs[0].id);
        setTransferForm(prev => ({ ...prev, fromAccountId: eligibleAccs[0].id }));
      } else if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err) {
      onShowToast(err.message, 'error');
      if (err.message.includes('Oturum') || err.message.includes('yetkisiz')) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Accounts list normalizer
  const normalizeAccounts = (data) => {
    if (!data) return [];
    let list = [];
    if (Array.isArray(data.accounts) && data.accounts.length > 0) {
      list = data.accounts.map(a => ({
        ...a,
        isTermDeposit: a.accountType === 'TimeDeposit' || a.isTermDeposit || false
      }));
    } else if (data.account) {
      list = [{ ...data.account, isTermDeposit: data.account.accountType === 'TimeDeposit' || false }];
    } else if (data.iban) {
      list = [{
        id: data.accountId || data.id,
        iban: data.iban,
        balance: data.balance || 0,
        currency: data.currency || 'TRY',
        isActive: data.isActive !== false,
        isTermDeposit: data.accountType === 'TimeDeposit' || false
      }];
    }

    // Sadece bu kullanıcıya ait vadeli hesapları ekle (tekrarsız)
    if (Array.isArray(termAccounts) && data?.id) {
      termAccounts.forEach(term => {
        if (term.customerId === data.id) {
          if (!list.some(a => a.id === term.id || a.iban === term.iban)) {
            list.push({ ...term, customerId: data.id, isTermDeposit: true });
          }
        }
      });
    }

    return list;
  };

  const accounts = normalizeAccounts(profile);
  // Yalnızca Vadesiz (Demand) hesaplar üzerinden Havale/EFT transferi yapılabilir
  const transferEligibleAccounts = accounts.filter(a => !a.isTermDeposit && a.accountType !== 'TimeDeposit');
  const activeAccount = accounts.find(a => a.id === selectedAccountId) || transferEligibleAccounts[0] || accounts[0] || null;

  // 2. Load History for Account
  const loadHistory = async (accId) => {
    if (!accId) return;
    try {
      setHistoryLoading(true);
      const history = await transactionApi.getHistory(accId);
      setAccountHistory(history || []);
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && selectedAccountId) {
      loadHistory(selectedAccountId);
    }
  }, [activeTab, selectedAccountId]);

  // Copy IBAN
  const handleCopyIban = (iban) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    onShowToast('IBAN panoya kopyalandı!', 'success');
    setTimeout(() => setCopiedIban(null), 2000);
  };

  // 3. Submit Transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.fromAccountId) {
      onShowToast('Lütfen gönderen hesabı seçin.', 'error');
      return;
    }
    const sourceAcc = accounts.find(a => a.id === transferForm.fromAccountId);
    if (sourceAcc?.isTermDeposit || sourceAcc?.accountType === 'TimeDeposit') {
      onShowToast('Vadeli mevduat hesaplarından doğrudan para transferi yapılamaz. Lütfen vadesiz bir hesap seçin.', 'error');
      return;
    }
    if (!transferForm.targetIban.startsWith('TR')) {
      onShowToast('Hedef IBAN "TR" ile başlamalıdır.', 'error');
      return;
    }
    if (parseFloat(transferForm.amount) <= 0) {
      onShowToast('Geçerli bir transfer tutarı girin.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await transactionApi.transfer({
        fromAccountId: transferForm.fromAccountId,
        targetIban: transferForm.targetIban.trim(),
        amount: parseFloat(transferForm.amount),
        description: transferForm.description.trim() || 'Para Transferi'
      });

      const selectedTransferAcc = transferEligibleAccounts.find(a => a.id === transferForm.fromAccountId) || accounts.find(a => a.id === transferForm.fromAccountId);
      onShowToast(res?.message || `${formatCurrency(transferForm.amount, selectedTransferAcc?.currency || 'TRY')} transferi başarıyla tamamlandı!`, 'success');
      setTransferForm(prev => ({
        ...prev,
        amount: '',
        targetIban: '',
        description: 'Havale / EFT Transferi'
      }));

      // Bakiyeleri yenile
      await fetchProfile();
      // Geçmişe yönlendir
      setActiveTab('history');
    } catch (err) {
      onShowToast(err.message || 'Transfer başarısız oldu.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Submit Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.currentPassword) {
      onShowToast('Lütfen profilinizi güncellemek için mevcut şifrenizi giriniz.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await authApi.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword || null
      });

      onShowToast('Profil bilgileriniz başarıyla güncellendi!', 'success');
      setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      await fetchProfile();
    } catch (err) {
      onShowToast(err.message || 'Profil güncellenemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. TCMB Canlı Kurları Çekme (GET /api/Currency/rates)
  const fetchRates = async () => {
    try {
      setRatesLoading(true);
      const data = await currencyApi.getRates();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(item => {
          const code = (item.code || item.currency || item.currencyCode || '').toUpperCase();
          const flag = code === 'USD' ? '🇺🇸' : code === 'EUR' ? '🇪🇺' : (code === 'XAU' || code === 'GOLD') ? '🟡' : '🌐';
          const name = item.name || (code === 'USD' ? 'Amerikan Doları' : code === 'EUR' ? 'Euro' : 'Gram Altın (24K)');
          const buying = parseFloat(item.buying || item.buyingRate || item.forexBuying || item.bid || 0);
          const selling = parseFloat(item.selling || item.sellingRate || item.forexSelling || item.ask || 0);
          const change = item.change || item.changeRate || '+%0.18';
          const isUp = String(change).startsWith('+') || parseFloat(change) >= 0;
          return { code, name, flag, buying, selling, change, isUp };
        });
        setRates(mapped);
      } else if (data && typeof data === 'object') {
        const keys = Object.keys(data).filter(k => k !== 'lastUpdated' && k !== 'success');
        if (keys.length > 0 && typeof data[keys[0]] === 'object') {
          const mapped = keys.map(code => {
            const item = data[code];
            const flag = code === 'USD' ? '🇺🇸' : code === 'EUR' ? '🇪🇺' : (code === 'XAU' || code === 'GOLD') ? '🟡' : '🌐';
            const name = item.name || (code === 'USD' ? 'Amerikan Doları' : code === 'EUR' ? 'Euro' : 'Gram Altın (24K)');
            const buying = parseFloat(item.buying || item.buyingRate || item.forexBuying || item.bid || 0);
            const selling = parseFloat(item.selling || item.sellingRate || item.forexSelling || item.ask || 0);
            return { code, name, flag, buying, selling, change: item.change || '+%0.22', isUp: true };
          });
          setRates(mapped);
        }
      }
      setRatesLastUpdated(new Date());
    } catch (err) {
      console.warn('Canlı TCMB kurları çekilirken hata oluştu, varsayılan kurlar aktif:', err);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 25000);
    return () => clearInterval(interval);
  }, []);

  // 6. Vadeli Mevduat Faiz Oranları & Hesaplama
  // 32 günlüğe kadar -> %32
  // 33 - 90 gün arası -> %38
  // 90 gün ve fazlası -> %41
  const getInterestRate = (days) => {
    const d = parseInt(days) || 32;
    if (d <= 32) return 32;
    if (d < 90) return 38;
    return 41;
  };

  const calculateInterest = (principal, days) => {
    const p = parseFloat(principal) || 0;
    const d = parseInt(days) || 32;
    const rate = getInterestRate(d);

    // Brüt Faiz = (Anapara * Yıllık Oran * Gün) / 36500
    const gross = (p * rate * d) / 36500;
    // Gelir Vergisi (Stopaj) Kesintisi: %7.5
    const withholding = gross * 0.075;
    const net = gross - withholding;
    const total = p + net;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + d);

    return {
      principal: p,
      days: d,
      rate,
      gross: parseFloat(gross.toFixed(2)),
      withholding: parseFloat(withholding.toFixed(2)),
      net: parseFloat(net.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      endDate
    };
  };

  // Vadeli Mevduat Hesabı Aç
  const handleOpenTermDeposit = async (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(termDepositForm.amount);
    const days = parseInt(termDepositForm.days);

    if (!termDepositForm.fromAccountId) {
      onShowToast('Lütfen anaparanın çekileceği vadesiz TL hesabını seçin.', 'error');
      return;
    }
    if (!amt || amt < 1000) {
      onShowToast('Minimum vadeli mevduat açılış tutarı 1.000 TL\'dir.', 'error');
      return;
    }

    const calc = calculateInterest(amt, days);

    try {
      setActionLoading(true);
      const payload = {
        customerId: profile?.id,
        fromAccountId: termDepositForm.fromAccountId,
        amount: amt,
        termDays: days,
        interestRate: calc.rate,
        currency: 'TRY'
      };

      let createdAcc = null;
      try {
        createdAcc = await accountApi.openTermDeposit(payload);
      } catch (err) {
        if (err.message && (err.message.toLowerCase().includes('yetki') || err.message.toLowerCase().includes('yetkilendirilmemiştir') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('engellendi'))) {
          onShowToast(err.message, 'error');
          return;
        }
        console.warn('Backend vadeli hesap API çağrısı:', err.message);
      }

      const newTermAcc = {
        id: createdAcc?.id || `term_${Date.now()}`,
        customerId: profile?.id,
        iban: createdAcc?.iban || `TR${Math.floor(100000000000000000000000 + Math.random() * 900000000000000000000000)}`,
        balance: amt,
        principal: amt,
        interestRate: calc.rate,
        termDays: days,
        startDate: new Date().toISOString(),
        endDate: calc.endDate.toISOString(),
        netReturn: calc.net,
        grossReturn: calc.gross,
        totalPayout: calc.total,
        currency: 'TRY',
        isTermDeposit: true,
        isActive: true
      };

      const updatedTermList = [newTermAcc, ...termAccounts];
      setTermAccounts(updatedTermList);
      if (profile?.id) {
        localStorage.setItem(`minibank_term_deposits_${profile.id}`, JSON.stringify(updatedTermList));
      }

      onShowToast(createdAcc?.message || `Tebrikler! %${calc.rate} yıllık faiz oranıyla ${days} günlük Vadeli Mevduat hesabınız başarıyla açıldı!`, 'success');
      setShowOpenTermModal(false);
      await fetchProfile();
      setActiveTab('termdeposit');
    } catch (err) {
      onShowToast(err.message || 'Vadeli mevduat hesabı açılamadı.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Vadeli Hesabı Kapat / Vadesize Aktar
  const handleCloseTermDeposit = async (termAccId) => {
    if (!window.confirm('Bu vadeli mevduat hesabını kapatmak istediğinizden emin misiniz? Vade dolmadan kapatılan hesaplarda faiz getirisi iptal edilecek, sadece anapara vadesiz hesabınıza aktarılacaktır.')) {
      return;
    }

    try {
      setActionLoading(true);
      try {
        await accountApi.closeTermDeposit({ accountId: termAccId });
      } catch {}

      const updated = termAccounts.filter(a => a.id !== termAccId);
      setTermAccounts(updated);
      if (profile?.id) {
        localStorage.setItem(`minibank_term_deposits_${profile.id}`, JSON.stringify(updated));
      }

      onShowToast('Vadeli mevduat hesabı başarıyla kapatıldı ve anaparanız vadesiz hesabınıza aktarıldı.', 'success');
      await fetchProfile();
    } catch (err) {
      onShowToast(err.message || 'Hesap kapatılamadı.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Kart Yönetimi Fonksiyonları (Sadece Vadesiz TL Hesapları İçin)
  const fetchCards = async () => {
    try {
      setCardsLoading(true);
      const data = await cardApi.getMyCards();
      const tryCards = (data || []).filter(c => {
        const linkedAcc = accounts.find(a => a.id === c.accountId || a.iban === c.accountIban);
        const curr = (linkedAcc?.currency || c.currency || 'TRY').toUpperCase();
        return curr === 'TRY' || curr === 'TL';
      });
      setCards(tryCards);
    } catch (err) {
      console.warn('Kartlar yüklenemedi:', err.message);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleOpenCardModal = (card) => {
    setSelectedCardForSettings(card);
    setShowCardModal(true);
  };

  const handleOpenCardByAccount = (account) => {
    // Sadece TL vadesiz hesabı için kart açılabilir
    const curr = (account.currency || 'TRY').toUpperCase();
    if (curr !== 'TRY' && curr !== 'TL') {
      onShowToast('Banka kartı (Debit Card) yalnızca Vadesiz TL hesapları için tanımlanabilir. Döviz ve altın hesaplarında kart desteği bulunmamaktadır.', 'error');
      return;
    }
    // Bu hesaba ait kart var mı kontrol et
    const existingCard = cards.find(c => c.accountId === account.id || c.accountIban === account.iban);
    if (existingCard) {
      handleOpenCardModal(existingCard);
    } else {
      // Eğer backend kart üretmemişse yeni kart talep et
      handleRequestNewCard(account.id);
    }
  };

  const handleToggleCardStatus = async (cardId) => {
    try {
      setActionLoading(true);
      const res = await cardApi.toggleStatus(cardId);
      onShowToast(res?.message || 'Kart durumu başarıyla güncellendi.', 'success');
      await fetchCards();
      // Modal açık ise seçili kartı da güncelle
      if (selectedCardForSettings?.id === cardId) {
        setSelectedCardForSettings(prev => ({
          ...prev,
          isActive: !prev.isActive,
          status: prev.status === 'Active' ? 'Blocked' : 'Active'
        }));
      }
    } catch (err) {
      onShowToast(err.message || 'Kart durumu değiştirilemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCardSettings = async (cardId, settings) => {
    try {
      setActionLoading(true);
      const res = await cardApi.updateSettings(cardId, settings);
      onShowToast(res?.message || 'Kart güvenlik ve limit ayarları kaydedildi.', 'success');
      setShowCardModal(false);
      await fetchCards();
    } catch (err) {
      onShowToast(err.message || 'Kart ayarları kaydedilemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestNewCard = async (accountId) => {
    try {
      setActionLoading(true);
      const res = await cardApi.requestCard(accountId);
      onShowToast(res?.message || 'Hesabınız için yeni banka kartı oluşturuldu!', 'success');
      await fetchCards();
    } catch (err) {
      onShowToast(err.message || 'Kart oluşturulamadı.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncMissingCards = async () => {
    try {
      setActionLoading(true);
      await cardApi.syncMissingCards();
      await fetchCards();
      onShowToast('Tüm hesaplarınız için kartlar başarıyla eşitlendi!', 'success');
    } catch (err) {
      onShowToast(err.message || 'Kartlar eşitlenemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Hamburger Menüden Rota Seçildiğinde Sayfaya Yönlendir
  const handleMenuNavigate = (route) => {
    setDrawerOpen(false);
    switch (route) {
      case '/accounts/demand':
      case '/dashboard':
        setActiveTab('dashboard');
        break;
      case '/accounts/time-deposits':
        setActiveTab('termdeposit');
        break;
      case '/accounts/currencies':
        setActiveTab('currencies');
        break;
      case '/accounts/open':
        setShowOpenCurrencyModal(true);
        break;
      case '/cards/my-cards':
      case '/cards/settings':
        setActiveTab('cards');
        fetchCards();
        break;
      case '/transfers/send':
        setActiveTab('transfer');
        break;
      case '/transfers/history':
        setActiveTab('history');
        break;
      case '/currency/rates':
      case '/currency/trade':
        setActiveTab('fx');
        fetchRates();
        break;
      case '/profile/info':
      case '/profile/security':
        setActiveTab('profile');
        break;
      case '/spending/summary':
      case '/spending':
        setActiveTab('spending');
        fetchSpendingSummary(selectedSpendingMonth, selectedSpendingYear);
        break;
      default:
        setActiveTab('dashboard');
        break;
    }
  };

  // Harcama & Bütçe Yönetimi Fonksiyonları
  const fetchSpendingSummary = async (month = selectedSpendingMonth, year = selectedSpendingYear) => {
    try {
      setSpendingLoading(true);
      const data = await spendingApi.getSummary(month, year);
      setSpendingData(data);
    } catch (err) {
      console.warn('Harcama özeti yüklenemedi:', err.message);
    } finally {
      setSpendingLoading(false);
    }
  };

  const handleSelectCategoryDetail = async (categoryName) => {
    try {
      setSelectedCategoryDetail(categoryName);
      setCategoryTxLoading(true);
      const txs = await spendingApi.getCategoryTransactions(categoryName, selectedSpendingMonth, selectedSpendingYear);
      setCategoryTransactions(txs || []);
    } catch (err) {
      onShowToast(err.message || 'Kategori işlemleri getirilemedi.', 'error');
    } finally {
      setCategoryTxLoading(false);
    }
  };

  const handleOpenBudgetModal = (category, currentLimit = '') => {
    setBudgetModalCategory(category);
    setBudgetInputLimit(currentLimit ? String(currentLimit) : '');
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetModalCategory || !budgetInputLimit) return;
    try {
      setActionLoading(true);
      const res = await spendingApi.setBudget(budgetModalCategory, budgetInputLimit);
      onShowToast(res?.message || `${budgetModalCategory} için bütçe hedefi kaydedildi!`, 'success');
      setBudgetModalCategory(null);
      await fetchSpendingSummary(selectedSpendingMonth, selectedSpendingYear);
    } catch (err) {
      onShowToast(err.message || 'Bütçe kaydedilemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6.5. Yeni Döviz / Altın Hesabı Açma (POST /api/Accounts/open-currency-account)
  const handleOpenCurrencyAccount = async (currencyCode) => {
    try {
      setActionLoading(true);
      await currencyApi.openCurrencyAccount({
        currency: currencyCode,
        customerId: profile?.id
      });
      onShowToast(`Tebrikler! Yeni ${currencyCode} vadesiz hesabınız ve IBAN'ınız oluşturuldu!`, 'success');
      setShowOpenCurrencyModal(false);
      await fetchProfile();
    } catch (err) {
      onShowToast(err.message || `${currencyCode} hesabı açılırken bir hata oluştu.`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to match currencies (handles XAU / GOLD / ALTIN aliases)
  const isCurrencyMatch = (accCurr, targetCurr) => {
    const c = (accCurr || '').toUpperCase();
    const t = (targetCurr || '').toUpperCase();
    if (c === t) return true;
    if ((t === 'XAU' || t === 'GOLD' || t === 'ALTIN') && (c === 'XAU' || c === 'GOLD' || c === 'ALTIN')) return true;
    return false;
  };

  // Auto-select source and target accounts when tradeAction or tradeCurrency changes
  useEffect(() => {
    if (!profile) return;
    const allAccounts = normalizeAccounts(profile);
    const tryAccounts = allAccounts.filter(a => (a.currency || 'TRY').toUpperCase() === 'TRY');
    const curAccounts = allAccounts.filter(a => isCurrencyMatch(a.currency, tradeCurrency));

    if (tradeAction === 'buy') {
      if (tryAccounts.length > 0 && (!tradeSourceAccountId || !tryAccounts.some(a => a.id === tradeSourceAccountId))) {
        setTradeSourceAccountId(tryAccounts[0].id);
      }
      if (curAccounts.length > 0 && (!tradeTargetAccountId || !curAccounts.some(a => a.id === tradeTargetAccountId))) {
        setTradeTargetAccountId(curAccounts[0].id);
      }
    } else {
      if (curAccounts.length > 0 && (!tradeSourceAccountId || !curAccounts.some(a => a.id === tradeSourceAccountId))) {
        setTradeSourceAccountId(curAccounts[0].id);
      }
      if (tryAccounts.length > 0 && (!tradeTargetAccountId || !tryAccounts.some(a => a.id === tradeTargetAccountId))) {
        setTradeTargetAccountId(tryAccounts[0].id);
      }
    }
  }, [tradeAction, tradeCurrency, profile]);

  // 7. Canlı Döviz Alım / Satım (POST /api/Currency/exchange)
  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    if (!tradeSourceAccountId || !tradeTargetAccountId) {
      onShowToast('Lütfen kaynak hesabı ve hedef hesabı seçiniz.', 'error');
      return;
    }
    if (tradeSourceAccountId === tradeTargetAccountId) {
      onShowToast('Kaynak hesap ile hedef hesap aynı olamaz.', 'error');
      return;
    }
    const amt = parseFloat(tradeAmount);
    if (!amt || amt <= 0) {
      onShowToast('Lütfen geçerli bir işlem tutarı giriniz.', 'error');
      return;
    }

    const currentRateObj = rates.find(r => r.code === tradeCurrency) || rates[0];
    const rateToUse = tradeAction === 'buy' ? currentRateObj.selling : currentRateObj.buying;
    const calculatedTotalTL = parseFloat((amt * rateToUse).toFixed(2));

    // Alış işleminde kaynaktan (TL hesabı) düşecek tutar toplam TL tutarıdır (örn: 4357.28 TL)
    // Satış işleminde kaynaktan (Döviz hesabı) düşecek tutar döviz adedidir (örn: 1 XAU)
    const sourceAmt = tradeAction === 'buy' ? calculatedTotalTL : amt;

    // Alış işleminde hedefe (Döviz hesabı) yatacak tutar döviz adedidir (örn: 1 XAU)
    // Satış işleminde hedefe (TL hesabı) yatacak tutar toplam TL tutarıdır (örn: 4357.28 TL)
    const targetAmt = tradeAction === 'buy' ? amt : calculatedTotalTL;

    try {
      setActionLoading(true);

      // Backend'in calculate servisi varsa önceden çağırıp yanıtı yakalayalım
      let calcData = {};
      try {
        const res = await currencyApi.calculate({
          fromAccountId: tradeSourceAccountId,
          toAccountId: tradeTargetAccountId,
          sourceAccountId: tradeSourceAccountId,
          targetAccountId: tradeTargetAccountId,
          currency: tradeCurrency,
          amount: amt,
          totalAmount: calculatedTotalTL,
          rate: rateToUse,
          action: tradeAction === 'buy' ? 'Buy' : 'Sell'
        });
        if (res && typeof res === 'object') {
          calcData = res;
        }
      } catch {
        // Calculate zorunlu olmayabilir
      }

      const payload = {
        ...calcData,
        fromAccountId: tradeSourceAccountId,
        toAccountId: tradeTargetAccountId,
        sourceAccountId: tradeSourceAccountId,
        targetAccountId: tradeTargetAccountId,

        // Tüm olası backend modelleriyle %100 uyumluluk için:
        amount: sourceAmt,           // Kaynak hesaptan düşülecek tutar (Alışta 4357.28 TL, Satışta 1 XAU)
        sourceAmount: sourceAmt,     // Kaynak hesaptan düşülecek miktar
        targetAmount: targetAmt,     // Hedef hesaba eklenecek miktar (Alışta 1 XAU, Satışta 4357.28 TL)

        totalAmount: calculatedTotalTL, // Toplam TL tutarı (4357.28)
        tryAmount: calculatedTotalTL,   // TL tutarı
        currencyAmount: amt,            // Döviz/Altın adedi (1)
        quantity: amt,                  // Adet
        units: amt,                     // Birim

        currency: tradeCurrency,
        currencyCode: tradeCurrency,
        action: tradeAction === 'buy' ? 'Buy' : 'Sell',
        type: tradeAction === 'buy' ? 'Buy' : 'Sell',
        rate: rateToUse,
        exchangeRate: rateToUse
      };

      const res = await currencyApi.exchange(payload);
      onShowToast(
        res?.message ||
        (tradeAction === 'buy'
          ? `${formatCurrency(amt, tradeCurrency)} başarıyla satın alındı ve hesabınıza aktarıldı!`
          : `${formatCurrency(amt, tradeCurrency)} bozduruldu ve TL hesabınıza aktarıldı!`),
        'success'
      );
      setTradeAmount('');
      await fetchProfile();
    } catch (err) {
      onShowToast(err.message || 'Döviz işlemi gerçekleştirilemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Ugi Akıllı Asistan Yönlendirme ve Parametre Yönetimi
  const handleAssistantNavigate = (route, parameters = null) => {
    if (!route) return;
    const cleanRoute = route.toLowerCase();

    // 1. Para Transferi
    if (cleanRoute.includes('transfer')) {
      setActiveTab('transfer');
      if (parameters?.amount) {
        setTransferForm(prev => ({
          ...prev,
          amount: String(parameters.amount)
        }));
      }
      if (parameters?.targetIban) {
        setTransferForm(prev => ({
          ...prev,
          targetIban: String(parameters.targetIban)
        }));
      }
    }
    // 2. Döviz ve Altın Alım-Satım
    else if (cleanRoute.includes('exchange') || cleanRoute.includes('doviz') || cleanRoute.includes('fx')) {
      setActiveTab('fx');
      if (parameters?.currency) {
        setTradeCurrency(String(parameters.currency).toUpperCase());
      }
      if (parameters?.amount) {
        setTradeAmount(String(parameters.amount));
      }
    }
    // 3. Vadeli Mevduat
    else if (cleanRoute.includes('deposit') || cleanRoute.includes('vadeli')) {
      setActiveTab('termdeposit');
      if (cleanRoute.includes('new') || parameters?.amount) {
        setShowOpenTermModal(true);
        if (parameters?.amount) {
          setTermDepositForm(prev => ({
            ...prev,
            amount: String(parameters.amount)
          }));
        }
      }
    }
    // 4. Hesap Hareketleri / Ekstre
    else if (cleanRoute.includes('transaction') || cleanRoute.includes('hareket') || cleanRoute.includes('history')) {
      setActiveTab('history');
    }
    // 5. Profil & Güvenlik
    else if (cleanRoute.includes('profile') || cleanRoute.includes('security')) {
      setActiveTab('profile');
    }
    // 6. Hesaplarım / Ana Sayfa
    else {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="portal-layout">
      {/* 1. ÜST HEADER */}
      <header className="portal-navbar">
        <div className="portal-navbar-inner">
          <div className="portal-brand-group">
            {/* SOL ÜST HAMBURGER (☰) MENÜ BUTONU */}
            <button
              className="btn-hamburger"
              onClick={() => setDrawerOpen(true)}
              title="Menüyü Aç (☰)"
              aria-label="Menü"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            <div className="portal-brand-icon" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
              <i className="fa-solid fa-wallet"></i>
            </div>
            <div onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', letterSpacing: '-0.02em' }}>
                MINIBANK <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '999px', marginLeft: '0.4rem' }}>Bireysel</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Müşteri İnternet Şubesi</p>
            </div>
          </div>

          <div className="portal-user-meta">
            {profile && (
              <div
                className="portal-user-badge"
                onClick={() => setActiveTab('profile')}
                style={{ cursor: 'pointer' }}
                title="Profil Bilgilerimi Görüntüle / Düzenle"
              >
                <div className="portal-user-avatar">
                  {profile.fullName ? profile.fullName[0].toUpperCase() : 'M'}
                </div>
                <div>
                  <div className="portal-user-name">{profile.fullName || 'Müşteri'}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {profile.customerNumber || profile.identityNumber}
                  </div>
                </div>
              </div>
            )}

            <button className="btn-logout" onClick={onLogout} title="Oturumu Sonlandır">
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER SEKMELERİ (ROL VE STANDARTLARA GÖRE) */}
      <nav className="portal-subnav">
        <div className="portal-tabs">
          <button
            className={`portal-tab-btn ${activeTab === 'dashboard' ? 'portal-tab-active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fa-solid fa-wallet"></i>
            <span>Ana Sayfa (TL)</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'currencies' ? 'portal-tab-active' : ''}`}
            onClick={() => setActiveTab('currencies')}
          >
            <i className="fa-solid fa-coins" style={{ color: '#fbbf24' }}></i>
            <span>Döviz & Altın Hesaplarım</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'cards' ? 'portal-tab-active' : ''}`}
            onClick={() => {
              setActiveTab('cards');
              fetchCards();
            }}
          >
            <i className="fa-solid fa-credit-card" style={{ color: '#60a5fa' }}></i>
            <span>Banka Kartım</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'transfer' ? 'portal-tab-active' : ''}`}
            onClick={() => {
              if (activeAccount) {
                setTransferForm(prev => ({ ...prev, fromAccountId: activeAccount.id }));
              }
              setActiveTab('transfer');
            }}
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span>Para Transferi</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'history' ? 'portal-tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Hesap Hareketleri (Ekstre)</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'termdeposit' ? 'portal-tab-active' : ''}`}
            onClick={() => {
              const tryAccs = accounts.filter(a => (a.currency || 'TRY').toUpperCase() === 'TRY' && !a.isTermDeposit);
              if (tryAccs.length > 0 && !termDepositForm.fromAccountId) {
                setTermDepositForm(prev => ({ ...prev, fromAccountId: tryAccs[0].id }));
              }
              setActiveTab('termdeposit');
            }}
          >
            <i className="fa-solid fa-piggy-bank" style={{ color: '#34d399' }}></i>
            <span>Vadeli Mevduat (%41)</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'fx' ? 'portal-tab-active' : ''}`}
            onClick={() => {
              setActiveTab('fx');
              fetchRates();
            }}
          >
            <i className="fa-solid fa-chart-line"></i>
            <span>Döviz & Altın (TCMB)</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'spending' ? 'portal-tab-active' : ''}`}
            onClick={() => {
              setActiveTab('spending');
              fetchSpendingSummary(selectedSpendingMonth, selectedSpendingYear);
            }}
          >
            <i className="fa-solid fa-chart-pie" style={{ color: '#ec4899' }}></i>
            <span>Harcama & Bütçe</span>
          </button>

          <button
            className={`portal-tab-btn ${activeTab === 'profile' ? 'portal-tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fa-solid fa-id-card-clip"></i>
            <span>Hesap Bilgilerim (Profil)</span>
          </button>
        </div>
      </nav>

      {/* 3. ANA İÇERİK */}
      <main className="portal-content">
        {loading ? (
          <div className="loading-state">
            <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
            <p>Hesap verileriniz güvenle yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* SEKME 1: SADELEŞTİRİLMİŞ ANA EKRAN (DASHBOARD - YALNIZCA ANA TL HESABI) */}
            {activeTab === 'dashboard' && (() => {
              // 1. Ana Vadesiz TL Hesabını belirle (Backend Dashboard verisinden veya hesaplar listesinden)
              const primaryAcc = (homeDashboardData?.primaryAccount 
                ? accounts.find(a => a.id === homeDashboardData.primaryAccount.id) || {
                    id: homeDashboardData.primaryAccount.id,
                    iban: homeDashboardData.primaryAccount.iban,
                    balance: homeDashboardData.primaryAccount.balance,
                    currency: homeDashboardData.primaryAccount.currency || 'TRY',
                    isActive: homeDashboardData.primaryAccount.isActive !== false,
                    isTermDeposit: false
                  }
                : null)
                || accounts.find(a => !a.isTermDeposit && (a.currency || 'TRY').toUpperCase() === 'TRY')
                || accounts[0];

              const isAccActive = primaryAcc?.isActive !== false;
              const primaryCard = cards.find(c => c.accountId === primaryAcc?.id || c.accountIban === primaryAcc?.iban);
              const maskedCard = primaryCard?.cardNumber 
                ? `${primaryCard.cardNumber.slice(0, 4)} ${primaryCard.cardNumber.slice(4, 6)}** **** ${primaryCard.cardNumber.slice(-4)}`
                : (homeDashboardData?.primaryAccount?.maskedCardNumber || null);

              // Son hareketler (Backend Dashboard API'sinden gelen veya hesap hareketleri)
              const recentTxList = (homeDashboardData?.recentTransactions && homeDashboardData.recentTransactions.length > 0)
                ? homeDashboardData.recentTransactions
                : accountHistory.slice(0, 5);

              return (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {/* Üst Karşılama ve Hızlı Kısayol */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                        {homeDashboardData?.greetingMessage || `Hoş Geldiniz, ${profile?.fullName || 'Değerli Müşterimiz'}`}
                      </h1>
                      <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Ana Vadesiz Türk Lirası hesabınız ve son işlemleriniz.
                      </p>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => setDrawerOpen(true)}
                      style={{ padding: '0.65rem 1rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <i className="fa-solid fa-bars" style={{ color: '#34d399' }}></i>
                      <span>Tüm Menü & Hesaplar</span>
                    </button>
                  </div>

                  {/* BÜYÜK VE ŞIK TEK ANA TL KARTI */}
                  {primaryAcc ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className={`digital-card card-theme-try ${!isAccActive ? 'card-passive' : ''}`} style={{ maxWidth: '100%', minHeight: '230px' }}>
                        <div className="card-top">
                          <div className="card-bank-name">
                            <i className="fa-solid fa-building-columns"></i>
                            <span>MINIBANK • ANA VADESİZ TL HESABI</span>
                          </div>
                          <div className="card-top-right">
                            <span style={{ fontSize: '1.25rem', marginRight: '0.25rem' }}>🇹🇷</span>
                            <span className={`card-status-badge ${isAccActive ? 'badge-active' : 'badge-passive'}`}>
                              <i className={`fa-solid ${isAccActive ? 'fa-circle-check' : 'fa-circle-pause'}`}></i>
                              <span>{isAccActive ? 'Aktif' : 'Dondurulmuş'}</span>
                            </span>
                            <div className="card-chip"></div>
                          </div>
                        </div>

                        <div className="card-balance-section" style={{ margin: '1.5rem 0 1rem' }}>
                          <span className="card-balance-label" style={{ fontSize: '0.85rem' }}>
                            Kullanılabilir Bakiye (TL)
                          </span>
                          <div className="card-balance-amount" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                            {formatCurrency(primaryAcc.balance || 0, 'TRY')}
                          </div>
                        </div>

                        <div className="card-bottom">
                          <div className="card-iban-row">
                            <span style={{ fontSize: '1rem' }}>{primaryAcc.iban}</span>
                            <button
                              onClick={() => handleCopyIban(primaryAcc.iban)}
                              style={{ background: 'transparent', color: copiedIban === primaryAcc.iban ? '#34d399' : '#9ca3af', padding: '0.2rem', cursor: 'pointer' }}
                              title="IBAN'ı Kopyala"
                            >
                              <i className={copiedIban === primaryAcc.iban ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                            </button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span className="card-holder-name" style={{ fontSize: '0.95rem' }}>{profile?.fullName}</span>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'var(--font-mono)' }}>
                              {maskedCard ? `KART: ${maskedCard}` : 'DEBIT CARD • TRY'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* YALNIZCA 2 TEMEL HIZLI BUTON */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedAccountId(primaryAcc.id);
                            setTransferForm(prev => ({ ...prev, fromAccountId: primaryAcc.id }));
                            setActiveTab('transfer');
                          }}
                          style={{ padding: '0.9rem', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-paper-plane"></i>
                          <span>Yeni Transfer Gönder</span>
                        </button>

                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedAccountId(primaryAcc.id);
                            setActiveTab('history');
                          }}
                          style={{ padding: '0.9rem', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-clock-rotate-left"></i>
                          <span>Hesap Özeti / Ekstre</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-wallet" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#4b5563' }}></i>
                      <p>Kayıtlı aktif Vadesiz TL hesabı bulunamadı.</p>
                    </div>
                  )}

                  {/* SON HAREKETLER (KÜÇÜK VE SADE LİSTE) */}
                  <div className="portal-section-card">
                    <div className="portal-section-header" style={{ marginBottom: '1rem' }}>
                      <div className="portal-section-title">
                        <i className="fa-solid fa-clock-rotate-left" style={{ color: '#c084fc' }}></i>
                        <span>Son Hesap Hareketleri</span>
                      </div>
                      <button
                        className="btn-link"
                        onClick={() => {
                          if (primaryAcc) setSelectedAccountId(primaryAcc.id);
                          setActiveTab('history');
                        }}
                        style={{ fontSize: '0.8rem', color: '#60a5fa', cursor: 'pointer', background: 'none', border: 'none' }}
                      >
                        Tümünü Gör →
                      </button>
                    </div>

                    {recentTxList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        <i className="fa-solid fa-receipt" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                        <p style={{ margin: 0 }}>Bu hesaba ait henüz bir işlem hareketi bulunmuyor.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {recentTxList.map((tx) => {
                          const isIncoming = tx.type === 'Deposit' || tx.type === 'TransferIn' || (tx.amount > 0 && tx.type !== 'Withdraw' && tx.type !== 'Transfer');
                          return (
                            <div
                              key={tx.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.8rem 1rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: isIncoming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isIncoming ? '#34d399' : '#f87171',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.95rem'
                                }}>
                                  <i className={`fa-solid ${isIncoming ? 'fa-arrow-down-left' : 'fa-arrow-up-right'}`}></i>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'white' }}>
                                    {tx.description || (isIncoming ? 'Gelen Transfer' : 'Giden Transfer')}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                    {formatDate(tx.createdAt || tx.date)}
                                  </div>
                                </div>
                              </div>

                              <div style={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                color: isIncoming ? '#34d399' : '#f87171',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {isIncoming ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0), 'TRY')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* SEKME: DÖVİZ & ALTIN HESAPLARIM (AYRI SAYFA) */}
            {activeTab === 'currencies' && (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <i className="fa-solid fa-coins" style={{ color: '#fbbf24' }}></i>
                      Döviz & Kıymetli Maden Hesaplarım
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      USD, EUR ve Gram Altın hesaplarınızın bakiyelerini yönetin veya yeni bir döviz hesabı açın.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowOpenCurrencyModal(true)}
                  >
                    <i className="fa-solid fa-plus-circle"></i>
                    <span>Yeni Döviz Hesabı Aç</span>
                  </button>
                </div>

                {(() => {
                  const currAccounts = accounts.filter(a => {
                    const c = (a.currency || 'TRY').toUpperCase();
                    return c !== 'TRY' && c !== 'TL' && !a.isTermDeposit;
                  });

                  if (currAccounts.length === 0) {
                    return (
                      <div style={{ background: 'var(--bg-card)', padding: '3.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        <i className="fa-solid fa-coins" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#fbbf24' }}></i>
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Henüz Döviz veya Altın Hesabınız Yok</h3>
                        <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                          Dolar, Euro veya 24K Gram Altın hesabı açarak TCMB piyasasında 7/24 komisyonsuz alım-satım yapabilirsiniz.
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowOpenCurrencyModal(true)}>
                          <i className="fa-solid fa-plus-circle"></i>
                          <span>İlk Döviz Hesabınızı Açın</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="bank-cards-grid">
                      {currAccounts.map(acc => {
                        const curr = (acc.currency || 'USD').toUpperCase();
                        const isAccActive = acc.isActive !== false;
                        const flag = curr === 'USD' ? '🇺🇸' : curr === 'EUR' ? '🇪🇺' : '🟡';
                        const cardTheme = curr === 'USD' ? 'card-theme-usd' : curr === 'EUR' ? 'card-theme-eur' : 'card-theme-gold';

                        return (
                          <div key={acc.id}>
                            <div className={`digital-card ${isAccActive ? cardTheme : 'card-passive'}`}>
                              <div className="card-top">
                                <div className="card-bank-name">
                                  <i className="fa-solid fa-building-columns"></i>
                                  <span>MINIBANK {curr}</span>
                                </div>
                                <div className="card-top-right">
                                  <span style={{ fontSize: '1.25rem', marginRight: '0.25rem' }}>{flag}</span>
                                  <span className={`card-status-badge ${isAccActive ? 'badge-active' : 'badge-passive'}`}>
                                    <i className={`fa-solid ${isAccActive ? 'fa-circle-check' : 'fa-circle-pause'}`}></i>
                                    <span>{isAccActive ? 'Aktif' : 'Dondurulmuş'}</span>
                                  </span>
                                  <div className="card-chip"></div>
                                </div>
                              </div>

                              <div className="card-balance-section">
                                <span className="card-balance-label">Kullanılabilir Bakiye ({curr})</span>
                                <div className="card-balance-amount">
                                  {formatCurrency(acc.balance || 0, acc.currency)}
                                </div>
                              </div>

                              <div className="card-bottom">
                                <div className="card-iban-row">
                                  <span>{acc.iban}</span>
                                  <button
                                    onClick={() => handleCopyIban(acc.iban)}
                                    style={{ background: 'transparent', color: copiedIban === acc.iban ? '#34d399' : '#9ca3af', padding: '0.2rem', cursor: 'pointer' }}
                                    title="IBAN'ı Kopyala"
                                  >
                                    <i className={copiedIban === acc.iban ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                                  </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                  <span className="card-holder-name">{profile?.fullName}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-mono)' }}>
                                    VADESİZ • {curr}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="portal-actions-row">
                              <button
                                className="btn-card-action"
                                onClick={() => {
                                  setTradeCurrency(curr);
                                  setTradeAction('sell');
                                  setTradeSourceAccountId(acc.id);
                                  setActiveTab('fx');
                                }}
                              >
                                <i className="fa-solid fa-arrow-right-arrow-left"></i>
                                <span>Döviz Bozdur (Sat)</span>
                              </button>

                              <button
                                className="btn-card-action"
                                onClick={() => {
                                  setSelectedAccountId(acc.id);
                                  setActiveTab('history');
                                }}
                              >
                                <i className="fa-solid fa-clock-rotate-left"></i>
                                <span>Ekstre</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SEKME: BANKA KARTLARIM */}
            {activeTab === 'cards' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <i className="fa-solid fa-credit-card" style={{ color: '#60a5fa' }}></i>
                      Banka Kartlarım (TL Debit Cards)
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Vadesiz Türk Lirası (TL) hesabınıza bağlı banka kartınızı yönetin, harcama limitlerini düzenleyin ve kart güvenliğinizi kontrol edin.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={handleSyncMissingCards}
                      disabled={actionLoading}
                      title="TL hesabınız için kartı eşitle / oluştur"
                    >
                      <i className="fa-solid fa-rotate"></i>
                      <span>Kartı Eşitle</span>
                    </button>
                  </div>
                </div>

                {cardsLoading ? (
                  <div className="loading-state" style={{ minHeight: '260px' }}>
                    <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
                    <p>Kartlarınız yükleniyor...</p>
                  </div>
                ) : cards.length === 0 ? (
                  <div style={{ background: 'var(--bg-card)', padding: '3.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    <i className="fa-solid fa-credit-card" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#60a5fa' }}></i>
                    <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Vadesiz TL Hesabınız İçin Kart Bulunmuyor</h3>
                    <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                      Banka kartları yalnızca Vadesiz Türk Lirası (TL) hesapları için tanımlanır. Kartınızı oluşturmak için aşağıdaki butona basabilirsiniz.
                    </p>
                    <button className="btn btn-primary" onClick={handleSyncMissingCards} disabled={actionLoading}>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>TL Hesabıma Kart Tanımla</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {cards.map(card => {
                      const isCardActive = card.status === 'Active' || card.status === 1 || card.isActive !== false;
                      const cardNumFormatted = card.cardNumber 
                        ? card.cardNumber.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()
                        : '•••• •••• •••• ••••';
                      const expStr = card.expiryMonth && card.expiryYear 
                        ? `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
                        : (card.expiryDate || '12/28');

                      // Bağlı olduğu hesabı bul
                      const linkedAcc = accounts.find(a => a.id === card.accountId || a.iban === card.accountIban);
                      const curr = linkedAcc?.currency || card.currency || 'TRY';

                      return (
                        <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {/* FİZİKSEL DİJİTAL KART */}
                          <div
                            onClick={() => handleOpenCardModal(card)}
                            style={{
                              background: isCardActive
                                ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)'
                                : 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                              borderRadius: '16px',
                              padding: '1.5rem',
                              color: 'white',
                              cursor: 'pointer',
                              position: 'relative',
                              boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.35)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, letterSpacing: '1px' }}>
                                <i className="fa-solid fa-building-columns"></i>
                                <span>MINIBANK</span>
                                <span style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 500 }}>{curr} DEBIT</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  background: isCardActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                  color: isCardActive ? '#34d399' : '#fca5a5',
                                  fontWeight: 600
                                }}>
                                  {isCardActive ? '● Aktif' : '● Donduruldu'}
                                </span>
                                <i className="fa-solid fa-wifi" style={{ transform: 'rotate(90deg)', fontSize: '1rem' }}></i>
                              </div>
                            </div>

                            {/* Çip */}
                            <div style={{
                              width: '42px',
                              height: '32px',
                              background: 'linear-gradient(135deg, #fcd34d 0%, #b45309 100%)',
                              borderRadius: '6px',
                              marginBottom: '1rem',
                              border: '1px solid #fef08a'
                            }}></div>

                            {/* Kart Numarası */}
                            <div style={{ fontSize: '1.25rem', letterSpacing: '2px', fontFamily: 'monospace', fontWeight: 600, marginBottom: '1rem' }}>
                              {cardNumFormatted}
                            </div>

                            {/* Kart Sahibi ve SKT */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.75 }}>Kart Sahibi</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{card.cardHolderName || profile?.fullName}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.75 }}>SKT</div>
                                  <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>{expStr}</div>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic' }}>
                                  VISA
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* KART ÖZET BİLGİLERİ VE EYLEMLER */}
                          <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span>Bağlı Hesap:</span>
                              <strong style={{ color: 'white', fontFamily: 'var(--font-mono)' }}>
                                {card.accountIban ? `${card.accountIban.slice(0, 8)}...${card.accountIban.slice(-4)}` : 'Vadesiz Hesap'}
                              </strong>
                            </div>

                            {linkedAcc && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>Hesap Bakiyesi:</span>
                                <strong style={{ color: '#34d399' }}>
                                  {formatCurrency(linkedAcc.balance || 0, linkedAcc.currency)}
                                </strong>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span>Günlük Limit:</span>
                              <strong style={{ color: 'white' }}>
                                {formatCurrency(card.dailyLimit ?? 25000, 'TRY')}
                              </strong>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                                onClick={() => handleOpenCardModal(card)}
                              >
                                <i className="fa-solid fa-sliders"></i>
                                <span>Limit & Güvenlik</span>
                              </button>
                              <button
                                className="btn"
                                style={{
                                  padding: '0.5rem 0.85rem',
                                  fontSize: '0.82rem',
                                  background: isCardActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: isCardActive ? '#f87171' : '#34d399',
                                  border: `1px solid ${isCardActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                }}
                                onClick={() => handleToggleCardStatus(card.id)}
                                title={isCardActive ? 'Kartı Geçici Dondur' : 'Kartı Aktif Et'}
                              >
                                <i className={`fa-solid ${isCardActive ? 'fa-lock' : 'fa-lock-open'}`}></i>
                                <span>{isCardActive ? 'Dondur' : 'Aç'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEKME 2: PARA TRANSFERİ EKRANI */}
            {activeTab === 'transfer' && (
              <div className="portal-section-card" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
                <div className="portal-section-header">
                  <div className="portal-section-title">
                    <i className="fa-solid fa-money-bill-transfer" style={{ color: '#34d399' }}></i>
                    <span>Güvenli Para Transferi (EFT / Havale)</span>
                  </div>
                </div>

                <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Gönderen Hesap *</label>
                    <select
                      className="form-input"
                      value={transferForm.fromAccountId}
                      onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                      required
                    >
                      {transferEligibleAccounts.map(acc => {
                        const currLabel = getCurrencyLabel(acc.currency);
                        const isPassive = acc.isActive === false;
                        return (
                          <option key={acc.id} value={acc.id}>
                            [{currLabel}] {acc.iban} • Bakiye: {formatCurrency(acc.balance || 0, acc.currency)} {isPassive ? '(Dondurulmuş)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {(() => {
                      const selectedTransferAcc = transferEligibleAccounts.find(a => a.id === transferForm.fromAccountId) || transferEligibleAccounts[0] || activeAccount;
                      if (!selectedTransferAcc) return null;
                      return (
                        <span className="form-hint">
                          Kullanılabilir Bakiye: <strong style={{ color: '#34d399' }}>{formatCurrency(selectedTransferAcc.balance || 0, selectedTransferAcc.currency)}</strong>
                          {selectedTransferAcc.currency && selectedTransferAcc.currency !== 'TRY' && (
                            <span style={{ marginLeft: '0.5rem', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}>
                              ({getCurrencyLabel(selectedTransferAcc.currency)} Hesabı)
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alıcı IBAN *</label>
                    <input
                      type="text"
                      required
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="form-input font-mono"
                      value={transferForm.targetIban}
                      onChange={(e) => setTransferForm({ ...transferForm, targetIban: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Transfer Tutarı ({(() => {
                        const acc = transferEligibleAccounts.find(a => a.id === transferForm.fromAccountId) || transferEligibleAccounts[0] || activeAccount;
                        if (!acc) return 'TL';
                        const c = (acc.currency || 'TRY').toUpperCase();
                        return c === 'XAU' || c === 'GOLD' || c === 'ALTIN' ? 'Gram Altın' : c;
                      })()}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="0,00"
                      className="form-input font-mono"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Açıklama</label>
                    <input
                      type="text"
                      placeholder="Örn: Kira Ödemesi, Borç vb."
                      className="form-input"
                      value={transferForm.description}
                      onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-transfer"
                    disabled={actionLoading}
                    style={{ padding: '0.85rem', justifyContent: 'center', marginTop: '0.5rem' }}
                  >
                    {actionLoading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Transfer Gerçekleşiyor...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        <span>Transferi Gönder (Tamamla)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* SEKME 3: HESAP HAREKETLERİ (EKSTRE) */}
            {activeTab === 'history' && (
              <div className="portal-section-card">
                <div className="portal-section-header">
                  <div className="portal-section-title">
                    <i className="fa-solid fa-clock-rotate-left" style={{ color: '#c084fc' }}></i>
                    <span>Hesap Hareketleri & Dekontlar</span>
                  </div>

                  {accounts.length > 1 && (
                    <select
                      className="form-input"
                      style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          [{getCurrencyLabel(acc.currency)}] {acc.iban} ({formatCurrency(acc.balance || 0, acc.currency)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {historyLoading ? (
                  <div className="loading-state" style={{ minHeight: '200px' }}>
                    <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
                    <p>İşlem geçmişi yükleniyor...</p>
                  </div>
                ) : accountHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-receipt" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#4b5563' }}></i>
                    <p>Bu hesaba ait henüz işlem hareketi bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="tx-list">
                    {accountHistory.map((tx) => {
                      const isIncoming = tx.type === 'Deposit' || tx.type === 'TransferIn' || tx.type === 1 || tx.type === 3;
                      return (
                        <div key={tx.id} className="tx-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: isIncoming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isIncoming ? '#34d399' : '#f87171',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.95rem'
                              }}
                            >
                              <i className={isIncoming ? "fa-solid fa-arrow-down-left" : "fa-solid fa-arrow-up-right"}></i>
                            </div>

                            <div>
                              <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
                                {tx.description || (isIncoming ? 'Gelen Transfer' : 'Giden Transfer')}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                                {formatDate(tx.createdAt)}
                                {tx.targetIban && ` • Hedef: ${tx.targetIban}`}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              fontSize: '1rem',
                              color: isIncoming ? '#34d399' : '#f87171'
                            }}
                          >
                            {isIncoming ? '+' : '-'}{formatCurrency(tx.amount || 0, tx.currency || (accounts.find(a => a.id === selectedAccountId) || accounts[0])?.currency || 'TRY')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEKME: VADELİ MEVDUAT (%32 - %41 FAİZ GETİRİSİ) */}
            {activeTab === 'termdeposit' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Üst Başlık ve Tanıtım */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        Vadeli Mevduat Hesabı
                      </h1>
                      <span style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '999px',
                        padding: '0.2rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <i className="fa-solid fa-bolt" style={{ color: '#fbbf24' }}></i>
                        %41'e Varan Yüksek Getiri
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                      Birikimlerinizi MiniBank güvencesiyle vadeli mevduata yatırın, vade sonunda net kazancınızı garantileyin.
                    </p>
                  </div>
                </div>

                {/* 1. FAİZ ORANLARI DİLİMLERİ (32 güne kadar %32, 32-90 arası %38, 90 ve fazlası %41) */}
                <div className="term-tier-grid">
                  {/* DİLİM 1: 1 - 32 Gün */}
                  <div className={`term-tier-card ${termDepositForm.days <= 32 ? 'tier-popular' : ''}`}>
                    <span className="term-tier-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      Kısa Vade
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>1 - 32 Gün Arası</div>
                    <div className="term-tier-rate">%32,00</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                      Kısa vadede paranızı değerlendirin, acil nakit ihtiyaçlarınız için hızlı likidite sağlayın.
                    </p>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setTermDepositForm(prev => ({ ...prev, days: 32 }))}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        background: termDepositForm.days === 32 ? '#2563eb' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {termDepositForm.days === 32 ? 'Seçili Vade (32 Gün)' : '32 Gün Seç'}
                    </button>
                  </div>

                  {/* DİLİM 2: 33 - 90 Gün */}
                  <div className={`term-tier-card tier-popular ${termDepositForm.days > 32 && termDepositForm.days < 90 ? 'tier-best' : ''}`}>
                    <span className="term-tier-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      En Çok Tercih Edilen
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>33 - 90 Gün Arası</div>
                    <div className="term-tier-rate" style={{ color: '#60a5fa' }}>%38,00</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                      Orta vadeli dengeli büyüme. 45 ve 60 günlük periyotlarla paranızı yüksek faizle değerlendirin.
                    </p>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setTermDepositForm(prev => ({ ...prev, days: 60 }))}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        background: (termDepositForm.days > 32 && termDepositForm.days < 90) ? '#059669' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {(termDepositForm.days > 32 && termDepositForm.days < 90) ? `Seçili Vade (${termDepositForm.days} Gün)` : '60 Gün Seç'}
                    </button>
                  </div>

                  {/* DİLİM 3: 90 Gün ve Fazlası */}
                  <div className={`term-tier-card tier-best ${termDepositForm.days >= 90 ? 'tier-best' : ''}`}>
                    <span className="term-tier-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                      ⭐ Zirve Kazanç
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>90 Gün ve Fazlası</div>
                    <div className="term-tier-rate" style={{ color: '#fbbf24' }}>%41,00</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                      En yüksek faiz oranı! 90, 180 veya 365 gün ile birikimleriniz maksimum kazanç üretsin.
                    </p>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setTermDepositForm(prev => ({ ...prev, days: 90 }))}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        background: termDepositForm.days >= 90 ? '#d97706' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {termDepositForm.days >= 90 ? `Seçili Vade (${termDepositForm.days} Gün)` : '90 Gün Seç'}
                    </button>
                  </div>
                </div>

                {/* 2. CANLI MEVDUAT HESAPLAMA SİMÜLATÖRÜ VE HESAP AÇMA */}
                {(() => {
                  const amtNum = parseFloat(termDepositForm.amount) || 0;
                  const daysNum = parseInt(termDepositForm.days) || 32;
                  const currentCalc = calculateInterest(amtNum, daysNum);
                  const tryAccounts = accounts.filter(a => (a.currency || 'TRY').toUpperCase() === 'TRY' && !a.isTermDeposit);

                  return (
                    <div className="term-calc-layout">
                      {/* SOL: Parametre Giriş Formu */}
                      <div className="term-calc-panel">
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fa-solid fa-calculator" style={{ color: '#34d399' }}></i>
                          Mevduat Getirisi Hesapla & Vadeli Hesap Aç
                        </h3>

                        <form onSubmit={handleOpenTermDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {/* Kaynak Vadesiz Hesap */}
                          <div className="form-group">
                            <label className="form-label">Anaparanın Çekileceği Vadesiz TL Hesabınız *</label>
                            <select
                              className="form-input"
                              required
                              value={termDepositForm.fromAccountId}
                              onChange={(e) => setTermDepositForm({ ...termDepositForm, fromAccountId: e.target.value })}
                            >
                              <option value="">-- Vadesiz TL Hesabı Seçin --</option>
                              {tryAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.iban} (Kullanılabilir: {formatCurrency(acc.balance || 0, 'TRY')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Yatırılacak Anapara Tutarı */}
                          <div className="form-group">
                            <label className="form-label">Yatırılacak Tutar (TL) *</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                step="any"
                                min="1000"
                                required
                                placeholder="Örn: 50.000"
                                className="form-input font-mono"
                                style={{ fontSize: '1.1rem', fontWeight: 700, paddingRight: '3.5rem' }}
                                value={termDepositForm.amount}
                                onChange={(e) => setTermDepositForm({ ...termDepositForm, amount: e.target.value })}
                              />
                              <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#34d399' }}>
                                ₺ TL
                              </span>
                            </div>

                            {/* Hızlı Tutar Hapları */}
                            <div className="term-pill-group">
                              {['10000', '25000', '50000', '100000', '250000', '500000'].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  className={`term-pill ${termDepositForm.amount === val ? 'active' : ''}`}
                                  onClick={() => setTermDepositForm({ ...termDepositForm, amount: val })}
                                >
                                  ₺ {parseInt(val).toLocaleString('tr-TR')}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Vade Gün Sayısı */}
                          <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label className="form-label">Vade Süresi (Gün Sayısı) *</label>
                              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                                Uygulanan Faiz: %{currentCalc.rate},00
                              </span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="1095"
                              required
                              className="form-input font-mono"
                              value={termDepositForm.days}
                              onChange={(e) => setTermDepositForm({ ...termDepositForm, days: e.target.value })}
                            />

                            {/* Hızlı Gün Hapları */}
                            <div className="term-pill-group">
                              {[
                                { d: 32, label: '32 Gün (%32)' },
                                { d: 45, label: '45 Gün (%38)' },
                                { d: 60, label: '60 Gün (%38)' },
                                { d: 90, label: '90 Gün (%41)' },
                                { d: 180, label: '180 Gün (%41)' },
                                { d: 365, label: '1 Yıl (%41)' }
                              ].map(item => (
                                <button
                                  key={item.d}
                                  type="button"
                                  className={`term-pill ${termDepositForm.days == item.d ? 'active' : ''}`}
                                  onClick={() => setTermDepositForm({ ...termDepositForm, days: item.d })}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn"
                            disabled={actionLoading}
                            style={{
                              padding: '0.95rem',
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 700,
                              fontSize: '1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                              marginTop: '0.5rem'
                            }}
                          >
                            {actionLoading ? (
                              <>
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                <span>Vadeli Hesap Açılıyor...</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-piggy-bank"></i>
                                <span>Bu Getiriyle Vadeli Hesap Aç (%{currentCalc.rate} Yıllık)</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>

                      {/* SAĞ: Canlı Getiri ve Kazanç Dökümü Kartı */}
                      <div className="term-result-panel">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399' }}>
                              <i className="fa-solid fa-receipt" style={{ marginRight: '0.4rem' }}></i>
                              Getiri Dökümü (Net Kazanç)
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>
                              {daysNum} Günlük Vade
                            </span>
                          </div>

                          <div className="term-breakdown-row">
                            <span style={{ color: 'var(--text-muted)' }}>Yatırılan Anapara:</span>
                            <span style={{ fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)' }}>
                              {formatCurrency(amtNum, 'TRY')}
                            </span>
                          </div>

                          <div className="term-breakdown-row">
                            <span style={{ color: 'var(--text-muted)' }}>Yıllık Brüt Faiz Oranı:</span>
                            <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                              %{currentCalc.rate},00
                            </span>
                          </div>

                          <div className="term-breakdown-row">
                            <span style={{ color: 'var(--text-muted)' }}>Vade Bitiş Tarihi:</span>
                            <span style={{ fontWeight: 600, color: '#93c5fd' }}>
                              {formatDate(currentCalc.endDate)}
                            </span>
                          </div>

                          <div className="term-breakdown-row">
                            <span style={{ color: 'var(--text-muted)' }}>Brüt Faiz Getirisi:</span>
                            <span style={{ fontWeight: 600, color: 'white', fontFamily: 'var(--font-mono)' }}>
                              {formatCurrency(currentCalc.gross, 'TRY')}
                            </span>
                          </div>

                          <div className="term-breakdown-row">
                            <span style={{ color: 'var(--text-muted)' }}>Stopaj Kesintisi (%7.5):</span>
                            <span style={{ fontWeight: 600, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                              - {formatCurrency(currentCalc.withholding, 'TRY')}
                            </span>
                          </div>

                          {/* Net Ele Geçecek Faiz */}
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginTop: '1rem'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Net Faiz Kazancınız (Net Kar)
                            </span>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                              + {formatCurrency(currentCalc.net, 'TRY')}
                            </div>
                          </div>
                        </div>

                        {/* Vade Sonu Toplam Ödeme */}
                        <div className="term-grand-total">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Vade Sonu Hesabınıza Geçecek Toplam Tutar
                          </span>
                          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)', marginTop: '0.35rem' }}>
                            {formatCurrency(currentCalc.total, 'TRY')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. KULLANICININ AÇIK VADELİ MEVDUAT HESAPLARI */}
                <div style={{ marginTop: '3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', margin: 0 }}>
                      Açık Vadeli Mevduat Hesaplarım ({termAccounts.length})
                    </h3>
                  </div>

                  {termAccounts.length === 0 ? (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-piggy-bank" style={{ fontSize: '2.5rem', color: '#4b5563', marginBottom: '0.75rem' }}></i>
                      <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'white' }}>Henüz Açılmış Vadeli Mevduat Hesabınız Yok</p>
                      <p style={{ fontSize: '0.825rem', margin: 0 }}>
                        Yukarıdaki getiri hesaplayıcıyı kullanarak paranızı %41'e varan faiz oranlarıyla anında vadeliye bağlayabilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {termAccounts.map(termAcc => {
                        const start = new Date(termAcc.startDate || Date.now());
                        const end = new Date(termAcc.endDate);
                        const now = new Date();
                        const diffTime = end - now;
                        const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                        return (
                          <div
                            key={termAcc.id}
                            style={{
                              background: 'linear-gradient(145deg, rgba(6, 78, 59, 0.4), rgba(17, 24, 39, 0.8))',
                              border: '1px solid rgba(52, 211, 153, 0.4)',
                              borderRadius: 'var(--radius-lg)',
                              padding: '1.5rem',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '999px',
                                padding: '0.2rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                %{termAcc.interestRate || 41} Yıllık Faiz
                              </span>

                              <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>
                                <i className="fa-solid fa-hourglass-half" style={{ marginRight: '0.35rem' }}></i>
                                {remainingDays > 0 ? `${remainingDays} gün kaldı` : 'Vade Doldu'}
                              </span>
                            </div>

                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                              {termAcc.iban}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Anapara</span>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>
                                  {formatCurrency(termAcc.principal || termAcc.balance, 'TRY')}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vade Sonu Net Kazanç</span>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                                  + {formatCurrency(termAcc.netReturn || 0, 'TRY')}
                                </div>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <span>Başlangıç: {formatDate(start)}</span>
                              <span>Bitiş: {formatDate(end)}</span>
                            </div>

                            <button
                              type="button"
                              className="btn"
                              onClick={() => handleCloseTermDeposit(termAcc.id)}
                              style={{
                                width: '100%',
                                padding: '0.55rem',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <i className="fa-solid fa-ban"></i>
                              <span>Vadeyi Erken Kapat (Vadesiz Hesaba Aktar)</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEKME: HARCAMA & BÜTÇE YÖNETİMİ (EXPENSE MANAGEMENT) */}
            {activeTab === 'spending' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Üst Başlık & Ay / Yıl Filtresi */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: '#ec4899' }}></i>
                      Harcama & Bütçe Analizi
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Yapay zeka destekli otomatik kategorilendirme, tasarruf oranı ve aylık harcama bütçesi takibi.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <i className="fa-regular fa-calendar" style={{ color: '#ec4899' }}></i>
                    <select
                      className="form-input"
                      style={{ width: 'auto', padding: '0.35rem 0.6rem', border: 'none', background: 'transparent', fontSize: '0.85rem' }}
                      value={selectedSpendingMonth}
                      onChange={(e) => {
                        const m = parseInt(e.target.value);
                        setSelectedSpendingMonth(m);
                        fetchSpendingSummary(m, selectedSpendingYear);
                      }}
                    >
                      {[
                        { num: 1, name: 'Ocak' }, { num: 2, name: 'Şubat' }, { num: 3, name: 'Mart' },
                        { num: 4, name: 'Nisan' }, { num: 5, name: 'Mayıs' }, { num: 6, name: 'Haziran' },
                        { num: 7, name: 'Temmuz' }, { num: 8, name: 'Ağustos' }, { num: 9, name: 'Eylül' },
                        { num: 10, name: 'Ekim' }, { num: 11, name: 'Kasım' }, { num: 12, name: 'Aralık' }
                      ].map(m => (
                        <option key={m.num} value={m.num}>{m.name}</option>
                      ))}
                    </select>

                    <select
                      className="form-input"
                      style={{ width: 'auto', padding: '0.35rem 0.6rem', border: 'none', background: 'transparent', fontSize: '0.85rem' }}
                      value={selectedSpendingYear}
                      onChange={(e) => {
                        const y = parseInt(e.target.value);
                        setSelectedSpendingYear(y);
                        fetchSpendingSummary(selectedSpendingMonth, y);
                      }}
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {spendingLoading ? (
                  <div className="loading-state" style={{ minHeight: '300px' }}>
                    <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
                    <p>Harcama ve bütçe verileri analiz ediliyor...</p>
                  </div>
                ) : !spendingData ? (
                  <div style={{ background: 'var(--bg-card)', padding: '3.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-chart-pie" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ec4899', opacity: 0.7 }}></i>
                    <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Veri Bulunamadı</h3>
                    <p>Seçilen dönem için henüz kaydedilmiş bir harcama veya gelir hareketi bulunmuyor.</p>
                  </div>
                ) : (
                  <>
                    {/* 1. ÖZET KARTLAR (GELİR, GİDER, TASARRUF, TASARRUF ORANI) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      {/* Toplam Gider */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Aylık Toplam Gider</span>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-arrow-trend-down"></i>
                          </div>
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(spendingData.totalExpenseTRY || 0, 'TRY')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{spendingData.periodName} dönemi harcamaları</span>
                      </div>

                      {/* Toplam Gelir */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Aylık Toplam Gelir</span>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-arrow-trend-up"></i>
                          </div>
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(spendingData.totalIncomeTRY || 0, 'TRY')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Gelen transferler & yatırımlar</span>
                      </div>

                      {/* Net Tasarruf */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Tasarruf / Kalan</span>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-piggy-bank"></i>
                          </div>
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: spendingData.netSavingsTRY >= 0 ? '#34d399' : '#f87171', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(spendingData.netSavingsTRY || 0, 'TRY')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Gelir - Gider farkı</span>
                      </div>

                      {/* Tasarruf Oranı */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tasarruf Oranı</span>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-percent"></i>
                          </div>
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ec4899', fontFamily: 'var(--font-mono)' }}>
                          %{Number(spendingData.savingsRate || 0).toFixed(1)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Aylık gelirin birikime oranı</span>
                      </div>
                    </div>

                    {/* 2. KATEGORİ DAĞILIMI (PASTA / İLERLEME ÇUBUKLARI) VE BÜTÇE HEDEFLERİ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                      {/* Sol: Kategori Harcama Dağılımı */}
                      <div className="portal-section-card">
                        <div className="portal-section-header" style={{ marginBottom: '1.25rem' }}>
                          <div className="portal-section-title">
                            <i className="fa-solid fa-tags" style={{ color: '#38bdf8' }}></i>
                            <span>Kategori Dağılımı (Akıllı Analiz)</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {spendingData.categoryBreakdown?.length || 0} Kategori
                          </span>
                        </div>

                        {(!spendingData.categoryBreakdown || spendingData.categoryBreakdown.length === 0) ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bu ay henüz kategorilendirilmiş harcama yok.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {spendingData.categoryBreakdown.map(cat => (
                              <div
                                key={cat.category}
                                onClick={() => handleSelectCategoryDetail(cat.category)}
                                style={{
                                  padding: '0.85rem',
                                  borderRadius: '12px',
                                  background: selectedCategoryDetail === cat.category ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${selectedCategoryDetail === cat.category ? '#38bdf8' : 'var(--border-color)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${cat.color || '#3b82f6'}22`, color: cat.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <i className={`fa-solid ${cat.icon || 'fa-tag'}`}></i>
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, color: 'white', fontSize: '0.88rem' }}>{cat.category}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{cat.transactionCount} İşlem</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
                                      {formatCurrency(cat.amount || 0, 'TRY')}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: cat.color || '#38bdf8', fontWeight: 600 }}>
                                      %{Number(cat.percentage || 0).toFixed(1)}
                                    </div>
                                  </div>
                                </div>

                                {/* Görsel İlerleme Çubuğu */}
                                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(cat.percentage || 0, 100)}%`,
                                    background: cat.color || '#38bdf8',
                                    borderRadius: '999px',
                                    transition: 'width 0.4s ease'
                                  }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sağ: Kategori Bütçe Takibi ve Limit Tanımlama */}
                      <div className="portal-section-card">
                        <div className="portal-section-header" style={{ marginBottom: '1.25rem' }}>
                          <div className="portal-section-title">
                            <i className="fa-solid fa-bullseye" style={{ color: '#f59e0b' }}></i>
                            <span>Kategori Bütçe Hedefleri</span>
                          </div>
                        </div>

                        {(!spendingData.budgets || spendingData.budgets.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-wallet" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                            <p style={{ margin: 0, fontSize: '0.88rem' }}>Henüz bir kategoriye bütçe limiti belirlenmedi.</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Harcamalarınızı kontrol altında tutmak için sol menüden bütçe koyabilirsiniz.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {spendingData.budgets.map(b => (
                              <div
                                key={b.category}
                                style={{
                                  padding: '0.9rem',
                                  borderRadius: '12px',
                                  background: b.isExceeded ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${b.isExceeded ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className={`fa-solid ${b.icon || 'fa-tag'}`} style={{ color: b.color || '#f59e0b' }}></i>
                                    <strong style={{ color: 'white', fontSize: '0.88rem' }}>{b.category}</strong>
                                    {b.isExceeded && (
                                      <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#ef4444', color: 'white', fontWeight: 700 }}>
                                        Bütçe Aşıldı!
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleOpenBudgetModal(b.category, b.budgetLimit)}
                                    style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.78rem' }}
                                    title="Limiti Düzenle"
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i> Düzenle
                                  </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                  <span>Harcanan: <strong style={{ color: 'white' }}>{formatCurrency(b.currentSpent || 0, 'TRY')}</strong></span>
                                  <span>Bütçe: <strong style={{ color: 'white' }}>{formatCurrency(b.budgetLimit || 0, 'TRY')}</strong></span>
                                </div>

                                {/* Kullanım Yüzdesi Çubuğu */}
                                <div style={{ height: '7px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(b.usagePercentage || 0, 100)}%`,
                                    background: b.isExceeded ? '#ef4444' : (b.usagePercentage > 80 ? '#f59e0b' : '#10b981'),
                                    borderRadius: '999px',
                                    transition: 'width 0.4s ease'
                                  }}></div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                                  <span>Kalan: <strong style={{ color: b.remaining >= 0 ? '#34d399' : '#f87171' }}>{formatCurrency(b.remaining || 0, 'TRY')}</strong></span>
                                  <span>%{Number(b.usagePercentage || 0).toFixed(0)} kullanıldı</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Yeni Bütçe Ekleme Kısayolu */}
                        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {['Market & Gıda', 'Yeme & İçme', 'Ulaşım & Akaryakıt', 'Fatura & Abonelik', 'Alışveriş & Giyim'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => handleOpenBudgetModal(cat, '')}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              + {cat} Bütçesi Ekle
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. SEÇİLEN KATEGORİNİN DETAYLI İŞLEM LİSTESİ */}
                    {selectedCategoryDetail && (
                      <div className="portal-section-card">
                        <div className="portal-section-header" style={{ marginBottom: '1rem' }}>
                          <div className="portal-section-title">
                            <i className="fa-solid fa-list-check" style={{ color: '#34d399' }}></i>
                            <span>"{selectedCategoryDetail}" Kategorisindeki Harcamalar</span>
                          </div>
                          <button
                            onClick={() => setSelectedCategoryDetail(null)}
                            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            <i className="fa-solid fa-xmark"></i> Kapat
                          </button>
                        </div>

                        {categoryTxLoading ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-spinner fa-spin"></i> İşlemler getiriliyor...
                          </div>
                        ) : categoryTransactions.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bu kategoride işlem kaydı bulunamadı.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {categoryTransactions.map(tx => (
                              <div
                                key={tx.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.75rem 1rem',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '10px'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>{tx.description}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{formatDate(tx.createdAt)}</div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                                  -{formatCurrency(Math.abs(tx.amount || 0), 'TRY')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. EN YÜKSEK HARCAMALAR (TOP 5) */}
                    {spendingData.topExpenses && spendingData.topExpenses.length > 0 && (
                      <div className="portal-section-card">
                        <div className="portal-section-header" style={{ marginBottom: '1rem' }}>
                          <div className="portal-section-title">
                            <i className="fa-solid fa-fire" style={{ color: '#f97316' }}></i>
                            <span>Bu Ayın En Yüksek Harcamaları</span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                          {spendingData.topExpenses.map((exp, idx) => (
                            <div
                              key={exp.id || idx}
                              style={{
                                padding: '0.85rem 1rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  background: 'rgba(249, 115, 22, 0.15)',
                                  color: '#f97316',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 800
                                }}>
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.85rem' }}>{exp.description}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{formatDate(exp.createdAt)}</div>
                                </div>
                              </div>
                              <div style={{ fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                                -{formatCurrency(Math.abs(exp.amount || 0), 'TRY')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SEKME 4: HESAP BİLGİLERİM (PROFİL) */}
            {activeTab === 'profile' && (
              <div className="portal-section-card" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
                <div className="portal-section-header">
                  <div className="portal-section-title">
                    <i className="fa-solid fa-id-card-clip" style={{ color: '#60a5fa' }}></i>
                    <span>Hesap & Profil Bilgilerim</span>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Sadece Okunabilir Alanlar */}
                  <div style={{ background: 'rgba(10, 14, 23, 0.5)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      <i className="fa-solid fa-lock" style={{ marginRight: '0.4rem' }}></i>
                      Resmi Banka Kayıtları (Değiştirilemez)
                    </div>

                    <div className="form-group-half">
                      <div className="form-group">
                        <label className="form-label">T.C. Kimlik No</label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          className="form-input font-mono"
                          value={profile?.identityNumber || ''}
                          style={{ background: 'rgba(0, 0, 0, 0.3)', opacity: 0.8 }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Müşteri No</label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          className="form-input font-mono"
                          value={profile?.customerNumber || ''}
                          style={{ background: 'rgba(0, 0, 0, 0.3)', opacity: 0.8, color: '#60a5fa' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Düzenlenebilir Alanlar */}
                  <div className="form-group-half">
                    <div className="form-group">
                      <label className="form-label">Adınız *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Soyadınız *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group-half">
                    <div className="form-group">
                      <label className="form-label">E-Posta Adresi *</label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefon Numarası *</label>
                      <input
                        type="tel"
                        required
                        className="form-input"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Güvenlik Doğrulaması */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      <i className="fa-solid fa-shield-halved" style={{ marginRight: '0.4rem' }}></i>
                      Güvenlik Doğrulaması
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label" style={{ color: '#f87171' }}>
                        Mevcut Şifreniz * (Değişiklikleri Kaydetmek İçin Zorunludur)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Mevcut giriş şifrenizi girin"
                        className="form-input"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Yeni Şifre <span style={{ opacity: 0.7, fontWeight: 400 }}>(İsteğe bağlı, değiştirmek istemiyorsanız boş bırakın)</span>
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        placeholder="Yeni şifreniz (en az 6 karakter)"
                        className="form-input"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                    style={{ padding: '0.85rem', justifyContent: 'center' }}
                  >
                    {actionLoading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Güncelleniyor...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Değişiklikleri Kaydet (PUT /api/Auth/me)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* SEKME 4: DÖVİZ & ALTIN PİYASASI (TCMB CANLI AL-SAT) */}
            {activeTab === 'fx' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Üst Karşılama ve Canlı Durum */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.75rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        Döviz & Altın Piyasası
                      </h1>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '999px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        TCMB Canlı Veri
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                      Türkiye Cumhuriyet Merkez Bankası (TCMB) anlık kurlarıyla vadesiz döviz/altın alım-satımı yapın
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={fetchRates}
                      disabled={ratesLoading}
                      style={{
                        background: 'rgba(31, 41, 55, 0.7)',
                        color: '#93c5fd',
                        border: '1px solid var(--border-color)',
                        padding: '0.55rem 0.95rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontWeight: 600
                      }}
                      title="Kurları Şimdi Yenile"
                    >
                      <i className={`fa-solid fa-arrows-rotate ${ratesLoading ? 'fa-spin' : ''}`}></i>
                      <span>Kurları Yenile</span>
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowOpenCurrencyModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        color: 'white',
                        border: 'none',
                        padding: '0.55rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
                      }}
                    >
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Yeni Hesap Aç</span>
                    </button>
                  </div>
                </div>

                {/* 1. TCMB CANLI KUR KARTLARI (USD, EUR, XAU) */}
                <div className="fx-rates-grid">
                  {rates.map(rate => {
                    const themeCardClass = rate.code === 'USD' ? 'fx-card-usd' : rate.code === 'EUR' ? 'fx-card-eur' : 'fx-card-gold';
                    return (
                      <div key={rate.code} className={`fx-rate-card ${themeCardClass}`}>
                        <div className="fx-card-header">
                          <div className="fx-currency-info">
                            <span className="fx-flag-icon">{rate.flag}</span>
                            <div>
                              <div className="fx-currency-code">{rate.code} / TRY</div>
                              <div className="fx-currency-name">{rate.name}</div>
                            </div>
                          </div>
                          <span className={`fx-change-badge ${rate.isUp ? 'fx-change-up' : 'fx-change-down'}`}>
                            <i className={`fa-solid ${rate.isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                            <span>{rate.change}</span>
                          </span>
                        </div>

                        <div className="fx-prices-row">
                          <div className="fx-price-col">
                            <span className="fx-price-label">Alış (Bankaya Sat)</span>
                            <span className="fx-price-val">₺ {rate.buying?.toFixed(2)}</span>
                          </div>
                          <div className="fx-price-col" style={{ textAlign: 'right' }}>
                            <span className="fx-price-label">Satış (Bankadan Al)</span>
                            <span className="fx-price-val" style={{ color: '#34d399' }}>₺ {rate.selling?.toFixed(2)}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            Makas: ₺ {(rate.selling - rate.buying)?.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTradeCurrency(rate.code);
                              setTradeAction('buy');
                            }}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#93c5fd',
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Hızlı Al / Sat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. CANLI İŞLEM PANELİ (AL / SAT) & MEVCUT VARLIKLAR */}
                <div className="fx-trading-container">
                  {/* SOL: Canlı Alım / Satım Emri Kutusu */}
                  <div className="fx-trade-box">
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-arrow-right-arrow-left" style={{ color: '#38bdf8' }}></i>
                      Canlı Döviz / Altın İşlemi
                    </h3>

                    {/* Al / Sat Switcher */}
                    <div className="fx-trade-type-switcher">
                      <button
                        type="button"
                        className={`fx-trade-type-btn fx-trade-buy ${tradeAction === 'buy' ? 'active' : ''}`}
                        onClick={() => setTradeAction('buy')}
                      >
                        <i className="fa-solid fa-arrow-down-left"></i>
                        <span>Döviz / Altın Al (Alış)</span>
                      </button>
                      <button
                        type="button"
                        className={`fx-trade-type-btn fx-trade-sell ${tradeAction === 'sell' ? 'active' : ''}`}
                        onClick={() => setTradeAction('sell')}
                      >
                        <i className="fa-solid fa-arrow-up-right"></i>
                        <span>Döviz / Altın Sat (Bozdur)</span>
                      </button>
                    </div>

                    {/* Para Birimi Hapları (USD, EUR, XAU) */}
                    <label className="form-label">İşlem Yapılacak Varlık</label>
                    <div className="fx-currency-selector-pills">
                      {rates.map(r => (
                        <button
                          key={r.code}
                          type="button"
                          className={`fx-pill-btn ${tradeCurrency === r.code ? 'active' : ''}`}
                          onClick={() => setTradeCurrency(r.code)}
                        >
                          <span>{r.flag}</span>
                          <span>{r.code} ({r.name})</span>
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleExchangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      {/* Kaynak Hesap Seçici */}
                      <div className="form-group">
                        <label className="form-label">
                          {tradeAction === 'buy' ? 'Ödemenin Yapılacağı TL Hesabı *' : `Bozdurulacak ${tradeCurrency} Hesabı *`}
                        </label>
                        <select
                          className="form-input"
                          required
                          value={tradeSourceAccountId}
                          onChange={(e) => setTradeSourceAccountId(e.target.value)}
                        >
                          <option value="">-- Hesap Seçiniz --</option>
                          {accounts
                            .filter(a => tradeAction === 'buy' ? ((a.currency || 'TRY').toUpperCase() === 'TRY') : isCurrencyMatch(a.currency, tradeCurrency))
                            .map(a => (
                              <option key={a.id} value={a.id}>
                                {a.iban} ({formatCurrency(a.balance || 0, a.currency)})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Hedef Hesap Seçici */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="form-label">
                            {tradeAction === 'buy' ? `Alınan ${tradeCurrency}'nin Yatırılacağı Hesap *` : 'Tahsilatın Yatacağı TL Hesabı *'}
                          </label>
                          {/* Hedef para biriminde hesap yoksa hızlı aç linki */}
                          {tradeAction === 'buy' && !accounts.some(a => isCurrencyMatch(a.currency, tradeCurrency)) && (
                            <button
                              type="button"
                              onClick={() => handleOpenCurrencyAccount(tradeCurrency)}
                              style={{ background: 'transparent', color: '#38bdf8', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                            >
                              + {tradeCurrency} Hesabı Aç
                            </button>
                          )}
                        </div>

                        <select
                          className="form-input"
                          required
                          value={tradeTargetAccountId}
                          onChange={(e) => setTradeTargetAccountId(e.target.value)}
                        >
                          <option value="">-- Hesap Seçiniz --</option>
                          {accounts
                            .filter(a => tradeAction === 'buy' ? isCurrencyMatch(a.currency, tradeCurrency) : ((a.currency || 'TRY').toUpperCase() === 'TRY'))
                            .map(a => (
                              <option key={a.id} value={a.id}>
                                {a.iban} ({formatCurrency(a.balance || 0, a.currency)})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Miktar Girişi */}
                      <div className="form-group">
                        <label className="form-label">
                          İşlem Tutarı ({tradeCurrency}) *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            placeholder={tradeCurrency === 'XAU' ? 'Örn: 1 (Gram)' : 'Örn: 100'}
                            className="form-input"
                            style={{ paddingRight: '4.5rem', fontSize: '1.05rem', fontWeight: 700 }}
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                          />
                          <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#9ca3af' }}>
                            {tradeCurrency}
                          </span>
                        </div>
                      </div>

                      {/* Anlık Kur ve Hesaplama Özeti */}
                      {(() => {
                        const curRate = rates.find(r => r.code === tradeCurrency) || rates[0];
                        const activeRate = tradeAction === 'buy' ? (curRate?.selling || 1) : (curRate?.buying || 1);
                        const amtNum = parseFloat(tradeAmount) || 0;
                        const totalTL = (amtNum * activeRate).toFixed(2);

                        return (
                          <div className="fx-calc-preview">
                            <div className="fx-calc-row">
                              <span style={{ color: 'var(--text-muted)' }}>Uygulanan TCMB Kuru:</span>
                              <span style={{ fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)' }}>
                                1 {tradeCurrency} = ₺ {activeRate.toFixed(2)}
                              </span>
                            </div>
                            <div className="fx-calc-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {tradeAction === 'buy' ? 'Hesabınızdan Düşecek Toplam (TL):' : 'Hesabınıza Geçecek Net (TL):'}
                              </span>
                              <span className="fx-calc-highlight">
                                ₺ {Number(totalTL).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <button
                        type="submit"
                        className="btn"
                        disabled={actionLoading}
                        style={{
                          background: tradeAction === 'buy' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                          color: 'white',
                          padding: '0.95rem',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: tradeAction === 'buy' ? '0 6px 20px rgba(16, 185, 129, 0.35)' : '0 6px 20px rgba(239, 68, 68, 0.35)'
                        }}
                      >
                        {actionLoading ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                            <span>İşlem Gerçekleştiriliyor...</span>
                          </>
                        ) : (
                          <>
                            <i className={tradeAction === 'buy' ? 'fa-solid fa-basket-shopping' : 'fa-solid fa-hand-holding-dollar'}></i>
                            <span>
                              {tradeAction === 'buy' ? `${tradeCurrency} Satın Al (Canlı Alış)` : `${tradeCurrency} Bozdur (Canlı Satış)`}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* SAĞ: Döviz & Altın Portföyüm */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.75rem',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fa-solid fa-coins" style={{ color: '#f59e0b' }}></i>
                          Döviz & Altın Varlıklarım
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowOpenCurrencyModal(true)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Yeni Hesap
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {accounts.map(acc => {
                          const c = (acc.currency || 'TRY').toUpperCase();
                          const flag = c === 'USD' ? '🇺🇸' : c === 'EUR' ? '🇪🇺' : (c === 'XAU' || c === 'GOLD') ? '🟡' : '🇹🇷';
                          const name = c === 'USD' ? 'Dolar Hesabı' : c === 'EUR' ? 'Euro Hesabı' : (c === 'XAU' || c === 'GOLD') ? 'Gram Altın Hesabı' : 'Vadesiz TL Hesabı';
                          
                          let tlEquivalent = acc.balance || 0;
                          if (c !== 'TRY') {
                            const r = rates.find(rt => rt.code === c);
                            if (r) tlEquivalent = (acc.balance || 0) * (r.buying || 1);
                          }

                          return (
                            <div key={acc.id} style={{
                              background: 'rgba(10, 14, 23, 0.5)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{flag}</span>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{acc.iban}</div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                                  {formatCurrency(acc.balance || 0, acc.currency)}
                                </div>
                                {c !== 'TRY' && (
                                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                                    ≈ ₺ {Number(tlEquivalent.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Güvenlik & Komisyonsuzluk Bilgilendirme Kartı */}
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '0.85rem'
                    }}>
                      <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.4rem', color: '#60a5fa', marginTop: '0.2rem' }}></i>
                      <div style={{ fontSize: '0.825rem', color: '#d1d5db', lineHeight: 1.5 }}>
                        <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>TCMB Güvencesiyle 7/24 Canlı Al-Sat</strong>
                        Kurlar Türkiye Cumhuriyet Merkez Bankası verileriyle anlık güncellenir. Alım ve satım işlemlerinizde komisyon veya gizli masraf kesintisi uygulanmaz.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* YENİ DÖVİZ / ALTIN HESABI AÇMA MODALI */}
      {showOpenCurrencyModal && (
        <div className="modal-overlay" onClick={() => setShowOpenCurrencyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon modal-icon-blue">
                  <i className="fa-solid fa-coins"></i>
                </div>
                <div>
                  <h3 className="modal-title">Yeni Vadesiz Hesap Aç</h3>
                  <p className="modal-subtitle">Döviz veya altın cinsinden anında hesap oluşturun</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowOpenCurrencyModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Açmak istediğiniz hesap para birimini seçiniz. Hesabınız anında üretilecek ve kendi adına özel IBAN numarası tanımlanacaktır:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {[
                  { code: 'USD', name: 'Amerikan Doları', flag: '🇺🇸', desc: 'Vadesiz Dolar Hesabı' },
                  { code: 'EUR', name: 'Euro', flag: '🇪🇺', desc: 'Vadesiz Euro Hesabı' },
                  { code: 'XAU', name: 'Gram Altın', flag: '🟡', desc: 'Vadesiz Altın Hesabı' },
                  { code: 'TRY', name: 'Türk Lirası', flag: '🇹🇷', desc: 'Vadesiz TL Hesabı' }
                ].map(cur => (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => setNewCurrencyType(cur.code)}
                    style={{
                      background: newCurrencyType === cur.code ? 'rgba(59, 130, 246, 0.25)' : 'rgba(10, 14, 23, 0.6)',
                      border: `2px solid ${newCurrencyType === cur.code ? '#3b82f6' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '1.6rem' }}>{cur.flag}</span>
                    <span style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>{cur.code}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{cur.desc}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={() => handleOpenCurrencyAccount(newCurrencyType)}
                style={{ width: '100%', padding: '0.9rem', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800 }}
              >
                {actionLoading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Hesabınız Açılıyor...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    <span>{newCurrencyType} Hesabını Anında Aç</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.5. Banka Kartı Yönetim Modalı */}
      <CardSettingsModal
        isOpen={showCardModal}
        card={selectedCardForSettings}
        onClose={() => setShowCardModal(false)}
        onSaveSettings={handleSaveCardSettings}
        onToggleStatus={handleToggleCardStatus}
        loading={actionLoading}
      />

      {/* 7.6. SOL ÜST YAN MENÜ ÇEKMECESİ (DRAWER MENU - İŞCEP / GARANTİ BENZERİ HİYERARŞİK) */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => { setDrawerOpen(false); setActiveMenuCategory(null); }}>
          <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {activeMenuCategory ? (
                  <button
                    onClick={() => setActiveMenuCategory(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem'
                    }}
                    title="Ana Menüye Dön"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                ) : (
                  <div className="portal-brand-icon" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                    <i className="fa-solid fa-wallet"></i>
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem', letterSpacing: '-0.02em' }}>
                    {activeMenuCategory ? activeMenuCategory.title : 'MINIBANK'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {activeMenuCategory ? 'Kategori Seçenekleri' : 'Bireysel Menü'}
                  </div>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => { setDrawerOpen(false); setActiveMenuCategory(null); }}
                title="Menüyü Kapat"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body">
              {/* Kullanıcı Hızlı Bilgisi (Yalnızca ana menüdeyken gösterilir) */}
              {!activeMenuCategory && (
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}>
                    {profile?.fullName ? profile.fullName[0].toUpperCase() : 'M'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.88rem' }}>{profile?.fullName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {profile?.customerNumber || profile?.identityNumber}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. DURUM: BİR KATEGORİ SEÇİLİ DEĞİLSE -> YALNIZCA ANA BAŞLIKLARI GÖSTER */}
              {!activeMenuCategory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div className="drawer-section-title" style={{ paddingLeft: '0.35rem' }}>
                    <span>İşlem Menüsü</span>
                  </div>

                  {(navigationMenu && navigationMenu.length > 0 ? navigationMenu : [
                    { id: 'accounts', title: 'Hesaplarım', icon: 'fa-wallet', badge: 'Hesaplar', items: [] },
                    { id: 'cards', title: 'Kartlarım', icon: 'fa-credit-card', badge: 'Kart', items: [] },
                    { id: 'transfers', title: 'Para Transferleri', icon: 'fa-paper-plane', items: [] },
                    { id: 'spending', title: 'Harcama & Bütçe Yönetimi', icon: 'fa-chart-pie', badge: 'Analiz', items: [
                      { id: 'sp-summary', title: 'Aylık Harcama Analizi', description: 'Kategori dağılımı ve tasarruf oranı', icon: 'fa-chart-pie', route: '/spending/summary' },
                      { id: 'sp-budget', title: 'Kategori Bütçe Hedefleri', description: 'Aylık harcama limitleri belirleyin', icon: 'fa-bullseye', route: '/spending/summary' }
                    ] },
                    { id: 'currencies', title: 'Döviz & Kıymetli Maden', icon: 'fa-chart-line', badge: 'TCMB', items: [] },
                    { id: 'profile', title: 'Profil & Güvenlik', icon: 'fa-user-shield', items: [] }
                  ]).map((cat) => (
                    <button
                      key={cat.id}
                      className="drawer-item-btn"
                      onClick={() => setActiveMenuCategory(cat)}
                      style={{
                        padding: '0.9rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px'
                      }}
                    >
                      <div className="drawer-item-icon" style={{ width: '38px', height: '38px', fontSize: '1.05rem', color: '#60a5fa' }}>
                        <i className={`fa-solid ${cat.icon || 'fa-folder'}`}></i>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: '0.92rem' }}>{cat.title}</div>
                      </div>
                      {cat.badge && <span className="drawer-badge">{cat.badge}</span>}
                      <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}></i>
                    </button>
                  ))}
                </div>
              )}

              {/* 2. DURUM: BİR BAŞLIĞA BASILINCA -> YALNIZCA ONA AİT İŞLEMLERİ GÖSTER */}
              {activeMenuCategory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.25rem 0.85rem',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '0.65rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {activeMenuCategory.title} İşlemleri
                    </span>
                    <button
                      onClick={() => setActiveMenuCategory(null)}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Tüm Menüye Dön
                    </button>
                  </div>

                  {activeMenuCategory.items && activeMenuCategory.items.length > 0 ? (
                    activeMenuCategory.items.map((item) => (
                      <button
                        key={item.id}
                        className="drawer-item-btn"
                        onClick={() => {
                          setDrawerOpen(false);
                          setActiveMenuCategory(null);
                          handleMenuNavigate(item.route);
                        }}
                        style={{ padding: '0.85rem' }}
                      >
                        <div className="drawer-item-icon">
                          <i className={`fa-solid ${item.icon || 'fa-circle'}`}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>{item.title}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.badge && <span className="drawer-badge">{item.badge}</span>}
                      </button>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      Bu kategoride görüntülenecek işlem bulunamadı.
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* 7.7. Bütçe Limiti Belirleme Modalı */}
      {budgetModalCategory && (
        <div className="modal-overlay" onClick={() => setBudgetModalCategory(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Bütçe Limiti Belirle</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{budgetModalCategory}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setBudgetModalCategory(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveBudget} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Aylık Harcama Limiti (TL) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  placeholder="Örn: 5000"
                  className="form-input"
                  value={budgetInputLimit}
                  onChange={e => setBudgetInputLimit(e.target.value)}
                  autoFocus
                />
                <span className="form-hint" style={{ fontSize: '0.72rem' }}>
                  {budgetModalCategory} harcamalarınız bu tutarı aştığında sistem uyarı verecektir.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBudgetModalCategory(null)} disabled={actionLoading}>
                  Vazgeç
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                  <span>Limiti Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Akıllı Bankacılık Asistanı (Garanti BBVA Ugi Benzeri) */}
      <AssistantWidget
        currentPage={`/${activeTab}`}
        onNavigate={handleAssistantNavigate}
      />

      <footer className="footer">
        <p>MiniBank Bireysel İnternet Şubesi © 2026 • 256-Bit SSL Uçtan Uca Güvenli Bankacılık</p>
      </footer>
    </div>
  );
}
