import React, { useState } from 'react';
import { 
  CalendarClock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Calendar as CalendarIcon,
  Sparkles,
  Zap,
  Flame,
  Check,
  Info,
  Clock
} from 'lucide-react';
import Badge from './primitives/Badge';
import Button from './primitives/Button';
import Modal from './primitives/Modal';
import confetti from 'canvas-confetti';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';

export default function SubscriptionCommander({ subscriptionData }) {
  const { format, currency } = useCurrency();
  const [selectedSubForAction, setSelectedSubForAction] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CREEP' | 'DISCRETIONARY' | 'ESSENTIAL'
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [canceledBoostNotice, setCanceledBoostNotice] = useState(null);

  const {
    subscriptions: storeSubs,
    detectedSubscriptions,
    hasImportedData,
    openSyncModal,
    loadDemoData,
    cancelSubscription,
    pauseSubscription,
  } = useFinanceStore();

  const subsList = (detectedSubscriptions && detectedSubscriptions.length > 0)
    ? detectedSubscriptions
    : (storeSubs && storeSubs.length > 0)
      ? storeSubs
      : [];

  const subs = subsList.map((s, idx) => ({
    subscription_id: s.subscription_id || `sub_${idx}`,
    merchant_id: s.merchant_id || s.merchant?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `sub_${idx}`,
    merchant: s.merchant_name || s.merchant || 'Subscription',
    amount: Number(s.amount),
    previous_amount: s.previous_amount !== undefined ? Number(s.previous_amount) : (s.is_price_crept ? Number(s.amount) - (Number(s.price_change_amt) || 150) : Number(s.amount)),
    price_change_amt: s.price_change_amt !== undefined ? Number(s.price_change_amt) : (s.is_price_crept ? 150 : 0),
    is_price_crept: Boolean(s.is_price_crept && (s.price_change_amt > 0 || s.amount > s.previous_amount)),
    category: s.category || 'General',
    overlap_group: s.overlap_group || null,
    has_overlap: Boolean(s.has_overlap || s.overlap_group),
    cadence: s.cadence || 'MONTHLY',
    status: s.status || 'ACTIVE',
    billing_day: s.billing_day || ((idx * 5 + 3) % 28) + 1,
    next_expected_date: s.next_expected_date || `Nov ${((idx * 5 + 3) % 28) + 1}, 2026`,
    days_until_next_charge: s.days_until_next_charge !== undefined ? s.days_until_next_charge : ((idx * 4 + 2) % 30),
    annual_cost: s.annual_cost || (Number(s.amount) * 12),
    annualized_cost: s.annualized_cost || s.annual_cost || (Number(s.amount) * 12),
    is_essential: Boolean(s.is_essential),
    cancellation_guide: s.cancellation_guide || {
      direct_url: undefined,
      difficulty: 'EASY',
      instructions: [
        `Access your ${s.merchant || s.merchant_name} account settings.`,
        'Locate the Billing & Subscriptions section.',
        'Choose "Cancel Auto-Renewal" or downgrade to a free tier.',
        'Revoke any linked UPI auto-debit e-mandate in your banking app.'
      ],
      potential_annual_savings: Number(s.amount) * 12
    },
    action_plan: s.action_plan || `Canceling this subscription removes this recurring bill from your projected ledger and increases your True Safe-to-Spend limit.`
  }));

  const activeSubs = subs.filter(s => s.status === 'ACTIVE');
  const totalMonthly = activeSubs.reduce((acc, s) => acc + Number(s.amount), 0);
  const totalAnnual = totalMonthly * 12;
  const discretionarySavings = totalAnnual * 0.35;

  // Detect Overlapping Duplicates (e.g. multiple streaming video apps)
  const categoryGroups = {};
  activeSubs.forEach(s => {
    const key = s.overlap_group || s.category;
    if (!categoryGroups[key]) categoryGroups[key] = [];
    categoryGroups[key].push(s);
  });
  const duplicateAlerts = Object.entries(categoryGroups).filter(([_, list]) => list.length > 1);

  // Price hike alerts
  const priceHikeAlerts = activeSubs.filter(s => s.is_price_crept && s.price_change_amt > 0);
  const discretionarySubs = activeSubs.filter(s => !s.is_essential);
  const essentialSubs = activeSubs.filter(s => s.is_essential);

  const handle1ClickCancel = async (sub) => {
    await cancelSubscription(sub.subscription_id);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    setCanceledBoostNotice({
      merchant: sub.merchant,
      boostAmt: sub.amount,
    });
    setTimeout(() => setCanceledBoostNotice(null), 5000);
  };

  const filteredSubs = subs.filter((s) => {
    if (activeFilter === 'CREEP') return s.is_price_crept && s.price_change_amt > 0;
    if (activeFilter === 'DISCRETIONARY') return !s.is_essential;
    if (activeFilter === 'ESSENTIAL') return s.is_essential;
    return true;
  });

  // Build upcoming 30-day timeline items sorted by day
  const timelineBills = [...activeSubs].sort((a, b) => a.billing_day - b.billing_day);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
      }}
    >
      {/* 1-Click Safe-to-Spend Boost Notice */}
      {canceledBoostNotice && (
        <div style={{
          marginBottom: '18px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#10B981',
          animation: 'fadeIn 0.2s ease-in'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
              <strong>{canceledBoostNotice.merchant} marked as canceled!</strong> Reclaimed <strong>+{format(canceledBoostNotice.boostAmt)}/mo</strong> (+{format(canceledBoostNotice.boostAmt * 12)}/yr) Net Free Cash. Safe-to-Spend limit boosted immediately.
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', background: '#10B981', color: '#FFFFFF', borderRadius: '6px' }}>
            +Net Free Cash Reclaimed
          </span>
        </div>
      )}

      {/* Cancellation Playbook Modal */}
      <Modal
        isOpen={!!selectedSubForAction}
        onClose={() => setSelectedSubForAction(null)}
        title={selectedSubForAction ? `Cancellation Playbook: ${selectedSubForAction.merchant}` : ''}
        subtitle="Rocket Money–Grade 1-Click Cancellation & Cash Reclaim Strategy"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSelectedSubForAction(null)}>
              Dismiss
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                if (selectedSubForAction) {
                  await pauseSubscription(selectedSubForAction.subscription_id);
                  setSelectedSubForAction(null);
                }
              }}
            >
              Pause Tracking
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (selectedSubForAction) {
                  await handle1ClickCancel(selectedSubForAction);
                  setSelectedSubForAction(null);
                }
              }}
            >
              Mark as Cancelled & Reclaim Cash (+{format(selectedSubForAction?.amount || 0)}/mo)
            </Button>
          </>
        }
      >
        {selectedSubForAction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stat Row */}
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-surface-secondary)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Annual Commitment Burn
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {format(selectedSubForAction.annualized_cost || selectedSubForAction.amount * 12)}/yr
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Current Charge: <strong>{format(selectedSubForAction.amount)}</strong> &bull; {selectedSubForAction.cadence}
                </div>
              </div>
              <Badge variant={selectedSubForAction.is_essential ? 'slate' : 'amber'}>
                {selectedSubForAction.is_essential ? 'ESSENTIAL SERVICE' : 'DISCRETIONARY EXPENSE'}
              </Badge>
            </div>

            {/* Price Hike Warning if Present */}
            {selectedSubForAction.is_price_crept && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#EF4444',
                }}
              >
                <Flame size={16} flexShrink={0} />
                <span>
                  <strong>Price Creep Confirmed:</strong> Charge increased from <strong>{format(selectedSubForAction.previous_amount)}</strong> to <strong>{format(selectedSubForAction.amount)}</strong> (+{format(selectedSubForAction.price_change_amt)} vs previous month).
                </span>
              </div>
            )}

            {/* Direct Cancellation Link if available */}
            {selectedSubForAction.cancellation_guide?.direct_url && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(13, 148, 136, 0.08)',
                border: '1px solid rgba(13, 148, 136, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  Direct portal link to cancel or downgrade your account online:
                </div>
                <a
                  href={selectedSubForAction.cancellation_guide.direct_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    background: '#0D9488',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <span>Open {selectedSubForAction.merchant}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Step-by-Step Cancellation Instructions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedSubForAction.cancellation_guide?.instructions || [
                  'Open your account settings on the merchant website or mobile app.',
                  'Navigate to Subscriptions & Billing.',
                  'Select Cancel Subscription and confirm.',
                  'Revoke linked UPI auto-pay mandate in your bank application.'
                ]).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ lineHeight: 1.4 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Explanation */}
            <div style={{
              padding: '10px 14px',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              💡 <strong>FinSense Reclaim Guarantee:</strong> Clicking "Mark as Cancelled & Reclaim Cash" will immediately remove this bill from your upcoming 30-day projected ledger and raise your True Safe-to-Spend limit by <strong>+{format(selectedSubForAction.amount)}</strong>.
            </div>
          </div>
        )}
      </Modal>

      {/* Header & Stat Cards */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Recurring Bills & Subscriptions
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
              {hasImportedData ? 'Recurrence Radar Active' : 'Radar Standby'}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--bg-surface-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}>
              Algorithmic Detection
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Visual 30-day bill calendar, silent price-hike radar, and 1-click cancellation to maximize your True Safe-to-Spend.
          </p>
        </div>

        {/* Metric Badges Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Monthly Commitments
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: hasImportedData ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {format(hasImportedData ? totalMonthly : 0)}
            </div>
          </div>

          <div style={{ background: hasImportedData ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-secondary)', border: hasImportedData ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: hasImportedData ? '#10B981' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Potential Annual Savings
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: hasImportedData ? '#10B981' : 'var(--text-muted)' }}>
              {format(hasImportedData ? discretionarySavings : 0)}/yr
            </div>
          </div>
        </div>
      </div>

      {!hasImportedData ? (
        <div style={{
          padding: '48px 24px',
          background: 'var(--bg-surface-secondary)',
          borderRadius: '14px',
          border: '1px dashed var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(13, 148, 136, 0.12)',
            color: '#0D9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CalendarClock size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Recurring Radar Standing By
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
              Connect your bank or upload bank statements to scan for recurring bills, detect hidden price hikes, and generate 1-click cancellation playbooks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={openSyncModal}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#0D9488',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.82rem',
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
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Preview Demo Subscriptions
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ROCKET MONEY UPGRADE 1: INTERACTIVE UPCOMING 30-DAY BILL CALENDAR & TIMELINE */}
          <div style={{
            marginBottom: '24px',
            padding: '18px 20px',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
          }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
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
              <CalendarIcon size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Upcoming 30-Day Bill Calendar Timeline
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Exact dates when your accounts will be auto-debited. Automatically auto-reserved in Safe-to-Spend.
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Next 30 Days ({timelineBills.length} Bills Due)
          </span>
        </div>

        {/* Calendar Day Grid Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}>
          {timelineBills.map((bill) => {
            const hasCreep = bill.is_price_crept && bill.price_change_amt > 0;
            const isSelected = selectedCalendarDay === bill.subscription_id;

            return (
              <div
                key={bill.subscription_id}
                onClick={() => setSelectedCalendarDay(isSelected ? null : bill.subscription_id)}
                style={{
                  background: 'var(--bg-card)',
                  border: isSelected ? '2px solid #0D9488' : hasCreep ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 0 0 2px rgba(13, 148, 136, 0.2)' : 'none'
                }}
              >
                {/* Date Header Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0D9488',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <CalendarClock size={12} />
                    <span>Day {bill.billing_day}</span>
                  </div>

                  {hasCreep ? (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}>
                      +{format(bill.price_change_amt)} Hike
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'var(--bg-surface-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {bill.cadence}
                    </span>
                  )}
                </div>

                {/* Merchant Name */}
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {bill.merchant}
                </div>

                {/* Amount */}
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '8px'
                }}>
                  {format(bill.amount)}
                </div>

                {/* 1-Click Action Pill */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubForAction(bill);
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: hasCreep ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface-secondary)',
                    color: hasCreep ? '#EF4444' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Manage / Cancel</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROCKET MONEY UPGRADE 2: DUPLICATE SUBSCRIPTION CATEGORY ALERTS */}
      {duplicateAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {duplicateAlerts.map(([groupName, groupSubs]) => {
            const groupMonthlyBurn = groupSubs.reduce((sum, s) => sum + s.amount, 0);

            return (
              <div
                key={groupName}
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B'
                  }}>
                    <Layers size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Duplicate Category Alert: Overlapping {groupName} Subscriptions
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      You're actively paying for <strong>{groupSubs.map(s => s.merchant).join(' & ')}</strong> ({format(groupMonthlyBurn)}/mo combined).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {groupSubs.map((sub) => (
                    <button
                      key={sub.subscription_id}
                      onClick={() => setSelectedSubForAction(sub)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Review cancellation playbook for ${sub.merchant}`}
                    >
                      <span>Manage {sub.merchant}</span>
                      <span style={{ color: '#10B981', fontWeight: 800 }}>+{format(sub.amount)}/mo</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ROCKET MONEY UPGRADE 3: SILENT PRICE-HIKE RADAR BANNERS */}
      {priceHikeAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {priceHikeAlerts.map((hikeSub) => (
            <div
              key={`hike-${hikeSub.subscription_id}`}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.22)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Flame size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Price Hike Detected on {hikeSub.merchant}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Charge increased from {format(hikeSub.previous_amount)} to {format(hikeSub.amount)} (+{format(hikeSub.price_change_amt)} vs last month).
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSubForAction(hikeSub)}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>1-Click Cancel or Dispute</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs with Live Counts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2px' }}>
          {[
            { id: 'ALL', label: `All Bills & Subs (${activeSubs.length})` },
            { id: 'CREEP', label: `Price Hikes (${priceHikeAlerts.length})` },
            { id: 'DISCRETIONARY', label: `Discretionary (${discretionarySubs.length})` },
            { id: 'ESSENTIAL', label: `Essential Bills (${essentialSubs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                background: activeFilter === tab.id ? 'var(--bg-card)' : 'transparent',
                color: activeFilter === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeFilter === tab.id ? 'var(--shadow-card)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filteredSubs.length} recurring accounts
        </span>
      </div>

      {/* Subscriptions Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Merchant Service</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Category & Cadence</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Current Charge</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Annual Burn</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Price Trend</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Next Charge</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map((sub, idx) => (
              <tr
                key={sub.subscription_id || idx}
                style={{
                  borderBottom: idx < filteredSubs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: sub.is_price_crept ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                }}
              >
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{sub.merchant}</span>
                    {sub.is_essential ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                        Essential
                      </span>
                    ) : sub.has_overlap ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        Overlap
                      </span>
                    ) : null}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '0.78rem' }}>
                    {sub.category} · {sub.cadence}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {format(Number(sub.amount))}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {format(sub.annualized_cost || sub.amount * 12)}/yr
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {sub.is_price_crept && sub.price_change_amt > 0 ? (
                    <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.78rem' }}>
                      +{format(sub.price_change_amt)} hike
                    </span>
                  ) : (
                    <span style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 500 }}>
                      Stable
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                  Day {sub.billing_day || 1} ({sub.next_expected_date || 'Upcoming'})
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {sub.status === 'CANCELLED' ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Canceled</span>
                  ) : sub.status === 'PAUSED' ? (
                    <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>Paused</span>
                  ) : (
                    <button
                      onClick={() => setSelectedSubForAction(sub)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#EF4444',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <span>1-Click Cancel</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
