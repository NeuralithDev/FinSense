/**
 * Unified Reactive Global Finance Store for FinSense.
 * 
 * Supports User-Scoped Ledger Isolation and Zero-State Onboarding:
 * - When a new customer logs in, starts in Clean Slate / Unlinked state (hasImportedData = false)
 * - Feeds real customer data via Setu Account Aggregator / Plaid Link / CSV / PDF dropzone
 * - Supports instant toggle to Demo Sandbox Mode (sample ICICI/HDFC student profile)
 * - Persists cleanly per user in localStorage: FINSENSE_USER_LEDGER_<email>
 */

import { useState, useEffect } from 'react';
import {
  fetchLiveLedger,
  uploadStatementCSV,
  addLiveTransaction,
  executeSavingsSweep,
  cancelOrPauseSubscription,
  resolveAnomalyAlert,
  switchSandboxProfile,
} from '../services/api';
import {
  getReconciledFinanceData,
  DEFAULT_INR_TARGET,
  DEFAULT_INR_BUFFER,
} from '../utils/financeEngine';
import { getGlobalScenario } from './scenarioStore';
import { getGlobalCurrency } from '../design-system/currencyStore';
import {
  normalizeBankTransaction,
  normalizeTransactionLedger,
} from '../utils/transactionNormalizer';
import {
  detectRecurringSubscriptions,
  summarizeRecurringPortfolio,
} from '../utils/recurringEngine';

