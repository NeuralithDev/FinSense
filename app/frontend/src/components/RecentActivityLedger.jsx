import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Tag,
  Repeat,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';

export default function RecentActivityLedger() {
  const { format, currency } = useCurrency();
  const {
    accounts,
    transactions,
    openSyncModal,
    recategorizeTransaction,
    toggleRecurringTransaction,
  } = useFinanceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingCategoryTxId, setEditingCategoryTxId] = useState(null);

  const categories = [
    'ALL',
    'Food & Dining',
    'Subscriptions',
    'Shopping & Personal',
    'Transportation',
    'Income',
    'Housing & Rent',
  ];

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.amount).includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'ALL' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      marginBottom: '24px',
    }}>
      {/* SECTION HEADER & CONNECTED ACCOUNTS */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid #F1F5F9',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488',
            }}>
              <Building size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Connected Accounts & Live Activity
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0',
            }}>
              {Object.keys(accounts || {}).length} Linked Account{Object.keys(accounts || {}).length !== 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '4px 0 0 0' }}>
            Direct real-time balances and ledger feeding all predictive models, anomaly detectors, and autopilot sweeps.
          </p>
        </div>

        <button
          onClick={openSyncModal}
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={15} /> Add Real Data / Sync Bank
        </button>
      </div>

      {/* ACCOUNT BALANCES TILES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: Object.keys(accounts || {}).length === 1 ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {Object.entries(accounts || {}).map(([key, acc]) => {
          const isChecking = acc.type === 'CHECKING' || key === 'checking';
          const isSavings = acc.type === 'SAVINGS' || key === 'savings';
          const isCredit = acc.type === 'CREDIT' || key === 'credit';

          return (
            <div
              key={acc.id || key}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  {acc.name || (isChecking ? 'Checking Account' : isSavings ? 'Savings Reserve' : 'Credit Account')}
                </span>
                {isChecking && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                    Live
                  </span>
                )}
                {isSavings && acc.apy && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#ECFDF5', color: '#047857' }}>
                    {acc.apy}
                  </span>
                )}
                {isCredit && (
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    Limit {format(acc.credit_limit || 0, { decimals: 0 })}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {format(acc.balance || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: isChecking ? '#0D9488' : '#64748B', fontWeight: 600, marginTop: '6px' }}>
                {isChecking
                  ? 'Verified Real Statement Balance • Safe Sweep Ready'
                  : isSavings
                  ? 'Emergency Reserve + Goal Buffers'
                  : 'Autopay Scheduled • Zero Interest'}
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          flex: '1 1 240px',
          maxWidth: '360px',
        }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search transactions or merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  background: isSel ? '#0F172A' : '#F8FAFC',
                  color: isSel ? '#FFFFFF' : '#475569',
                  fontSize: '0.76rem',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div style={{
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 1.4fr 1.2fr 100px 110px',
          padding: '10px 16px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: '#64748B',
          letterSpacing: '0.03em',
        }}>
          <div>DATE</div>
          <div>MERCHANT</div>
          <div>CATEGORY</div>
          <div style={{ textAlign: 'center' }}>RECURRING</div>
          <div style={{ textAlign: 'right' }}>AMOUNT</div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
              No transactions match "{searchQuery}".
            </div>
          ) : (
            filteredTransactions.map((tx, idx) => {
              const isIncome = tx.is_income;
              const isEditing = editingCategoryTxId === tx.id;

              return (
                <div
                  key={tx.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1.4fr 1.2fr 100px 110px',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: idx < filteredTransactions.length - 1 ? '1px solid #F1F5F9' : 'none',
                    fontSize: '0.82rem',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Date */}
                  <span style={{ color: '#64748B', fontSize: '0.78rem' }}>
                    {tx.date}
                  </span>

                  {/* Merchant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isIncome ? '#ECFDF5' : '#F1F5F9',
                      color: isIncome ? '#047857' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {tx.merchant.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.merchant}
                    </span>
                  </div>

                  {/* Category Dropdown */}
                  <div style={{ position: 'relative' }}>
                    {isEditing ? (
                      <select
                        autoFocus
                        value={tx.category}
                        onBlur={() => setEditingCategoryTxId(null)}
                        onChange={(e) => {
                          recategorizeTransaction(tx.id, e.target.value);
                          setEditingCategoryTxId(null);
                        }}
                        style={{
                          fontSize: '0.76rem',
                          padding: '3px 6px',
                          borderRadius: '6px',
                          border: '1px solid #0D9488',
                          outline: 'none',
                          background: '#FFFFFF',
                        }}
                      >
                        {categories.filter((c) => c !== 'ALL').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingCategoryTxId(tx.id)}
                        title="Click to recategorize"
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {tx.category} <ChevronDown size={12} color="#94A3B8" />
                      </button>
                    )}
                  </div>

                  {/* Recurring Toggle */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggleRecurringTransaction(tx.id)}
                      title={tx.is_recurring ? 'Recurring detected (click to toggle)' : 'One-time (click to mark recurring)'}
                      style={{
                        background: tx.is_recurring ? '#EFF6FF' : 'transparent',
                        border: tx.is_recurring ? '1px solid #BFDBFE' : '1px dashed #CBD5E1',
                        color: tx.is_recurring ? '#1D4ED8' : '#94A3B8',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Repeat size={11} /> {tx.is_recurring ? 'Recurring' : 'One-off'}
                    </button>
                  </div>

                  {/* Amount */}
                  <div style={{
                    textAlign: 'right',
                    fontWeight: 700,
                    color: isIncome ? '#166534' : '#0F172A',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}>
                    {isIncome ? `+${format(tx.amount)}` : `-${format(tx.amount)}`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
