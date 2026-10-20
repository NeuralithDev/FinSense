import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  CalendarClock, 
  Sparkles, 
  ShieldAlert, 
  Network, 
  Sliders, 
  HelpCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  User, 
  ExternalLink,
  Layers,
  DollarSign,
  Activity
} from 'lucide-react';
import { useCurrency } from '../../design-system/currencyStore';
import { useScenario } from '../../store/scenarioStore';
import { useFinanceStore } from '../../store/financeStore';
import Badge from '../primitives/Badge';
import Button from '../primitives/Button';
import CommandPalette from './CommandPalette';
import MetricInspectorModal from './MetricInspectorModal';

export default function AppShell({
  activeTab,
  setActiveTab,
  isSyncing,
  onSync,
  syncStatus,
  onOpenLanding,
  onTriggerQuickAction,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const { scenario, setScenario, availableScenarios } = useScenario();
  const { pendingAlertsCount, openSyncModal } = useFinanceStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'cockpit', label: 'Home Overview', icon: LayoutDashboard },
    { id: 'forecast', label: 'Upcoming Balance', icon: TrendingUp, badge: '30D' },
    { id: 'subscriptions', label: 'Recurring Bills & Subs', icon: CalendarClock, badge: 'Radar' },
    { id: 'autopilot', label: 'Smart Auto-Save', icon: Sparkles, badge: 'Protected' },
    { 
      id: 'anomalies', 
      label: 'Unusual Activity', 
      icon: ShieldAlert, 
      badge: pendingAlertsCount > 0 ? `${pendingAlertsCount} Alert${pendingAlertsCount > 1 ? 's' : ''}` : 'Protected' 
    },
    { id: 'spending', label: 'Spending Habits', icon: Network, badge: 'Triggers' },
    { id: 'affordability', label: '"Can I Afford It?"', icon: DollarSign, badge: 'Calculator' },
    { id: 'twins', label: 'People Like You', icon: Activity, badge: 'Peers' },
    { id: 'copilot', label: 'Ask FinSense AI', icon: HelpCircle },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onTriggerAction={onTriggerQuickAction}
      />

      {/* Global Explain This Metric Inspector Drawer */}
      <MetricInspectorModal />

      {/* Left Collapsible Sidebar */}
      <aside
        style={{
          width: collapsed ? '72px' : '260px',
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '20px 14px' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
            minHeight: '68px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              F
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  FinSense<span style={{ color: '#0D9488' }}>.</span>
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Personal Finance Companion
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  width: '100%',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  borderRadius: '8px',
                  background: isActive ? '#0F172A' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#FFFFFF' : '#64748B' }} />
                  {!collapsed && (
                    <span style={{ fontSize: '0.84rem', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </div>

                {!collapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: isActive ? 'rgba(255, 255, 255, 0.15)' : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : '#64748B',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Open Banking Sync Card */}
        {!collapsed && (
          <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0D9488' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                    Open Banking
                  </span>
                </div>
                <Badge variant="emerald">Live Plaid</Badge>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Cursor Sync: 42 tx processed
              </div>

              <button
                onClick={openSyncModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '6px 10px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'background 0.15s ease',
                }}
              >
                <RefreshCw size={12} />
                <span>Sync Accounts</span>
              </button>
            </div>
          </div>
        )}

        {/* User Profile Footer */}
        <div
          style={{
            padding: collapsed ? '12px' : '12px 16px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: '60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                flexShrink: 0,
              }}
            >
              <User size={16} />
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                  Dev Account
                </span>
                <span style={{ fontSize: '0.675rem', color: '#64748B' }}>
                  Plus Member
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Executive Header Bar */}
        <header
          style={{
            height: '68px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Left: Quick Search / Command Palette Bar */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              color: '#64748B',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              width: '280px',
              textAlign: 'left',
            }}
          >
            <Search size={15} style={{ color: '#94A3B8' }} />
            <span style={{ flex: 1 }}>Quick search or jump to...</span>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: '#64748B',
                background: '#FFFFFF',
                padding: '2px 5px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0',
              }}
            >
              ⌘K
            </span>
          </button>

          {/* Right Controls: Scenario Switcher, Currency, Landing Page Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Scenario Switcher Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                Scenario:
              </span>
              <select
                value={scenario.id}
                onChange={(e) => setScenario(e.target.value)}
                style={{
                  padding: '6px 10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {availableScenarios.map((scen) => (
                  <option key={scen.id} value={scen.id}>
                    {scen.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Switcher */}
            <select
              value={currency.code}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                padding: '6px 8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {availableCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>

            {/* Connect Bank / Sync Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={openSyncModal}
              style={{ fontSize: '0.78rem', padding: '6px 14px', background: '#0F172A', color: '#FFFFFF' }}
            >
              <RefreshCw size={12} />
              <span>Sync Bank</span>
            </Button>

            {/* Landing Page Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLanding}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <span>Landing Page</span>
              <ExternalLink size={12} />
            </Button>
          </div>
        </header>

        {/* View Content */}
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
