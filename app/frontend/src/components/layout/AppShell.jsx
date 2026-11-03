import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity,
  Menu,
  X,
  LogOut,
  Trash2
} from 'lucide-react';
import { useCurrency } from '../../design-system/currencyStore';
import { useTheme } from '../../design-system/themeStore';
import { useScenario } from '../../store/scenarioStore';
import { useFinanceStore } from '../../store/financeStore';
import { useAuth } from '../../store/authStore';
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const { isDark = false, toggleTheme = () => {} } = useTheme();
  const { scenario, setScenario, availableScenarios } = useScenario();
  const {
    pendingAlertsCount,
    openSyncModal,
    isCrisisDemoMode,
    toggleCrisisDemoMode,
    hasImportedData,
    isDemoMode,
    activeStatementMeta,
    clearImportedData,
  } = useFinanceStore();
  const { user, logout } = useAuth();


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
    { id: 'twins', label: 'People Like You', icon: Activity, badge: '3D Galaxy' },
    { id: 'copilot', label: 'Ask FinSense AI', icon: HelpCircle },
  ];

  const mobilePrimaryTabs = [
    { id: 'cockpit', label: 'Home', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'twins', label: '3D Peers', icon: Activity, highlight: true },
    { id: 'autopilot', label: 'Auto-Save', icon: Sparkles },
    { id: 'copilot', label: 'AI', icon: HelpCircle },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setMobileDrawerOpen(false);
        }}
        onTriggerAction={onTriggerQuickAction}
      />

      {/* Global Explain This Metric Inspector Drawer */}
      <MetricInspectorModal />

      {/* Left Collapsible Desktop Sidebar */}
      <aside
        className="desktop-only-sidebar"
        style={{
          width: collapsed ? '72px' : '260px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
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
            borderBottom: '1px solid var(--border-subtle)',
            minHeight: '68px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#10B981',
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
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  FinSense<span style={{ color: '#10B981' }}>.</span>
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
              color: 'var(--text-subtle)',
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
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: isActive ? '1px solid #0F172A' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#10B981' : 'var(--text-muted)' }} />
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
                      background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface-secondary)',
                      color: isActive ? '#34D399' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
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
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: !hasImportedData ? '#F59E0B' : (isDemoMode ? '#3B82F6' : '#10B981')
                  }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    Open Banking
                  </span>
                </div>
                <Badge variant={!hasImportedData ? 'amber' : (isDemoMode ? 'blue' : 'emerald')}>
                  {!hasImportedData ? 'No Bank Linked' : (isDemoMode ? 'Demo Sandbox' : 'Bank Connected')}
                </Badge>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {!hasImportedData
                  ? 'Multi-Account & PDF Ingestion Ready'
                  : isDemoMode
                  ? 'Sample Student Portfolio'
                  : (activeStatementMeta?.fileName || 'Live Account Synced')}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={openSyncModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1,
                    padding: '6px 10px',
                    background: !hasImportedData ? '#0D9488' : 'var(--bg-surface)',
                    border: !hasImportedData ? 'none' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: !hasImportedData ? '#FFFFFF' : 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <RefreshCw size={12} />
                  <span>{!hasImportedData ? 'Connect Bank / Import' : 'Import'}</span>
                </button>

                {hasImportedData && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete uploaded statement and reset ledger to zero-state?')) {
                        clearImportedData();
                      }
                    }}
                    title="Delete uploaded statement data"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '6px',
                      color: '#EF4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Profile Footer & Theme Switcher */}
        <div
          style={{
            padding: collapsed ? '12px' : '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: '60px',
            position: 'relative',
          }}
        >
          {/* User Popover Menu */}
          <AnimatePresence>
            {isUserMenuOpen && !collapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: '70px',
                  left: '12px',
                  right: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#0D9488',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name || 'FinSense User'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email || 'Authenticated User'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 4px' }}>
                  Auth: {user?.provider === 'google' ? 'Google OAuth Account' : 'Credentials'}
                </div>

                {hasImportedData && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete uploaded statement and reset financial ledger?')) {
                        clearImportedData();
                        setIsUserMenuOpen(false);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#EF4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Statement Data</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                    if (onOpenLanding) onOpenLanding();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', cursor: 'pointer', flex: 1 }}
            title="Click for account options & sign out"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={16} />
              )}
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'FinSense User'}
                </span>
                <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || (user ? 'Account Active' : 'Guest Explorer')}
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
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          }}
        >
          {/* Left: Mobile Menu Trigger + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="mobile-drawer-toggle"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '4px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setCommandPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                width: '260px',
                maxWidth: '100%',
                textAlign: 'left',
              }}
            >
              <Search size={15} style={{ color: 'var(--text-subtle)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Search or jump to...</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ⌘K
              </span>
            </button>
          </div>

          {/* Right Controls: Scenario Switcher, Currency, Sync */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            {/* Scenario Switcher Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={scenario.id}
                onChange={(e) => setScenario(e.target.value)}
                style={{
                  padding: '6px 8px',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
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
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
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
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <RefreshCw size={12} />
              <span>Import</span>
            </Button>

            {/* Landing Page Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLanding}
              style={{ fontSize: '0.78rem', padding: '6px 10px' }}
            >
              <span>Landing</span>
              <ExternalLink size={12} />
            </Button>
          </div>
        </header>

        {/* View Content */}
        <main className="mobile-content-container" style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Sleek Mobile Bottom Glassmorphic Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav">
        {mobilePrimaryTabs.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                color: isActive ? '#10B981' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '0.68rem',
                fontWeight: isActive ? 700 : 500,
                position: 'relative',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#10B981',
                  }}
                />
              )}
            </button>
          );
        })}
        {/* Mobile More / Tools Drawer Trigger */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '8px',
            fontSize: '0.68rem',
            fontWeight: 500,
          }}
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Slide-Over Drawer for Secondary Features */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '300px',
                maxWidth: '85vw',
                height: '100%',
                background: 'var(--bg-surface)',
                borderLeft: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>FinSense Navigation</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isActive ? 'var(--bg-surface-secondary)' : 'transparent',
                        color: isActive ? '#10B981' : 'var(--text-primary)',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={18} style={{ color: isActive ? '#10B981' : 'var(--text-muted)' }} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>


            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
