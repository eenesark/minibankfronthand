/**
 * MiniBank.Infrastructure - Formatlama Yardımcıları
 */

/**
 * Para biriminin anlaşılır Türkçe etiketini ve sembolünü döner.
 * @param {string} currency
 * @returns {string}
 */
export function getCurrencyLabel(currency) {
  const curr = (currency || 'TRY').toUpperCase();
  switch (curr) {
    case 'XAU':
    case 'GOLD':
    case 'ALTIN':
      return 'Altın (gr)';
    case 'USD':
      return 'Dolar ($)';
    case 'EUR':
      return 'Euro (€)';
    case 'GBP':
      return 'Sterlin (£)';
    case 'TRY':
    default:
      return 'Türk Lirası (₺)';
  }
}

/**
 * Sayıyı belirtilen para birimi formatına çevirir (TRY, USD, EUR, XAU/Altın).
 * @param {number|string} amount
 * @param {string} [currency='TRY']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'TRY') {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const curr = (currency || 'TRY').toUpperCase();

  if (curr === 'XAU' || curr === 'GOLD' || curr === 'ALTIN') {
    return `${numeric.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} gr Altın`;
  }

  try {
    return new Intl.NumberFormat(curr === 'USD' ? 'en-US' : (curr === 'EUR' ? 'de-DE' : 'tr-TR'), {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numeric);
  } catch {
    return `${numeric.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
  }
}

/**
 * ISO tarih bilgisini Türkçe okunabilir formata çevirir.
 * Örnek: "2026-10-14T15:20:00" -> "14 Ekim 2026, 15:20"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Kısa tarih formatı (Örnek: "14.10.2026")
 * @param {string|Date} date
 * @returns {string}
 */
export function formatShortDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(date);
  }
}

/**
 * IBAN'ı okunaklı şekilde maskeler (TR** **** **** 1234)
 * @param {string} iban
 * @returns {string}
 */
export function maskIban(iban) {
  if (!iban || iban.length < 10) return iban || '-';
  const clean = iban.replace(/\s+/g, '');
  const start = clean.slice(0, 2);
  const end = clean.slice(-4);
  return `${start}** **** **** ${end}`;
}

/**
 * TCKN'yi maskeler (123*****89)
 * @param {string} identityNumber
 * @returns {string}
 */
export function maskIdentity(identityNumber) {
  if (!identityNumber || identityNumber.length < 5) return identityNumber || '-';
  const str = String(identityNumber);
  return `${str.slice(0, 3)}*****${str.slice(-2)}`;
}

