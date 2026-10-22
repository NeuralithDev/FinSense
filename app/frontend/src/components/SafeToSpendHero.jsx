import React from 'react';
import { 
  ShieldCheck, 
  TrendingDown, 
  Wallet, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useScenario } from '../store/scenarioStore';

export default function SafeToSpendHero() {
  const { format } = useCurrency();
  const {
    reconciled,
    excludeOutliers,
    toggleOutliers,
    hasImportedData,
    openSyncModal,
  } = useFinanceStore();
  const { scenario } = useScenario();
  const { openInspector } = useMetricInspector();

  const {
    accounts,
    safeToSpend: safeData,
    pacing,
    recurringBills,
    netFreeCash,
  } = reconciled;

  const checkingBalance = accounts.checking.balance;
  const savingsBalance = accounts.savings.balance;
  const totalLiquidCash = accounts.totalLiquid;

  const upcomingBills14d = recurringBills.upcomingBills14d;
  const upcomingBills30d = recurringBills.upcomingBills30d;
  const protectedSafetyBuffer = safeData.protectedBuffer;
  const safeToSpend = safeData.safeToSpend;
  const dailySafeToSpend = safeData.dailySafeToSpend;

  const handleExplainSafeSpend = () => {
    openInspector({
      metricName: 'True Safe-to-Spend',
      value: hasImportedData ? format(safeToSpend) : '--',
      formula: 'Checking Cash - Upcoming Bills (Next 14d) - Protected Buffer - Budget Constraint',
      description: !hasImportedData
        ? 'Awaiting real financial data. Connect your bank account via Setu Account Aggregator / Plaid or upload a bank statement to calculate your live guilt-free spending limit.'
        : safeData.isConstrained
        ? 'Currently in Constrained Recovery Mode because spending has exceeded your monthly pacing target. Discretionary spending should be scaled back to preserve your essential emergency floor.'
        : 'Your guilt-free spending limit. We automatically reserve upcoming recurring bills and your protected safety buffer so you never overdraft.',
      drivers: [
        { name: 'Verified Checking Cash', weight: hasImportedData ? format(checkingBalance) : 'Awaiting Link', impact: 'Live ledger balance' },
        { name: 'Upcoming 14-Day Bills', weight: hasImportedData ? `-${format(upcomingBills14d)}` : '--', impact: 'Auto-reserved for bills due within 14 days' },
        { name: 'Protected Safety Buffer', weight: hasImportedData ? `-${format(protectedSafetyBuffer)}` : '--', impact: `${scenario.label} floor (never breached)` },
        { name: 'Daily Safe Pace', weight: hasImportedData ? `${format(dailySafeToSpend)}/day` : '--', impact: safeData.isConstrained ? 'Constrained daily allowance' : 'Over the next 7 days' },
      ],
    });
  };

  const handleExplainPacing = () => {
    openInspector({
      metricName: 'Monthly Spend Pacing',
      value: hasImportedData ? `${format(pacing.actualSpendToDate)} (${pacing.overflowBadgeText})` : '₹0.00 (No Spend Logged)',
      formula: 'Actual Eligible Living Debits to Date vs. Expected Paced Target',
      description: 'Strictly excludes internal transfers, credit card payments, investment contributions (e.g. Zerodha SIP), and refunds to eliminate artificial inflation.',
      drivers: [
        { name: 'Expected Spend by Day ' + pacing.currentDay, weight: format(pacing.expectedSpendToDate), impact: 'Paced benchmark' },
        { name: 'Actual Spend to Date', weight: format(pacing.actualSpendToDate), impact: 'Eligible living expenses' },
        { name: 'Pace Variance', weight: `${pacing.paceVariance >= 0 ? '+' : ''}${format(pacing.paceVariance)}`, impact: `${pacing.paceVariancePct}% vs baseline` },
        { name: 'Excluded Capital Outliers', weight: format(pacing.outlierTotal), impact: 'Tuition, deposits & investments' },
      ],
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    }}>
      {/* CARD 1: TRUE SAFE-TO-SPEND TODAY */}
      <div style={{
        background: 'var(--bg-card)',
        border: !hasImportedData ? '1px solid var(--border-subtle)' : safeData.isConstrained ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: !hasImportedData ? 'var(--shadow-card)' : safeData.isConstrained ? '0 4px 14px rgba(239, 68, 68, 0.08)' : 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top Indicator Gradient Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: !hasImportedData
            ? 'var(--border-subtle)'
            : safeData.isConstrained
            ? 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)'
            : 'linear-gradient(90deg, #10B981 0%, #14B8A6 100%)',
        }} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: !hasImportedData ? 'var(--bg-surface-secondary)' : safeData.isConstrained ? 'rgba(239, 68, 68, 0.12)' : 'var(--emerald-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: !hasImportedData ? 'var(--text-muted)' : safeData.isConstrained ? '#EF4444' : '#10B981',
              }}>
                {safeData.isConstrained ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                True Safe-to-Spend Today
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '6px',
                background: !hasImportedData
                  ? 'var(--bg-surface-secondary)'
                  : safeData.isConstrained
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(16, 185, 129, 0.12)',
                color: !hasImportedData
                  ? 'var(--text-muted)'
                  : safeData.isConstrained
                  ? '#EF4444'
                  : '#10B981',
                border: `1px solid ${
                  !hasImportedData
                    ? 'var(--border-subtle)'
                    : safeData.isConstrained
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)'
                }`,
              }}>
                {!hasImportedData ? 'Awaiting Link' : safeData.isConstrained ? 'Constrained Mode' : 'Guilt-Free'}
              </span>

              <button
                onClick={handleExplainSafeSpend}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Explain calculation"
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          {!hasImportedData ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0 8px 0' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                --
              </span>
              <button
                onClick={openSyncModal}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)',
                }}
              >
                + Link Account
              </button>
            </div>
          ) : (
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: safeData.isConstrained ? '#EF4444' : '#10B981',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {format(safeToSpend)}
            </div>
          )}

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            {!hasImportedData ? (
              <span>
                Link your checking account or upload a statement to calculate live guilt-free spending limit and reserve upcoming bills.
              </span>
            ) : safeData.isConstrained ? (
              <span>
                Pacing exceeds target budget. <strong>Constrained Recovery active</strong>: recommended daily cutback of <strong>{format(safeData.dailyCutbackNeeded)}/day</strong> to preserve your {format(protectedSafetyBuffer)} safety floor by Day {pacing.daysInMonth}.
              </span>
            ) : (
              <span>
                Guilt-free to spend this week (~<strong>{format(dailySafeToSpend)}/day</strong>) with zero risk of missing upcoming bills.
              </span>
            )}
          </p>
        </div>

        {/* Breakdown Deductions Pill */}
        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          background: 'var(--bg-surface-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Checking Cash</span>
            <span style={{ fontWeight: 600, color: hasImportedData ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {hasImportedData ? format(checkingBalance) : 'Awaiting Link'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Upcoming Bills (14d)</span>
            <span style={{ fontWeight: 600, color: hasImportedData ? '#F59E0B' : 'var(--text-muted)' }}>
              {hasImportedData ? `-${format(upcomingBills14d)}` : '--'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Protected Buffer ({scenario.id === 'aggressive' ? '2x' : '1x'})
            </span>
            <span style={{ fontWeight: 600, color: hasImportedData ? '#64748B' : 'var(--text-muted)' }}>
              {hasImportedData ? `-${format(protectedSafetyBuffer)}` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: MONTHLY SPENDING PACING */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'var(--bg-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: pacing.badgeTone === 'positive' ? '#10B981' : (pacing.badgeTone === 'danger' ? '#EF4444' : '#F59E0B'),
              }}>
                <TrendingDown size={15} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Monthly Spend Pacing
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: pacing.badgeTone === 'positive'
                  ? 'var(--emerald-50)'
                  : (pacing.badgeTone === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'),
                color: pacing.badgeTone === 'positive'
                  ? '#10B981'
                  : (pacing.badgeTone === 'danger' ? '#EF4444' : '#D97706'),
                border: `1px solid ${pacing.badgeTone === 'positive' ? 'var(--emerald-100)' : (pacing.badgeTone === 'danger' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)')}`,
              }}>
                {pacing.badgeLabel}
              </span>

              <button
                onClick={handleExplainPacing}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Explain pacing calculation"
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          <div style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: hasImportedData ? 'var(--text-primary)' : 'var(--text-muted)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '4px',
          }}>
            {hasImportedData ? format(pacing.actualSpendToDate) : '₹0.00'}
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            {!hasImportedData ? (
              <span>No expenses recorded this month. Connect bank or import a statement to track living expenses against your target.</span>
            ) : (
              <span>
                Spent by Day {pacing.currentDay} of {pacing.daysInMonth} ({pacing.monthProgressPct}% of month). You're <strong>{format(Math.abs(pacing.paceVariance))} {pacing.paceVariance <= 0 ? 'less' : 'more'}</strong> than typical pace ({format(pacing.expectedSpendToDate)}).
              </span>
            )}
          </p>
        </div>

        {/* Visual Progress Curve Bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Target: {format(14000)}</span>
            <span style={{
              fontWeight: 700,
              color: !hasImportedData ? 'var(--text-muted)' : pacing.isOverBudget ? '#EF4444' : 'var(--text-primary)',
            }}>
              {!hasImportedData ? '0% Used' : pacing.overflowBadgeText}
            </span>
          </div>

          {/* Clamped Progress Bar with Overflow Indicator */}
          <div style={{
            height: '8px',
            width: '100%',
            background: 'var(--border-subtle)',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div
              className={pacing.isOverBudget ? 'progress-overflow-striped' : ''}
              style={{
                width: hasImportedData ? `${pacing.clampedProgressPct}%` : '0%',
                height: '100%',
                background: pacing.isOverBudget
                  ? undefined
                  : (pacing.paceVariance <= 0 ? '#10B981' : '#F59E0B'),
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Day marker indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>Day 1</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>• Today (Day {pacing.currentDay})</span>
            <span>Day {pacing.daysInMonth}</span>
          </div>

          {/* Outlier Exclusion Toggle Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {!hasImportedData
                ? '0 Transactions Processed'
                : `Capital Outliers: ${excludeOutliers ? 'Excluded' : 'Included'} (${format(pacing.outlierTotal)})`}
            </span>
            {hasImportedData && (
              <button
                onClick={toggleOutliers}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#10B981',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {excludeOutliers ? 'Show Raw' : 'Exclude Outliers'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CARD 3: TOTAL CASH VS UPCOMING BILLS */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'var(--bg-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}>
                <Wallet size={15} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Cash vs. Bills
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Next Payday: {hasImportedData ? '1st' : '--'}
            </span>
          </div>

          <div style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: hasImportedData ? 'var(--text-primary)' : 'var(--text-muted)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '4px',
          }}>
            {hasImportedData ? format(totalLiquidCash) : '₹0.00'}
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            {!hasImportedData ? (
              <span>No bank accounts connected yet. Link your accounts to view unified cash and bill commitments.</span>
            ) : (
              <span>
                Unified checking ({format(checkingBalance)}) & liquid reserve ({format(savingsBalance)}). Covers <strong>{recurringBills.totalBillsCount} recurring bills</strong> ({format(upcomingBills30d)}/mo).
              </span>
            )}
          </p>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          background: 'var(--bg-surface-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              14D Bills ({hasImportedData ? recurringBills.upcomingBills14dCount : 0}) / 30D Commitments
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {hasImportedData ? format(upcomingBills14d) : '₹0.00'} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ {hasImportedData ? format(upcomingBills30d) : '₹0.00'}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net Free Cash</div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#10B981' }}>
              +{hasImportedData ? format(netFreeCash) : '₹0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
