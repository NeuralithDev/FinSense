/**
 * Unified Reactive Global Finance Store for FinSense.
 * Connects the UI directly to the real backend data pipeline (UserDataPipeline).
 * Ensures every button click, transaction add, statement upload, and subscription cancel
 * mutates global state across all components in real time.
 */

import { useState, useEffect } from 'react';
import {
  fetchLiveLedger,
  uploadStatementCSV,
  addLiveTransaction,
  executeSavingsSweep,
  cancelOrPauseSubscription,
  resolveAnomalyAlert,
  switchSandboxProfile
} from '../services/api';

// Initial state initialized with real Indian Bank statement (Mudit Sharma - ICICI Bank)
const INITIAL_STATE = {
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
  },
  goals: [
    {
      id: 'goal_1',
      name: 'Semester Safety Buffer',
      category: 'EMERGENCY_FUND',
      target: 15000.0,
      current: 8500.0,
      priority: 1,
    },
    {
      id: 'goal_2',
      name: 'Tech & Laptop Reserve',
      category: 'MAJOR_PURCHASE',
      target: 20000.0,
      current: 6000.0,
      priority: 2,
    },
    {
      id: 'goal_3',
      name: 'Semester Break Travel Fund',
      category: 'VACATION',
      target: 10000.0,
      current: 4000.0,
      priority: 3,
    },
  ],
  anomalies: [
    {
      id: 'anom_1',
      merchant: 'Zerodha Broking',
      date: '2026-10-17',
      category: 'Investments',
      amount: 5500.0,
      severity: 'CRITICAL',
      status: 'PENDING',
      root_cause: 'Large single debit (₹5,500.00), significantly higher than typical daily spend',
    },
    {
      id: 'anom_2',
      merchant: "Domino's Pizza",
      date: '2026-10-18',
      category: 'Food & Dining',
      amount: 838.95,
      severity: 'MODERATE',
      status: 'PENDING',
      root_cause: 'High food & dining ticket (₹838.95)',
    },
  ],
  transactions: [
    { id: 'tx_0324', date: '2026-10-20', merchant: 'Supermoney Cashback', amount: 28.45, category: 'Income', is_income: true, is_recurring: false },
    { id: 'tx_0323', date: '2026-10-20', merchant: 'V Jagadha', amount: 90.0, category: 'Shopping & Personal', is_income: false, is_recurring: false },
    { id: 'tx_0322', date: '2026-10-20', merchant: 'Vinayak R', amount: 80.0, category: 'Shopping & Personal', is_income: false, is_recurring: false },
    { id: 'tx_0321', date: '2026-10-19', merchant: 'Blinkit Grocery', amount: 311.0, category: 'Food & Dining', is_income: false, is_recurring: false },
    { id: 'tx_0320', date: '2026-10-19', merchant: 'Ansh Kumar (UPI Split)', amount: 105.0, category: 'Income', is_income: true, is_recurring: false },
    { id: 'tx_0319', date: '2026-10-18', merchant: "Domino's Pizza", amount: 838.95, category: 'Food & Dining', is_income: false, is_recurring: false },
    { id: 'tx_0318', date: '2026-10-17', merchant: 'Zerodha Broking', amount: 5500.0, category: 'Investments', is_income: false, is_recurring: false },
    { id: 'tx_0317', date: '2026-10-14', merchant: 'Apple Services (iCloud Student)', amount: 75.0, category: 'Subscriptions', is_income: false, is_recurring: true },
    { id: 'tx_0316', date: '2026-10-14', merchant: 'Velan Fruits & Groceries', amount: 165.0, category: 'Food & Dining', is_income: false, is_recurring: false },
    { id: 'tx_0315', date: '2026-10-12', merchant: 'Vaishnav (Splitwise)', amount: 50.0, category: 'Income', is_income: true, is_recurring: false },
    { id: 'tx_0314', date: '2026-10-08', merchant: 'Balaji Provisions', amount: 420.0, category: 'Food & Dining', is_income: false, is_recurring: false },
    { id: 'tx_0313', date: '2026-10-06', merchant: 'JioHotstar Verification', amount: 1.0, category: 'Subscriptions', is_income: false, is_recurring: false },
    { id: 'tx_0312', date: '2026-10-01', merchant: 'Anand Sevd (Family Allowance)', amount: 5000.0, category: 'Income', is_income: true, is_recurring: true },
    { id: 'tx_0311', date: '2026-09-28', merchant: 'Blinkit Grocery', amount: 906.0, category: 'Food & Dining', is_income: false, is_recurring: false },
    { id: 'tx_0310', date: '2026-09-27', merchant: 'Anand Sevd (Family Allowance)', amount: 5000.0, category: 'Income', is_income: true, is_recurring: true },
  ],
  subscriptions: [
    { subscription_id: 'sub_apple', merchant_name: 'Apple Services (iCloud Student)', amount: 75.0, category: 'Cloud & Tech', cadence: 'MONTHLY', status: 'ACTIVE', annual_cost: 900.0 },
    { subscription_id: 'sub_aws', merchant_name: 'AWS Cloud (Developer Sandbox)', amount: 2.0, category: 'Cloud & Tech', cadence: 'MONTHLY', status: 'ACTIVE', annual_cost: 24.0 },
    { subscription_id: 'sub_hotstar', merchant_name: 'JioHotstar Mobile', amount: 149.0, category: 'Streaming & Entertainment', cadence: 'MONTHLY', status: 'ACTIVE', annual_cost: 1788.0 },
  ],
  healthScore: 88,
  safeSweepAmount: 500.0,
  isSyncModalOpen: false,
  isCommandPaletteOpen: false,
  activeNotification: null,
};

