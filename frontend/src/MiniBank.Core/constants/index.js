/**
 * MiniBank.Core - Sabit Değerler (Constants)
 */

export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  CUSTOMER: 'Customer'
});

export const TRANSACTION_TYPES = Object.freeze({
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  TRANSFER: 'transfer',
  FAST: 'fast',
  FX_BUY: 'fx_buy',
  FX_SELL: 'fx_sell'
});

export const CURRENCIES = Object.freeze({
  TRY: 'TRY',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  GOLD: 'XAU'
});

export const STORAGE_KEYS = Object.freeze({
  TOKEN: 'token',
  USER: 'user',
  TERM_DEPOSITS: 'minibank_term_deposits'
});

export const ROUTES = Object.freeze({
  LOGIN: 'login',
  ADMIN: 'admin',
  PORTAL: 'portal'
});

export const CUSTOMER_STATUS = Object.freeze({
  ACTIVE: 'Active',
  PASSIVE: 'Passive'
});

export const FEATURE_KEYS = Object.freeze({
  TIME_DEPOSIT: 'TIME_DEPOSIT',
  FX_EXCHANGE: 'FX_EXCHANGE',
  FAST_TRANSFER: 'FAST_TRANSFER',
  LOAN_APPLICATION: 'LOAN_APPLICATION',
  CRYPTO_TRADING: 'CRYPTO_TRADING',
  VIP_CUSTOMER_SUPPORT: 'VIP_CUSTOMER_SUPPORT'
});

export const ASSISTANT_ACTIONS = Object.freeze({
  NAVIGATE: 'NAVIGATE',
  INFO: 'INFO',
  SUGGESTION: 'SUGGESTION'
});

export const ASSISTANT_ROUTES = Object.freeze({
  TRANSFERS: '/transfers',
  ACCOUNTS: '/accounts',
  ACCOUNTS_NEW: '/accounts/new',
  EXCHANGE: '/exchange',
  DEPOSITS: '/deposits',
  DEPOSITS_NEW: '/deposits/new',
  TRANSACTIONS: '/transactions',
  PROFILE: '/profile',
  SECURITY: '/security',
  DASHBOARD: '/dashboard'
});

