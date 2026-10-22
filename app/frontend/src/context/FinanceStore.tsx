/**
 * FinSense Unified Finance Context & Store (TypeScript Adapter)
 * 
 * Re-exports the global reactive finance store for TypeScript consumers,
 * providing strict typing across raw transactions, normalized transactions,
 * detected subscriptions, and unusual activity alerts.
 */

import React, { createContext, useContext } from 'react';
import {
  useFinanceStore as useBaseFinanceStore,
  importRawBankStatementAction,
  simulateWebhookChargeAction,
  resetToDemoDataAction,
  clearImportedDataAction,
  openSyncModalAction,
  closeSyncModalAction,
} from '../store/financeStore';
import type { NormalizedTransaction } from '../utils/transactionNormalizer';
import type { RecurringSubscription } from '../utils/recurringEngine';

export interface UnusualActivityAlert {
  id: string;
  tx_id?: string;
  merchant: string;
  date: string;
  category: string;
  amount: number;
  severity: 'CRITICAL' | 'MODERATE' | 'LOW';
  consensus_tier?: 'TIER_1_CONSENSUS' | 'TIER_2_WATCHLIST';
  status: 'PENDING' | 'RESOLVED' | 'APPROVED' | 'FLAGGED';
  root_cause: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
  balance: number;
  currency: string;
  institution: string;
  mask: string;
  holder: string;
  status: 'CONNECTED' | 'DISCONNECTED';
}

export interface FinanceStoreContextType {
  accounts: {
    checking: BankAccount;
    savings: BankAccount;
  };
  transactions: NormalizedTransaction[];
  normalizedTransactions: NormalizedTransaction[];
  rawTransactions: any[];
  subscriptions: RecurringSubscription[];
  detectedSubscriptions: RecurringSubscription[];
  anomalies: UnusualActivityAlert[];
  unusualActivityAlerts: UnusualActivityAlert[];
  isSyncModalOpen: boolean;
  reconciled: any;
  pendingAlertsCount: number;
  activeSubscriptionsCount: number;
  totalMonthlyBurn: number;
  importRawBankStatement: typeof importRawBankStatementAction;
  simulateWebhookCharge: typeof simulateWebhookChargeAction;
  resetToDemoData: typeof resetToDemoDataAction;
  clearImportedData: typeof clearImportedDataAction;
  openSyncModal: typeof openSyncModalAction;
  closeSyncModal: typeof closeSyncModalAction;
}

const FinanceContext = createContext<FinanceStoreContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const store = useBaseFinanceStore();
  return (
    <FinanceContext.Provider value={store as unknown as FinanceStoreContextType}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceContext(): FinanceStoreContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    // Fallback to hook directly if outside provider
    return useBaseFinanceStore() as unknown as FinanceStoreContextType;
  }
  return ctx;
}

export {
  useBaseFinanceStore as useFinanceStore,
  importRawBankStatementAction,
  simulateWebhookChargeAction,
  resetToDemoDataAction,
  clearImportedDataAction,
};
