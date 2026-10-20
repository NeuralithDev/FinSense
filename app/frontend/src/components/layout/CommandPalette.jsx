import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  LayoutDashboard, 
  TrendingUp, 
  CalendarClock, 
  Sparkles, 
  ShieldAlert, 
  Network, 
  Sliders, 
  HelpCircle, 
  ArrowRight,
  Zap,
  DollarSign,
  Upload,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import Badge from '../primitives/Badge';
import { useFinanceStore } from '../../store/financeStore';
import { useCurrency } from '../../design-system/currencyStore';

export default function CommandPalette({ isOpen, onClose, onNavigate, onTriggerAction }) {
  const { format } = useCurrency();
  const [query, setQuery] = useState('');
  const {
    transactions,
    subscriptions,
    accounts,
    openSyncModal,
    executeSweep,
    safeSweepAmount
  } = useFinanceStore();

  const sweepVal = safeSweepAmount || 850.0;

  const navCommands = [
    { id: 'overview', title: 'Home Overview', category: 'Navigation', icon: LayoutDashboard, nav: 'cockpit' },
    { id: 'forecast', title: 'Upcoming Balance (30-Day Cash Horizon)', category: 'Navigation', icon: TrendingUp, nav: 'forecast' },
    { id: 'subscriptions', title: 'Recurring Bills & Subs (Price Creep Radar)', category: 'Navigation', icon: CalendarClock, nav: 'subscriptions' },
    { id: 'autopilot', title: 'Smart Auto-Save (Overdraft Protected)', category: 'Navigation', icon: Sparkles, nav: 'autopilot' },
    { id: 'anomalies', title: 'Unusual Activity & Bill Guard', category: 'Navigation', icon: ShieldAlert, nav: 'anomalies' },
    { id: 'spending', title: 'Spending Habits & Triggers', category: 'Navigation', icon: Network, nav: 'spending' },
    { id: 'affordability', title: '"Can I Afford It?" Purchase Simulator', category: 'Navigation', icon: DollarSign, nav: 'affordability' },
    { id: 'twins', title: 'People Like You (Peer Comparison)', category: 'Navigation', icon: Sliders, nav: 'twins' },
    { id: 'copilot', title: 'Ask FinSense AI (Personal Financial Companion)', category: 'Navigation', icon: HelpCircle, nav: 'copilot' },
    { id: 'action_sync', title: 'Connect Bank / Import Statement (CSV / Plaid)', category: 'Quick Action', icon: Upload, action: 'OPEN_SYNC' },
    { id: 'action_sweep', title: `Execute Smart Auto-Save: Move ${format(sweepVal)} to Savings`, category: 'Quick Action', icon: Zap, action: 'EXECUTE_SWEEP' },
  ];

  // Search live transactions and subscriptions
  const matchingTransactions = query.trim() === ''
    ? []
    : transactions.filter(t => 
        t.merchant.toLowerCase().includes(query.toLowerCase()) || 
        t.category.toLowerCase().includes(query.toLowerCase()) ||
        String(t.amount).includes(query)
      ).slice(0, 4).map(t => ({
        id: t.id,
        title: `${t.merchant} — ${format(t.amount)}`,
        subtitle: `${t.date} • ${t.category}`,
        category: 'Transaction Ledger',
        icon: Receipt,
        nav: 'cockpit'
      }));

  const matchingSubscriptions = query.trim() === ''
    ? []
    : subscriptions.filter(s =>
        s.merchant_name.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3).map(s => ({
        id: s.subscription_id,
        title: `${s.merchant_name} — ${format(s.amount)}/mo`,
        subtitle: `${s.category} • Status: ${s.status}`,
        category: 'Recurring Bill',
        icon: CalendarClock,
        nav: 'subscriptions'
      }));

  const filteredNav = query.trim() === ''
    ? navCommands
    : navCommands.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) || 
        c.category.toLowerCase().includes(query.toLowerCase())
      );

  const allResults = [...matchingTransactions, ...matchingSubscriptions, ...filteredNav];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '80px',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '620px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Search Input Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              gap: '12px',
            }}
          >
            <Search size={18} style={{ color: '#0D9488' }} />
            <input
              autoFocus
              type="text"
              placeholder="Search transactions, merchants, bills, or jump to any screen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.9375rem',
                color: '#0F172A',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: '#94A3B8',
                background: '#F1F5F9',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0',
              }}
            >
              ESC
            </span>
          </div>

          {/* Results List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
            {allResults.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                No transactions, subscriptions, or screens match "{query}".
              </div>
            ) : (
              allResults.map((item) => {
                const Icon = item.icon;
                const isAction = item.category === 'Quick Action';
                const isTx = item.category === 'Transaction Ledger';
                const isSub = item.category === 'Recurring Bill';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.action === 'OPEN_SYNC') {
                        openSyncModal();
                      } else if (item.action === 'EXECUTE_SWEEP') {
                        executeSweep(214.50);
                      } else if (item.nav) {
                        onNavigate(item.nav);
                      }
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isAction ? '#ECFDF5' : (isTx ? '#EFF6FF' : '#F1F5F9'),
                          color: isAction ? '#047857' : (isTx ? '#2563EB' : '#334155'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '1px' }}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={isAction ? 'emerald' : (isTx ? 'blue' : (isSub ? 'amber' : 'slate'))}>
                        {item.category}
                      </Badge>
                      <ArrowRight size={14} style={{ color: '#94A3B8' }} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