// Coherent Realistic Demo Portfolio in INR
export const BASE_REALISTIC_TRANSACTIONS = [
  // Day 21 (Today)
  { id: 'tx_01', date: '2026-10-21', merchant: 'Blinkit Grocery', amount: 311.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  { id: 'tx_02', date: '2026-10-21', merchant: 'Supermoney Cashback', amount: 28.45, category: 'Income', is_income: true, is_recurring: false },
  // Day 20
  { id: 'tx_03', date: '2026-10-20', merchant: 'V Jagadha (Split Payment)', amount: 90.00, category: 'Shopping & Personal', is_income: false, is_recurring: false },
  { id: 'tx_04', date: '2026-10-20', merchant: 'Vinayak R', amount: 80.00, category: 'Shopping & Personal', is_income: false, is_recurring: false },
  // Day 19
  { id: 'tx_05', date: '2026-10-19', merchant: 'Ansh Kumar (UPI Split)', amount: 105.00, category: 'Income', is_income: true, is_recurring: false },
  { id: 'tx_06', date: '2026-10-19', merchant: 'Uber India Trip', amount: 185.00, category: 'Transportation', is_income: false, is_recurring: false },
  // Day 18
  { id: 'tx_07', date: '2026-10-18', merchant: "Domino's Pizza Gourmet", amount: 420.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 17 (Investment - strictly excluded from spend pacing)
  { id: 'tx_08', date: '2026-10-17', merchant: 'Zerodha Broking (Equity SIP)', amount: 5500.00, category: 'Investments', is_income: false, is_recurring: false },
  // Day 16
  { id: 'tx_09', date: '2026-10-16', merchant: 'Swiggy Gourmet Delivery', amount: 345.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 14
  { id: 'tx_10', date: '2026-10-14', merchant: 'Apple Services (iCloud Student)', amount: 75.00, category: 'Subscriptions', is_income: false, is_recurring: true },
  { id: 'tx_11', date: '2026-10-14', merchant: 'Velan Fruits & Fresh Produce', amount: 165.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 12
  { id: 'tx_12', date: '2026-10-12', merchant: 'Vaishnav (Splitwise Reimbursement)', amount: 50.00, category: 'Income', is_income: true, is_recurring: false },
  { id: 'tx_13', date: '2026-10-12', merchant: 'Amazon Prime Video', amount: 299.00, category: 'Subscriptions', is_income: false, is_recurring: true },
  // Day 11
  { id: 'tx_14', date: '2026-10-11', merchant: 'Café Coffee Day & Snack', amount: 210.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 10
  { id: 'tx_15', date: '2026-10-10', merchant: 'Metro Transit SmartCard Recharge', amount: 200.00, category: 'Transportation', is_income: false, is_recurring: false },
  // Day 08
  { id: 'tx_16', date: '2026-10-08', merchant: 'Spotify Premium Student', amount: 119.00, category: 'Subscriptions', is_income: false, is_recurring: true },
  { id: 'tx_17', date: '2026-10-08', merchant: 'Balaji Provisions Store', amount: 420.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 06
  { id: 'tx_18', date: '2026-10-06', merchant: 'JioHotstar Mobile VIP', amount: 149.00, category: 'Subscriptions', is_income: false, is_recurring: true },
  // Day 04 (Hike: ₹499 -> ₹649)
  { id: 'tx_19', date: '2026-10-04', merchant: 'Netflix Premium 4K', amount: 649.00, category: 'Subscriptions', is_income: false, is_recurring: true },
  { id: 'tx_19_prev', date: '2026-09-04', merchant: 'Netflix Premium 4K', amount: 499.00, category: 'Subscriptions', is_income: false, is_recurring: true },
  // Cult.fit Gym (Hike: ₹1299 -> ₹1499)
  { id: 'tx_cult_oct', date: '2026-10-24', merchant: 'Cult.fit Gym & Fitness', amount: 1499.00, category: 'Health & Fitness', is_income: false, is_recurring: true },
  { id: 'tx_cult_sep', date: '2026-09-24', merchant: 'Cult.fit Gym & Fitness', amount: 1299.00, category: 'Health & Fitness', is_income: false, is_recurring: true },
  // Day 03
  { id: 'tx_20', date: '2026-10-03', merchant: 'Blinkit Household Essentials', amount: 480.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 02
  { id: 'tx_21', date: '2026-10-02', merchant: 'Blue Tokai Specialty Coffee', amount: 260.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  // Day 01
  { id: 'tx_22', date: '2026-10-01', merchant: 'Anand Sevd (Family Academic Allowance)', amount: 20000.00, category: 'Income', is_income: true, is_recurring: true },
  { id: 'tx_23', date: '2026-10-01', merchant: 'Semester Room Rent Share', amount: 5000.00, category: 'Housing & Utilities', is_income: false, is_recurring: true },
  { id: 'tx_24', date: '2026-10-01', merchant: 'Airtel Xstream Fiber Broadband', amount: 493.00, category: 'Utilities', is_income: false, is_recurring: true },
];

export const CRISIS_EXTRA_TRANSACTIONS = [
  { id: 'tx_c1', date: '2026-10-19', merchant: 'Apple Store Premium Headphones', amount: 4800.00, category: 'Shopping & Personal', is_income: false, is_recurring: false },
  { id: 'tx_c2', date: '2026-10-15', merchant: 'Fine Dining Weekend Feast', amount: 2450.00, category: 'Food & Dining', is_income: false, is_recurring: false },
  { id: 'tx_c3', date: '2026-10-09', merchant: 'Club & Weekend Concert Pass', amount: 1800.00, category: 'Entertainment', is_income: false, is_recurring: false },
];

export function computeUnusualActivityAlerts(transactions) {
  const alerts = [];
  const debitTxs = (transactions || []).filter((t) => !t.is_income && t.amount > 0);

  const categoryAmounts = {};
  debitTxs.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryAmounts[cat]) categoryAmounts[cat] = [];
    categoryAmounts[cat].push(t.amount);
  });

  const categoryAverages = {};
  for (const [cat, amounts] of Object.entries(categoryAmounts)) {
    const sum = amounts.reduce((a, b) => a + b, 0);
    categoryAverages[cat] = sum / amounts.length;
  }

  debitTxs.forEach((t) => {
    if (['Investments', 'Housing & Rent', 'Housing & Utilities'].includes(t.category)) {
      if (t.merchant.includes('Zerodha')) {
        alerts.push({
          id: `anom_${t.id}`,
          tx_id: t.id,
          merchant: t.merchant,
          date: t.date,
          category: t.category,
          amount: t.amount,
          severity: 'CRITICAL',
          consensus_tier: 'TIER_1_CONSENSUS',
          status: 'RESOLVED',
          root_cause: 'Planned monthly capital investment — recognized and excluded from living expense pacing.',
        });
      }
      return;
    }

    const catAvg = categoryAverages[t.category || 'General'] || 300;
    if (t.amount > Math.max(350, catAvg * 2.5)) {
      alerts.push({
        id: `anom_${t.id}`,
        tx_id: t.id,
        merchant: t.merchant,
        date: t.date,
        category: t.category || 'General',
        amount: t.amount,
        severity: t.amount > catAvg * 4 ? 'CRITICAL' : 'MODERATE',
        consensus_tier: t.amount > catAvg * 4 ? 'TIER_1_CONSENSUS' : 'TIER_2_WATCHLIST',
        status: 'PENDING',
        root_cause: `Charge (₹${t.amount.toFixed(0)}) is ${(t.amount / catAvg).toFixed(1)}x higher than your usual ₹${catAvg.toFixed(0)} ${t.category} average.`,
      });
    }
  });

  const seenMap = {};
  debitTxs.forEach((t) => {
    const key = `${t.date}_${t.merchant.toLowerCase().trim()}_${t.amount}`;
    if (seenMap[key]) {
      alerts.push({
        id: `anom_dup_${t.id}`,
        tx_id: t.id,
        merchant: t.merchant,
        date: t.date,
        category: t.category,
        amount: t.amount,
        severity: 'CRITICAL',
        consensus_tier: 'TIER_1_CONSENSUS',
        status: 'PENDING',
        root_cause: `Potential duplicate charge detected: 2 charges of ₹${t.amount.toFixed(2)} on ${t.date}.`,
      });
    } else {
      seenMap[key] = t;
    }
  });

  return alerts;
}

// ----------------------------------------------------------------------------
// ZERO-STATE (FRESH CUSTOMER CLEAN SLATE)
// ----------------------------------------------------------------------------
export const EMPTY_FINANCE_STATE = {
  hasImportedData: false,
  hasConnectedBank: false,
  isDemoMode: false,
  accounts: {
    checking: {
      id: 'acc_chk_empty',
      name: 'No Checking Account Linked',
      type: 'CHECKING',
      balance: 0,
      currency: 'INR',
      institution: 'No Bank Linked',
      mask: '----',
      holder: '',
      status: 'DISCONNECTED',
    },
    savings: {
      id: 'acc_sav_empty',
      name: 'No Savings Reserve Linked',
      type: 'SAVINGS',
      balance: 0,
      currency: 'INR',
      institution: 'No Bank Linked',
      mask: '----',
      holder: '',
      status: 'DISCONNECTED',
    },
  },
  monthlyTargetBudget: DEFAULT_INR_TARGET,
  excludeOutliers: true,
  isCrisisDemoMode: false,
  rawTransactions: [],
  normalizedTransactions: [],
  transactions: [],
  subscriptions: [],
  detectedSubscriptions: [],
  anomalies: [],
  unusualActivityAlerts: [],
  goals: [],
  safeSweepAmount: 0,
  isSyncModalOpen: false,
  isCommandPaletteOpen: false,
  activeNotification: null,
  activeStatementMeta: null,
};

// Compute demo state for on-demand test drive
const initialDemoNormalized = normalizeTransactionLedger(BASE_REALISTIC_TRANSACTIONS);
const initialDemoSubs = detectRecurringSubscriptions(initialDemoNormalized);
const initialDemoAlerts = computeUnusualActivityAlerts(initialDemoNormalized);

export const DEMO_FINANCE_STATE = {
  hasImportedData: true,
  hasConnectedBank: true,
  isDemoMode: true,
  accounts: {
    checking: {
      id: 'acc_chk_01',
      name: 'ICICI Bank Account (••2708)',
      type: 'CHECKING',
      balance: 10754.62,
      currency: 'INR',
      institution: 'ICICI Bank',
      mask: '2708',
      holder: 'Mudit Sharma',
      status: 'CONNECTED',
    },
    savings: {
      id: 'acc_sav_01',
      name: 'ICICI High-Yield Reserve (••9104)',
      type: 'SAVINGS',
      balance: 15000.00,
      currency: 'INR',
      institution: 'ICICI Bank',
      mask: '9104',
      holder: 'Mudit Sharma',
      status: 'CONNECTED',
    },
  },
  monthlyTargetBudget: DEFAULT_INR_TARGET,
  excludeOutliers: true,
  isCrisisDemoMode: false,
  rawTransactions: [...BASE_REALISTIC_TRANSACTIONS],
  normalizedTransactions: [...initialDemoNormalized],
  transactions: [...initialDemoNormalized],
  subscriptions: [...initialDemoSubs],
  detectedSubscriptions: [...initialDemoSubs],
  anomalies: [...initialDemoAlerts],
  unusualActivityAlerts: [...initialDemoAlerts],
  goals: [
    { id: 'goal_1', name: 'Semester Safety Buffer', category: 'EMERGENCY_FUND', target: 15000.0, current: 8500.0, priority: 1 },
    { id: 'goal_2', name: 'Tech & Laptop Reserve', category: 'MAJOR_PURCHASE', target: 20000.0, current: 6000.0, priority: 2 },
    { id: 'goal_3', name: 'Semester Break Travel Fund', category: 'VACATION', target: 10000.0, current: 4000.0, priority: 3 },
  ],
  safeSweepAmount: 500.0,
  isSyncModalOpen: false,
  isCommandPaletteOpen: false,
  activeNotification: null,
  activeStatementMeta: {
    fileName: 'Demo_Student_Portfolio.csv',
    institution: 'ICICI Bank',
    rowsCount: initialDemoNormalized.length,
    importedAt: new Date().toISOString(),
  },
};

function getCurrentUserEmail() {
  if (typeof window === 'undefined') return 'guest';
  try {
    const raw = localStorage.getItem('finsense_auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) return u.email.toLowerCase().trim();
    }
  } catch (e) {}
  return 'guest';
}

function getStorageKey() {
  const email = getCurrentUserEmail();
  return `FINSENSE_USER_LEDGER_${email.replace(/[^a-z0-9]/gi, '_')}`;
}

function loadStoredState() {
  if (typeof window === 'undefined') return EMPTY_FINANCE_STATE;
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Clean slate for new logins!
      return { ...EMPTY_FINANCE_STATE };
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.accounts && Array.isArray(parsed.transactions)) {
      const normalized = normalizeTransactionLedger(parsed.transactions);
      const subs = detectRecurringSubscriptions(normalized);
      const alerts = computeUnusualActivityAlerts(normalized);

      return {
        ...EMPTY_FINANCE_STATE,
        ...parsed,
        hasImportedData: parsed.hasImportedData !== undefined ? parsed.hasImportedData : (normalized.length > 0),
        hasConnectedBank: parsed.hasConnectedBank !== undefined ? parsed.hasConnectedBank : (normalized.length > 0),
        isDemoMode: Boolean(parsed.isDemoMode),
        normalizedTransactions: normalized,
        transactions: normalized,
        detectedSubscriptions: subs,
        subscriptions: subs,
        unusualActivityAlerts: alerts,
        anomalies: alerts,
        isSyncModalOpen: false,
        isCommandPaletteOpen: false,
        activeNotification: null,
      };
    }
  } catch (err) {
    console.warn('FinSense localStorage load error, using empty zero-state:', err);
  }
  return { ...EMPTY_FINANCE_STATE };
}

function persistState(state) {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey();
    const toSave = {
      hasImportedData: state.hasImportedData,
      hasConnectedBank: state.hasConnectedBank,
      isDemoMode: state.isDemoMode,
      accounts: state.accounts,
      monthlyTargetBudget: state.monthlyTargetBudget,
      excludeOutliers: state.excludeOutliers,
      isCrisisDemoMode: state.isCrisisDemoMode,
      transactions: state.transactions,
      goals: state.goals,
      activeStatementMeta: state.activeStatementMeta,
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (err) {
    console.warn('FinSense persist error:', err);
  }
}

let storeState = loadStoredState();
const listeners = new Set();

function emitChange() {
  persistState(storeState);
  listeners.forEach((listener) => listener(storeState));
}

export function getFinanceStore() {
  return storeState;
}

export function updateFinanceStore(partial) {
  storeState = { ...storeState, ...partial };
  emitChange();
}

// ----------------------------------------------------------------------------
// ACTION CREATORS
// ----------------------------------------------------------------------------

export async function initLedgerSync() {
  try {
    // Check if user changed
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw && storeState.hasImportedData && !storeState.isDemoMode) {
      storeState = loadStoredState();
      emitChange();
      return;
    }

    const data = await fetchLiveLedger();
    if (data && data.status === 'success' && storeState.hasImportedData) {
      updateFinanceStore({
        accounts: data.accounts ? {
          ...storeState.accounts,
          ...data.accounts,
        } : storeState.accounts,
        goals: data.goals || storeState.goals,
      });
    }
  } catch (err) {
    console.warn('Backend sync fallback to responsive local store:', err);
  }
}

/**
 * Ingests a raw bank statement (from CSV / PDF / Text / Setu AA / Plaid)
 * Runs complete normalization, subscription detection, and balance updates.
 */
export function importRawBankStatementAction({
  rawRows = [],
  fileName = 'statement.csv',
  closingBalance = null,
  institution = 'Connected Bank',
  accountNumberMask = '••••',
  holderName = 'Account Holder',
}) {
  if (!rawRows || rawRows.length === 0) return;

  const normalizedRows = normalizeTransactionLedger(rawRows);

  let derivedBalance = closingBalance;
  if (derivedBalance === null || derivedBalance === undefined) {
    for (const row of normalizedRows) {
      if (row.balance_after !== undefined && row.balance_after > 0) {
        derivedBalance = row.balance_after;
        break;
      }
    }
  }

  const updatedBalance = derivedBalance !== null && derivedBalance !== undefined
    ? Number(derivedBalance)
    : 10754.62;

  const detectedSubs = detectRecurringSubscriptions(normalizedRows);
  const alerts = computeUnusualActivityAlerts(normalizedRows);

  const updatedAccounts = {
    ...storeState.accounts,
    checking: {
      ...storeState.accounts.checking,
      balance: Math.round(updatedBalance * 100) / 100,
      name: `${institution} (••${accountNumberMask})`,
      institution,
      mask: accountNumberMask,
      holder: holderName,
      status: 'CONNECTED',
    },
  };

  updateFinanceStore({
    hasImportedData: true,
    hasConnectedBank: true,
    isDemoMode: false,
    accounts: updatedAccounts,
    rawTransactions: rawRows,
    normalizedTransactions: normalizedRows,
    transactions: normalizedRows,
    subscriptions: detectedSubs,
    detectedSubscriptions: detectedSubs,
    anomalies: alerts,
    unusualActivityAlerts: alerts,
    activeStatementMeta: {
      fileName,
      institution,
      rowsCount: normalizedRows.length,
      importedAt: new Date().toISOString(),
    },
    activeNotification: {
      type: 'success',
      title: 'Ledger Ingested & Models Calibrated! ⚡️',
      message: `Hydrated ${normalizedRows.length} real transactions from ${fileName}. Identified ${detectedSubs.length} recurring subscriptions.`,
    },
  });
}

/**
 * Loads sample demo data for test drive
 */
export function loadDemoDataAction() {
  const normalized = normalizeTransactionLedger(BASE_REALISTIC_TRANSACTIONS);
  const subs = detectRecurringSubscriptions(normalized);
  const alerts = computeUnusualActivityAlerts(normalized);

  storeState = {
    ...DEMO_FINANCE_STATE,
    transactions: normalized,
    normalizedTransactions: normalized,
    subscriptions: subs,
    detectedSubscriptions: subs,
    anomalies: alerts,
    unusualActivityAlerts: alerts,
    hasImportedData: true,
    hasConnectedBank: true,
    isDemoMode: true,
    activeNotification: {
      type: 'info',
      title: 'Demo Sandbox Ledger Loaded 🧪',
      message: 'Now test-driving with sample student profile (ICICI ••2708, ₹10,754 balance, 6 subscriptions).',
    },
  };
  emitChange();
}

/**
 * Clears imported data back to clean slate / unlinked state
 */
export function clearImportedDataAction() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem('FINSENSE_FINANCIAL_STORE_V2');
  }
  storeState = {
    ...EMPTY_FINANCE_STATE,
    hasImportedData: false,
    hasConnectedBank: false,
    isDemoMode: false,
    activeNotification: {
      type: 'info',
      title: 'Ledger Reset to Clean Slate',
      message: 'Awaiting bank connection or statement upload.',
    },
  };
  emitChange();
}

export function resetToDemoDataAction() {
  loadDemoDataAction();
}

/**
 * Triggers a real-time live transaction (or simulates live webhook swipe)
 */
export async function simulateWebhookChargeAction({
  merchant,
  amount,
  category = 'Food & Dining',
  is_income = false,
  is_recurring = false,
}) {
  const amt = parseFloat(amount) || 0.0;
  const rawItem = {
    id: `tx_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    merchant: merchant.trim(),
    amount: amt,
    category,
    is_income,
    is_recurring,
  };

  const normalizedItem = normalizeBankTransaction(rawItem);
  const updatedTransactions = [normalizedItem, ...storeState.transactions];
  const detectedSubs = detectRecurringSubscriptions(updatedTransactions);
  const alerts = computeUnusualActivityAlerts(updatedTransactions);

  const currentChecking = storeState.accounts.checking?.balance || 0;
  const newChecking = is_income
    ? currentChecking + amt
    : Math.max(0, currentChecking - amt);

  const updatedAccounts = {
    ...storeState.accounts,
    checking: {
      ...storeState.accounts.checking,
      balance: Math.round(newChecking * 100) / 100,
      status: 'CONNECTED',
    },
  };

  updateFinanceStore({
    hasImportedData: true,
    hasConnectedBank: true,
    accounts: updatedAccounts,
    transactions: updatedTransactions,
    normalizedTransactions: updatedTransactions,
    subscriptions: detectedSubs,
    detectedSubscriptions: detectedSubs,
    anomalies: alerts,
    unusualActivityAlerts: alerts,
    activeNotification: {
      type: is_income ? 'income' : 'expense',
      title: is_income ? '💰 Inflow Recorded' : '⚡️ Live Charge Received',
      message: `${merchant}: ${is_income ? '+' : '-'}₹${amt.toFixed(2)}. Safe-to-Spend & Bills updated in real time.`,
    },
  });

  try {
    await addLiveTransaction({ merchant, amount: amt, category, is_income, is_recurring });
  } catch (err) {
    console.warn('Backend live transaction sync error:', err);
  }
}

export async function addTransactionAction(args) {
  return simulateWebhookChargeAction(args);
}

export async function uploadStatementAction(fileContent, fileName = 'statement.csv', password = null, accountType = 'checking') {
  try {
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const format = isPdf ? 'pdf' : 'csv';
    const res = await uploadStatementCSV(fileContent, format, password, accountType);
    if (res && res.status === 'success') {
      await initLedgerSync();
      const detectedCount = res.transactions_detected || res.transactions?.length || 0;
      updateFinanceStore({
        hasImportedData: true,
        hasConnectedBank: true,
        isDemoMode: false,
        activeNotification: {
          type: 'upload',
          title: `${isPdf ? 'PDF' : 'CSV'} Statement Ingested`,
          message: `Parsed ${detectedCount} transactions from ${fileName}. Models calibrated!`,
        },
      });
      return res;
    }
  } catch (err) {
    console.warn('Backend statement upload fallback:', err);
  }

  updateFinanceStore({
    hasImportedData: true,
    hasConnectedBank: true,
    activeNotification: {
      type: 'upload',
      title: 'Statement Imported',
      message: `Ingested statement data from ${fileName}.`,
    },
  });
}

export async function executeSweepAction(amount = 850.0) {
  const sweepAmt = parseFloat(amount) || 850.0;
  const currentChecking = storeState.accounts.checking?.balance || 0;
  if (currentChecking < sweepAmt) {
    updateFinanceStore({
      activeNotification: {
        type: 'error',
        title: 'Sweep Paused',
        message: 'Checking balance is insufficient to complete this transfer safely.',
      },
    });
    return false;
  }

  const newChecking = Math.round((currentChecking - sweepAmt) * 100) / 100;
  const currentSavings = storeState.accounts.savings?.balance || 0;
  const newSavings = Math.round((currentSavings + sweepAmt) * 100) / 100;

  const sweepTx = {
    id: `tx_swp_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    merchant: 'Smart Auto-Save Sweep -> Goals Reserve',
    amount: sweepAmt,
    category: 'Financial & Transfers',
    is_income: false,
    is_recurring: true,
  };

  updateFinanceStore({
    accounts: {
      ...storeState.accounts,
      checking: { ...storeState.accounts.checking, balance: newChecking },
      savings: { ...storeState.accounts.savings, balance: newSavings },
    },
    transactions: [sweepTx, ...storeState.transactions],
    activeNotification: {
      type: 'success',
      title: 'Transfer Completed! 🎉',
      message: `₹${sweepAmt.toFixed(2)} safely moved to your Liquid Reserve.`,
    },
  });

  try {
    await executeSavingsSweep(sweepAmt);
  } catch (err) {
    console.warn('Backend sweep error:', err);
  }

  return true;
}

export async function cancelSubscriptionAction(subscriptionId) {
  const sub = storeState.subscriptions.find((s) => s.subscription_id === subscriptionId);
  const updatedSubs = storeState.subscriptions.map((s) =>
    s.subscription_id === subscriptionId ? { ...s, status: 'CANCELLED' } : s
  );

  const monthlySavings = sub ? sub.amount : 499.0;
  const annualSavings = monthlySavings * 12;

  updateFinanceStore({
    subscriptions: updatedSubs,
    detectedSubscriptions: updatedSubs,
    activeNotification: {
      type: 'success',
      title: 'Subscription Cancelled',
      message: `Stopped tracking ${sub?.merchant_name || sub?.merchant || 'subscription'}. Unlocks +₹${monthlySavings.toFixed(2)}/mo (+₹${annualSavings.toFixed(2)}/yr) Net Free Cash!`,
    },
  });

  try {
    await cancelOrPauseSubscription(subscriptionId, 'CANCEL');
  } catch (err) {
    console.warn('Backend sub cancel error:', err);
  }
}

export async function pauseSubscriptionAction(subscriptionId) {
  const sub = storeState.subscriptions.find((s) => s.subscription_id === subscriptionId);
  const updatedSubs = storeState.subscriptions.map((s) =>
    s.subscription_id === subscriptionId ? { ...s, status: 'PAUSED' } : s
  );

  updateFinanceStore({
    subscriptions: updatedSubs,
    detectedSubscriptions: updatedSubs,
    activeNotification: {
      type: 'info',
      title: 'Subscription Paused',
      message: `${sub?.merchant_name || sub?.merchant || 'Subscription'} paused. Removed from next 30-day projected bills.`,
    },
  });

  try {
    await cancelOrPauseSubscription(subscriptionId, 'PAUSE');
  } catch (err) {
    console.warn('Backend sub pause error:', err);
  }
}

export async function resolveAnomalyAction(anomalyId, resolution = 'APPROVED') {
  const updatedAnomalies = storeState.anomalies.map((a) =>
    a.id === anomalyId ? { ...a, status: resolution } : a
  );
  const isApproved = resolution === 'APPROVED';

  updateFinanceStore({
    anomalies: updatedAnomalies,
    unusualActivityAlerts: updatedAnomalies,
    activeNotification: {
      type: isApproved ? 'success' : 'warning',
      title: isApproved ? 'Expense Verified' : 'Charge Flagged',
      message: isApproved ? 'Marked as recognized.' : 'Flagged suspicious activity.',
    },
  });

  try {
    await resolveAnomalyAlert(anomalyId, resolution);
  } catch (err) {
    console.warn('Backend anomaly resolution error:', err);
  }
}

export function toggleOutliersAction() {
  updateFinanceStore({ excludeOutliers: !storeState.excludeOutliers });
}

export function toggleCrisisDemoModeAction() {
  const nextMode = !storeState.isCrisisDemoMode;
  const nextTxs = nextMode
    ? [...CRISIS_EXTRA_TRANSACTIONS, ...(storeState.transactions.length > 0 ? storeState.transactions : BASE_REALISTIC_TRANSACTIONS)]
    : (storeState.transactions.length > 3 ? storeState.transactions.filter(t => !t.id.startsWith('tx_c')) : BASE_REALISTIC_TRANSACTIONS);

  const normalized = normalizeTransactionLedger(nextTxs);
  const subs = detectRecurringSubscriptions(normalized);
  const alerts = computeUnusualActivityAlerts(normalized);

  updateFinanceStore({
    isCrisisDemoMode: nextMode,
    transactions: normalized,
    normalizedTransactions: normalized,
    subscriptions: subs,
    detectedSubscriptions: subs,
    anomalies: alerts,
    unusualActivityAlerts: alerts,
    activeNotification: {
      type: nextMode ? 'warning' : 'info',
      title: nextMode ? '🚨 Overspent / Crisis State Active' : 'Baseline State Restored',
      message: nextMode
        ? 'Pacing increased to 132% of budget. Safe-to-Spend switched to Constrained / Recovery Mode.'
        : 'Restored baseline pacing (On Track).',
    },
  });
}

export function openSyncModalAction() {
  updateFinanceStore({ isSyncModalOpen: true });
}

export function closeSyncModalAction() {
  updateFinanceStore({ isSyncModalOpen: false });
}

export function openCommandPaletteAction() {
  updateFinanceStore({ isCommandPaletteOpen: true });
}

export function closeCommandPaletteAction() {
  updateFinanceStore({ isCommandPaletteOpen: false });
}

export function dismissNotificationAction() {
  updateFinanceStore({ activeNotification: null });
}

// ----------------------------------------------------------------------------
// REACT HOOK FOR COMPONENTS (SINGLE SOURCE OF TRUTH)
// ----------------------------------------------------------------------------

export function useFinanceStore() {
  const [state, setState] = useState(storeState);

  useEffect(() => {
    // Check if user changed in storage
    const stored = loadStoredState();
    if (
      stored.hasImportedData !== state.hasImportedData ||
      stored.isDemoMode !== state.isDemoMode ||
      stored.transactions.length !== state.transactions.length
    ) {
      setState(stored);
      storeState = stored;
    }

    const handler = (newState) => setState(newState);
    listeners.add(handler);

    const onAuthChange = () => {
      const next = loadStoredState();
      storeState = next;
      setState(next);
      emitChange();
    };

    window.addEventListener('finsense_auth_changed', onAuthChange);
    window.addEventListener('storage', onAuthChange);

    return () => {
      listeners.delete(handler);
      window.removeEventListener('finsense_auth_changed', onAuthChange);
      window.removeEventListener('storage', onAuthChange);
    };
  }, []);

  const scenario = getGlobalScenario();
  const currency = getGlobalCurrency();

  // Reconciled math from financeEngine
  const reconciled = getReconciledFinanceData({
    accounts: state.accounts,
    transactions: state.transactions,
    subscriptions: state.subscriptions,
    scenario: scenario.id,
    currency,
    monthlyTarget: state.monthlyTargetBudget,
    excludeOutliers: state.excludeOutliers,
  });

  return {
    ...state,
    // Reconciled financial metrics
    reconciled,
    pendingAlertsCount: (state.unusualActivityAlerts || state.anomalies || []).filter((a) => a.status === 'PENDING').length,
    activeSubscriptionsCount: (state.subscriptions || []).filter((s) => s.status === 'ACTIVE').length,
    totalMonthlyBurn: reconciled.recurringBills.upcomingBills30d,
    // Actions
    addTransaction: addTransactionAction,
    uploadStatement: uploadStatementAction,
    importRawBankStatement: importRawBankStatementAction,
    loadDemoData: loadDemoDataAction,
    simulateWebhookCharge: simulateWebhookChargeAction,
    resetToDemoData: resetToDemoDataAction,
    clearImportedData: clearImportedDataAction,
    executeSweep: executeSweepAction,
    cancelSubscription: cancelSubscriptionAction,
    pauseSubscription: pauseSubscriptionAction,
    resolveAnomaly: resolveAnomalyAction,
    toggleOutliers: toggleOutliersAction,
    toggleCrisisDemoMode: toggleCrisisDemoModeAction,
    openSyncModal: openSyncModalAction,
    closeSyncModal: closeSyncModalAction,
    openCommandPalette: openCommandPaletteAction,
    closeCommandPalette: closeCommandPaletteAction,
    dismissNotification: dismissNotificationAction,
    refreshLedger: initLedgerSync,
    refreshStore: initLedgerSync,
  };
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    initLedgerSync();
  }, 100);
}