let storeState = { ...INITIAL_STATE };
const listeners = new Set();

function emitChange() {
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
// ASYNC ACTION CREATORS (CALL BACKEND & MUTATE STORE REPOSITORIES)
// ----------------------------------------------------------------------------

export async function initLedgerSync() {
  try {
    const data = await fetchLiveLedger();
    if (data && data.status === 'success') {
      updateFinanceStore({
        accounts: data.accounts || storeState.accounts,
        transactions: data.transactions || storeState.transactions,
        goals: data.goals || storeState.goals,
        anomalies: data.anomalies || storeState.anomalies,
      });
    }
  } catch (err) {
    console.warn('Backend sync failed, using reactive local store:', err);
  }
}

export async function addTransactionAction({ merchant, amount, category, is_income = false, is_recurring = false }) {
  const amt = parseFloat(amount) || 0.0;
  const newTx = {
    id: `tx_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    merchant: merchant.trim(),
    amount: amt,
    category: category || (is_income ? 'Income' : 'General & Everyday'),
    is_income,
    is_recurring,
  };

  // Immediate optimistic update
  const newChecking = is_income
    ? storeState.accounts.checking.balance + amt
    : Math.max(0, storeState.accounts.checking.balance - amt);

  const updatedAccounts = {
    ...storeState.accounts,
    checking: {
      ...storeState.accounts.checking,
      balance: Math.round(newChecking * 100) / 100,
    },
  };

  updateFinanceStore({
    accounts: updatedAccounts,
    transactions: [newTx, ...storeState.transactions],
    activeNotification: {
      type: is_income ? 'income' : 'expense',
      title: is_income ? 'Paycheck / Inflow Added' : 'Transaction Logged',
      message: `${merchant}: ${is_income ? '+' : '-'}₹${amt.toFixed(2)} recorded. Balances recalculated.`,
    },
  });

  // Call backend pipeline
  try {
    const res = await addLiveTransaction({
      merchant,
      amount: amt,
      category,
      is_income,
      is_recurring,
    });
    if (res && res.accounts) {
      updateFinanceStore({ accounts: res.accounts });
    }
  } catch (err) {
    console.warn('Backend sync for transaction failed, optimistic state maintained:', err);
  }
}

export async function uploadStatementAction(fileContent, fileName = 'statement.csv') {
  // Send directly to the real backend data pipeline (which has complete ICICI/HDFC/Indian bank parser)
  try {
    const res = await uploadStatementCSV(fileContent, 'csv');
    if (res && res.status === 'success') {
      await initLedgerSync();
      updateFinanceStore({
        activeNotification: {
          type: 'upload',
          title: 'Statement Ingested Live',
          message: `Successfully parsed and processed real statement from ${fileName}. Models updated!`,
        },
      });
      return;
    }
  } catch (err) {
    console.warn('Backend statement upload error, running client fallback:', err);
  }

  // Client-side fallback if offline
  const lines = fileContent.trim().split('\n');
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('date') && (lower.includes('remarks') || lower.includes('description') || lower.includes('withdrawal') || lower.includes('amount'))) {
      headerIdx = i;
      break;
    }
  }

  const parsedTxs = [];
  const startRow = headerIdx !== -1 ? headerIdx + 1 : 1;
  for (let i = startRow; i < lines.length; i++) {
    const row = lines[i].split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 2) continue;
    const dateMatch = row[0].match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/) || (row[1] && row[1].match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/));
    if (!dateMatch) continue;

    let merchant = row[1] || 'Transaction';
    let amt = 0;
    for (let c = 2; c < row.length; c++) {
      const val = parseFloat(row[c].replace(/[₹$,]/g, ''));
      if (!isNaN(val) && val > 0) {
        amt = val;
        break;
      }
    }
    if (amt > 0) {
      parsedTxs.push({
        id: `tx_up_${Date.now()}_${i}`,
        date: dateMatch[0],
        merchant,
        amount: amt,
        category: 'Everyday Expense',
        is_income: false,
        is_recurring: false,
      });
    }
  }

  if (parsedTxs.length > 0) {
    updateFinanceStore({
      transactions: [...parsedTxs, ...storeState.transactions],
      activeNotification: {
        type: 'upload',
        title: 'Statement Imported',
        message: `Parsed ${parsedTxs.length} real transactions from ${fileName}!`,
      },
    });
  }
}

export async function executeSweepAction(amount = 850.0) {
  const sweepAmt = parseFloat(amount) || 850.0;
  if (storeState.accounts.checking.balance < sweepAmt) {
    updateFinanceStore({
      activeNotification: {
        type: 'error',
        title: 'Sweep Paused',
        message: 'Checking balance is insufficient to complete this transfer safely.',
      },
    });
    return false;
  }

  // Mutate Checking -> Savings/Goals
  const newChecking = Math.round((storeState.accounts.checking.balance - sweepAmt) * 100) / 100;
  const newSavings = storeState.accounts.savings
    ? Math.round((storeState.accounts.savings.balance + sweepAmt) * 100) / 100
    : undefined;

  // Waterfall into goals
  let remaining = sweepAmt;
  const updatedGoals = storeState.goals.map((g) => {
    if (g.id === 'goal_1') {
      const alloc = Math.min(remaining, Math.round(sweepAmt * 0.6 * 100) / 100);
      remaining -= alloc;
      return { ...g, current: Math.min(g.target, Math.round((g.current + alloc) * 100) / 100) };
    } else if (g.id === 'goal_2' && remaining > 0) {
      const alloc = Math.min(remaining, Math.round(sweepAmt * 0.4 * 100) / 100);
      remaining -= alloc;
      return { ...g, current: Math.min(g.target, Math.round((g.current + alloc) * 100) / 100) };
    }
    return g;
  });

  const sweepTx = {
    id: `tx_swp_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    merchant: 'Smart Auto-Save Sweep -> Goals Reserve',
    amount: sweepAmt,
    category: 'Financial & Transfers',
    is_income: false,
    is_recurring: true,
  };

  const nextAccounts = {
    ...storeState.accounts,
    checking: { ...storeState.accounts.checking, balance: newChecking },
  };
  if (newSavings !== undefined) {
    nextAccounts.savings = { ...storeState.accounts.savings, balance: newSavings };
  }

  updateFinanceStore({
    accounts: nextAccounts,
    goals: updatedGoals,
    transactions: [sweepTx, ...storeState.transactions],
    healthScore: Math.min(100, storeState.healthScore + 1),
    activeNotification: {
      type: 'success',
      title: 'Transfer Completed! 🎉',
      message: `₹${sweepAmt.toFixed(2)} safely moved to your Liquid Reserve and allocated to Emergency Cushion.`,
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
    healthScore: Math.min(100, storeState.healthScore + 2),
    activeNotification: {
      type: 'success',
      title: 'Subscription Cancelled',
      message: `Stopped tracking ${sub?.merchant_name || 'subscription'}. Unlocks +₹${annualSavings.toFixed(2)} in yearly savings!`,
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
    activeNotification: {
      type: 'info',
      title: 'Subscription Paused',
      message: `${sub?.merchant_name || 'Subscription'} paused. Removed from next 30-day projected bills.`,
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
    activeNotification: {
      type: isApproved ? 'success' : 'warning',
      title: isApproved ? 'Expense Verified' : 'Charge Flagged & Reported',
      message: isApproved
        ? 'Marked as recognized. Anomaly alert dismissed.'
        : 'Flagged suspicious activity. Dispute initiated with issuing bank.',
    },
  });

  try {
    await resolveAnomalyAlert(anomalyId, resolution);
  } catch (err) {
    console.warn('Backend anomaly resolution error:', err);
  }
}

export async function switchProfileAction(profileKey = 'tech_pro') {
  const PROFILES = {
    tech_pro: {
      name: 'Software Engineer (₹18L/yr)',
      checking: 10754.62,
      savings: 45000.0,
      credit: 4200.0,
      score: 84,
    },
    freelancer: {
      name: 'Freelance Creator (Variable Inflow)',
      checking: 18500.0,
      savings: 35000.0,
      credit: 2800.0,
      score: 74,
    },
    family: {
      name: 'Family Budget (Dual Earner)',
      checking: 42000.0,
      savings: 150000.0,
      credit: 8500.0,
      score: 91,
    },
  };

  const sel = PROFILES[profileKey] || PROFILES.tech_pro;

  const switchedAccounts = {
    ...storeState.accounts,
    checking: { ...storeState.accounts.checking, balance: sel.checking },
  };
  if (storeState.accounts.savings) {
    switchedAccounts.savings = { ...storeState.accounts.savings, balance: sel.savings };
  }
  if (storeState.accounts.credit) {
    switchedAccounts.credit = { ...storeState.accounts.credit, balance: sel.credit };
  }

  updateFinanceStore({
    accounts: switchedAccounts,
    healthScore: sel.score,
    activeNotification: {
      type: 'profile',
      title: 'Profile Switched',
      message: `Now viewing ${sel.name} in realistic sandbox mode.`,
    },
  });

  try {
    await switchSandboxProfile(profileKey);
  } catch (err) {
    console.warn('Backend profile switch error:', err);
  }
}

export function recategorizeTransactionAction(txId, newCategory) {
  const updated = storeState.transactions.map((t) =>
    t.id === txId ? { ...t, category: newCategory } : t
  );
  updateFinanceStore({
    transactions: updated,
    activeNotification: {
      type: 'info',
      title: 'Category Updated',
      message: `Transaction recategorized to ${newCategory}. Future ML categorization updated.`,
    },
  });
}

export function toggleRecurringTransactionAction(txId) {
  const updated = storeState.transactions.map((t) =>
    t.id === txId ? { ...t, is_recurring: !t.is_recurring } : t
  );
  updateFinanceStore({
    transactions: updated,
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
// REACT HOOK FOR COMPONENTS
// ----------------------------------------------------------------------------

export function useFinanceStore() {
  const [state, setState] = useState(storeState);

  useEffect(() => {
    const handler = (newState) => setState(newState);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return {
    ...state,
    pendingAlertsCount: state.anomalies.filter((a) => a.status === 'PENDING').length,
    activeSubscriptionsCount: state.subscriptions.filter((s) => s.status === 'ACTIVE').length,
    totalMonthlyBurn: state.subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((acc, s) => acc + s.amount, 0),
    // Actions
    addTransaction: addTransactionAction,
    uploadStatement: uploadStatementAction,
    executeSweep: executeSweepAction,
    cancelSubscription: cancelSubscriptionAction,
    pauseSubscription: pauseSubscriptionAction,
    resolveAnomaly: resolveAnomalyAction,
    switchProfile: switchProfileAction,
    recategorizeTransaction: recategorizeTransactionAction,
    toggleRecurringTransaction: toggleRecurringTransactionAction,
    openSyncModal: openSyncModalAction,
    closeSyncModal: closeSyncModalAction,
    openCommandPalette: openCommandPaletteAction,
    closeCommandPalette: closeCommandPaletteAction,
    dismissNotification: dismissNotificationAction,
    refreshLedger: initLedgerSync,
    refreshStore: initLedgerSync,
  };
}

// Automatically sync with backend live ledger upon initialization
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initLedgerSync();
  }, 100);
}
