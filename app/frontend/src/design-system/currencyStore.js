/**
 * Currency & Locale State Management
 * Guarantees zero hardcoded currencies across the application.
 */

import { useState, useEffect } from 'react';

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', rate: 1.0, locale: 'en-IN', name: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', rate: 1 / 84.0, locale: 'en-US', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', rate: 1 / 92.0, locale: 'de-DE', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', rate: 1 / 108.0, locale: 'en-GB', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', rate: 1.83, locale: 'ja-JP', name: 'Japanese Yen' },
};

let currentCurrency = CURRENCIES.INR;
const listeners = new Set();

export function setGlobalCurrency(code) {
  if (CURRENCIES[code]) {
    currentCurrency = CURRENCIES[code];
    listeners.forEach((fn) => fn(currentCurrency));
  }
}

export function getGlobalCurrency() {
  return currentCurrency;
}

export function useCurrency() {
  const [currency, setCurrency] = useState(currentCurrency);

  useEffect(() => {
    const handler = (newCurr) => setCurrency(newCurr);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const format = (rawAmount, options = {}) => {
    if (rawAmount === null || rawAmount === undefined || isNaN(rawAmount)) return `${currency.symbol}0.00`;
    const num = Number(rawAmount);
    // If INR is selected, data is in native INR (1.0 rate)
    const converted = currency.code === 'INR' ? num : (currency.rate ? num * currency.rate : num);
    const decimals = currency.code === 'JPY' ? 0 : (options.decimals ?? 2);
    
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(converted);
  };

  return {
    currency,
    setCurrency: setGlobalCurrency,
    availableCurrencies: Object.values(CURRENCIES),
    format,
  };
}
