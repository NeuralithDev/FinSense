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
  ChevronDown,
  PieChart,
  Target,
  Trash2,
  FileText
} from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';
import { isInCurrentMonthCycle, isExcludedFromMonthlySpend, normalizeTransaction } from '../utils/financeEngine';

export default function RecentActivityLedger() {
  const { format, currency } = useCurrency();
  const {
    accounts,
    transactions,
    hasImportedData,
    isDemoMode,
    activeStatementMeta,
    openSyncModal,
    loadDemoData,
    clearImportedData,
    recategorizeTransaction,
    toggleRecurringTransaction,
  } = useFinanceStore();


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingCategoryTxId, setEditingCategoryTxId] = useState(null);

  const CATEGORY_ICONS = {
    'Food & Dining': '🍔',
    'Shopping & Personal': '🛍️',
    'Subscriptions': '🔄',
    'Transportation': '🚗',
    'General & Everyday': '💳',
    'Entertainment': '🎬',
    'Housing & Rent': '🏠',
    'Utilities': '⚡',
    'Health & Fitness': '🏃',
    'Investments': '📈',
    'Financial & Transfers': '💸',
    'Income': '💰',
  };

  const now = new Date();
  const validDates = (transactions || [])
    .map((t) => new Date(t.date))
    .filter((d) => !isNaN(d.getTime()));

  let monthsSpan = 1.0;
  let activeRefDate = now;
  const hasCurrentMonthTxs = (transactions || []).some((t) => isInCurrentMonthCycle(t.date, now));

  if (!hasCurrentMonthTxs && validDates.length > 0) {
    const minTime = Math.min(...validDates.map((d) => d.getTime()));
    const maxTime = Math.max(...validDates.map((d) => d.getTime()));
    const daysSpan = Math.max(1, Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1);
    monthsSpan = Math.max(1.0, daysSpan / 30.417);
    activeRefDate = new Date(maxTime);
  }

  const dayOfMonth = activeRefDate.getDate() || 21;
  const daysInMonth = new Date(activeRefDate.getFullYear(), activeRefDate.getMonth() + 1, 0).getDate() || 30;

  // Aggregate total and monthly average by category across the statement
  const categoryTotals = {};
  (transactions || []).forEach((t) => {
    const norm = normalizeTransaction(t, currency.code);
    if (norm.is_income || isExcludedFromMonthlySpend(norm)) return;
    const cat = norm.category || 'General & Everyday';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(norm.amount || 0);
  });

  const sortedCatEntries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const defaultTop = ['Food & Dining', 'Shopping & Personal', 'Subscriptions', 'Transportation'];
  const topCategories = sortedCatEntries.map(([c]) => c);
  for (const def of defaultTop) {
    if (topCategories.length < 4 && !topCategories.includes(def)) {
      topCategories.push(def);
    }
  }
  const pacingCategoryNames = topCategories.slice(0, 4);

  const categoryPacingData = pacingCategoryNames.map((catName) => {
    // Check if current cycle has spending
    let spent = (transactions || [])
      .filter((t) => {
        const norm = normalizeTransaction(t, currency.code);
        if (norm.is_income || isExcludedFromMonthlySpend(norm)) return false;
        if (!isInCurrentMonthCycle(norm.date, activeRefDate)) return false;
        return norm.category === catName;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // If cycle specific spend is 0, compute monthly average from statement total
    if (spent === 0 && categoryTotals[catName]) {
      spent = Math.round(categoryTotals[catName] / monthsSpan);
    }

    // Dynamic target scaled to spend
    let target = 0;
    if (spent > 0) {
      target = Math.max(currency.code === 'INR' ? 1000 : 100, Math.ceil((spent * 1.25) / 250) * 250);
    } else {
      target = currency.code === 'INR' ? 3000 : 300;
    }

    const pctUsed = Math.min(100, Math.round((spent / target) * 100));
    const expectedSpendSoFar = (target / daysInMonth) * dayOfMonth;

    let status = 'On Track';
    let badgeColor = '#10B981';
    let badgeBg = 'rgba(16, 185, 129, 0.12)';
    let badgeBorder = 'rgba(16, 185, 129, 0.25)';

    if (spent > target) {
      status = 'Over Target';
      badgeColor = '#EF4444';
      badgeBg = 'rgba(239, 68, 68, 0.12)';
      badgeBorder = 'rgba(239, 68, 68, 0.25)';
    } else if (spent > expectedSpendSoFar * 1.08) {
      status = 'Pacing Fast';
      badgeColor = '#F59E0B';
      badgeBg = 'rgba(245, 158, 11, 0.12)';
      badgeBorder = 'rgba(245, 158, 11, 0.25)';
    }

    return {
      name: catName,
      icon: CATEGORY_ICONS[catName] || '🏷️',
      spent,
      target,
      pctUsed,
      status,
      badgeColor,
      badgeBg,
      badgeBorder,
    };
  });

  const categories = Array.from(new Set([
    'ALL',
    ...pacingCategoryNames,
    'Food & Dining',
    'Shopping & Personal',
    'Subscriptions',
    'Transportation',
    'Income',
    ...(transactions || []).map((t) => t.category).filter(Boolean),
  ])).slice(0, 8);

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
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
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
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(13, 148, 136, 0.12)',
              border: '1px solid rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488',
            }}>
              <Building size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Connected Accounts & Live Activity
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: hasImportedData ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-secondary)',
              color: hasImportedData ? '#10B981' : 'var(--text-muted)',
              border: hasImportedData ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
            }}>
              {hasImportedData ? Object.keys(accounts || {}).length : 0} Linked Account{hasImportedData && Object.keys(accounts || {}).length === 1 ? '' : 's'}
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {hasImportedData
              ? 'Your live balances, recent spending, and smart category tracking.'
              : 'No bank accounts linked. Feed statements or connect Open Banking to view verified cash.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {hasImportedData && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this uploaded statement and wipe all transactions?')) {
                  clearImportedData();
                }
              }}
              title="Delete this uploaded statement and reset ledger"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 size={14} />
              <span>Delete Statement</span>
            </button>
          )}

          <button
            onClick={openSyncModal}
            style={{
              background: 'var(--brand-primary, #0D9488)',
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
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} /> {hasImportedData ? 'Add Real Data / Sync Bank' : 'Connect Bank Account'}
          </button>
        </div>
      </div>

      {/* ACTIVE STATEMENT AUDIT & MANAGEMENT STRIP */}
      {hasImportedData && (
        <div
          style={{
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={15} color={isDemoMode ? '#3B82F6' : '#10B981'} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Statement Source: {activeStatementMeta?.fileName || (isDemoMode ? 'Demo Sandbox ICICI Statement' : 'Active Statement Ingestion')}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              &bull; {transactions.length} transactions &bull; Bank: {activeStatementMeta?.institution || 'Linked Bank'}
            </span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Delete this uploaded statement and erase all associated transactions from FinSense?')) {
                clearImportedData();
              }
            }}
            title="Purge uploaded statement"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#EF4444',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={13} />
            <span>Delete Statement Data</span>
          </button>
        </div>
      )}

      {/* ACCOUNT BALANCES TILES */}
      <div style={{

        display: 'grid',
        gridTemplateColumns: !hasImportedData ? 'repeat(auto-fit, minmax(280px, 1fr))' : (Object.keys(accounts || {}).length === 1 ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))'),
        gap: '12px',
        marginBottom: '24px',
      }}>
        {!hasImportedData ? (
          <>
            <div
              onClick={openSyncModal}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'var(--bg-surface-secondary)',
                border: '1px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0D9488';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(13, 148, 136, 0.12)',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Plus size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Connect Checking Account
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  HDFC, ICICI, SBI, Axis, Kotak or Chase
                </div>
              </div>
            </div>

            <div
              onClick={openSyncModal}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'var(--bg-surface-secondary)',
                border: '1px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Plus size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Link Savings / Emergency Reserve
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Track liquid runway & auto-save buffers
                </div>
              </div>
            </div>
          </>
        ) : (
          Object.entries(accounts || {}).map(([key, acc]) => {
            const isChecking = acc.type === 'CHECKING' || key === 'checking';
            const isSavings = acc.type === 'SAVINGS' || key === 'savings';
            const isCredit = acc.type === 'CREDIT' || key === 'credit';

            return (
              <div
                key={acc.id || key}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {acc.name || (isChecking ? 'Checking Account' : isSavings ? 'Savings Reserve' : 'Credit Account')}
                  </span>
                  {isChecking && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                      Live
                    </span>
                  )}
                  {isSavings && acc.apy && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                      {acc.apy}
                    </span>
                  )}
                  {isCredit && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Limit {format(acc.credit_limit || 0, { decimals: 0 })}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {format(acc.balance || 0)}
                </div>
                <div style={{ fontSize: '0.72rem', color: isChecking ? '#0D9488' : 'var(--text-muted)', fontWeight: 600, marginTop: '6px' }}>
                  {isChecking
                    ? 'Verified Real Statement Balance • Safe Sweep Ready'
                    : isSavings
                    ? 'Emergency Reserve + Goal Buffers'
                    : 'Autopay Scheduled • Zero Interest'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ROCKET MONEY / COPILOT STYLE: MONTHLY CATEGORY PACING BARS */}
      <div style={{
        marginBottom: '24px',
        padding: '18px 20px',
        borderRadius: '14px',
        background: 'var(--bg-surface-secondary)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: 'rgba(13, 148, 136, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488'
            }}>
              <Target size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Monthly Category Budget Pacing
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Tracked against Day {dayOfMonth} pacing. Click any category bar to filter recent transactions below.
              </div>
            </div>
          </div>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                fontSize: '0.74rem',
                color: '#0D9488',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Reset to All Categories
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {categoryPacingData.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.name)}
                style={{
                  background: isSelected ? 'var(--bg-card)' : 'var(--bg-card)',
                  border: isSelected ? '2px solid #0D9488' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  boxShadow: isSelected ? '0 0 0 2px rgba(13, 148, 136, 0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cat.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: cat.badgeBg,
                    color: cat.badgeColor,
                    border: `1px solid ${cat.badgeBorder}`
                  }}>
                    {cat.status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {format(cat.spent)}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    / {format(cat.target)}
                  </span>
                </div>

                {/* Pacing Progress Bar */}
                <div style={{
                  height: '6px',
                  width: '100%',
                  background: 'var(--border-subtle)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div 
                    className={cat.pctUsed > 100 ? 'progress-overflow-striped' : ''}
                    style={{
                      width: `${Math.min(Math.max(cat.pctUsed, 0), 100)}%`,
                      height: '100%',
                      background: cat.pctUsed > 100 ? undefined : cat.badgeColor,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>{cat.pctUsed}% spent</span>
                  <span>{isSelected ? 'Active Filter ✕' : 'Click to filter'}</span>
                </div>
              </div>
            );
          })}
        </div>
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
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search transactions or merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-secondary)',
              color: 'var(--text-primary)',
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
                  border: isSel ? '1px solid var(--brand-primary, #0D9488)' : '1px solid var(--border-subtle)',
                  background: isSel ? 'var(--brand-primary, #0D9488)' : 'var(--bg-surface-secondary)',
                  color: isSel ? '#FFFFFF' : 'var(--text-secondary)',
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
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-card)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 1.4fr 1.2fr 100px 110px',
          padding: '10px 16px',
          background: 'var(--bg-surface-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.03em',
        }}>
          <div>DATE</div>
          <div>MERCHANT</div>
          <div>CATEGORY</div>
          <div style={{ textAlign: 'center' }}>RECURRING</div>
          <div style={{ textAlign: 'right' }}>AMOUNT</div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {(!hasImportedData || filteredTransactions.length === 0) ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(13, 148, 136, 0.1)',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {!hasImportedData ? 'No Transactions Ingested Yet' : 'No matching transactions'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
                  {!hasImportedData 
                    ? 'FinSense operates on real banking data. Connect your bank via Account Aggregator / Plaid, or import a bank statement (CSV/TSV/PDF) to populate your live ledger.'
                    : `No transactions match "${searchQuery}" ${selectedCategory !== 'ALL' ? `in category "${selectedCategory}"` : ''}.`}
                </div>
              </div>
              {!hasImportedData && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={openSyncModal}
                    style={{
                      background: '#0D9488',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                    }}
                  >
                    + Connect Bank or Upload Statement
                  </button>
                  <button
                    onClick={loadDemoData}
                    style={{
                      background: 'var(--bg-surface-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Test Drive Demo Portfolio
                  </button>
                </div>
              )}
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
                    borderBottom: idx < filteredTransactions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    fontSize: '0.82rem',
                    transition: 'background 0.12s ease',
                    background: 'var(--bg-card)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                >
                  {/* Date */}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {tx.date}
                  </span>

                  {/* Merchant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-secondary)',
                      color: isIncome ? '#10B981' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {tx.merchant.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                          border: '1px solid var(--brand-primary, #0D9488)',
                          outline: 'none',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)'
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
                          background: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {tx.category} <ChevronDown size={12} color="var(--text-muted)" />
                      </button>
                    )}
                  </div>

                  {/* Recurring Toggle */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggleRecurringTransaction(tx.id)}
                      title={tx.is_recurring ? 'Recurring detected (click to toggle)' : 'One-time (click to mark recurring)'}
                      style={{
                        background: tx.is_recurring ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                        border: tx.is_recurring ? '1px solid rgba(59, 130, 246, 0.3)' : '1px dashed var(--border-subtle)',
                        color: tx.is_recurring ? '#3B82F6' : 'var(--text-muted)',
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
                    color: isIncome ? '#10B981' : 'var(--text-primary)',
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
