import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';
import Navbar from './components/landing/Navbar';
import HeroSection from './components/landing/HeroSection';
import SocialProofStrip from './components/landing/SocialProofStrip';
import ScrollStory from './components/landing/ScrollStory';
import FinalCTA from './components/landing/FinalCTA';
import Footer from './components/landing/Footer';
import CustomCursor from './components/primitives/CustomCursor';
import AuthScreen from './components/auth/AuthScreen';
import BehavioralQuestionnaire from './components/onboarding/BehavioralQuestionnaire';

// Executive Cockpit Views & Shell
import AppShell from './components/layout/AppShell';
import HealthHero from './components/HealthHero';
import ForecastHorizon from './components/ForecastHorizon';
import AutopilotHub from './components/AutopilotHub';
import SubscriptionCommander from './components/SubscriptionCommander';
import SpendingAnalysisDashboard from './components/SpendingAnalysisDashboard';
import AffordabilitySimulator from './components/AffordabilitySimulator';
import CopilotChat from './components/CopilotChat';
import TwinBenchmarking from './components/TwinBenchmarking';
import AnomalyGuardModule from './components/AnomalyGuardModule';
import BehavioralSpendGraph from './components/BehavioralSpendGraph';
import FeatureExplorer from './components/FeatureExplorer';
import RecentActivityLedger from './components/RecentActivityLedger';
import BankSyncModal from './components/modals/BankSyncModal';
import { useFinanceStore } from './store/financeStore';

import { 
  fetchHealthScore, 
  fetchForecast, 
  fetchSubscriptions, 
  fetchAutopilot, 
  fetchTwins,
  syncIngestion
} from './services/api';
import { LayoutDashboard } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'auth' | 'onboarding' | 'cockpit'
  const [authInitialMode, setAuthInitialMode] = useState('signup');
  const [activeTab, setActiveTab] = useState('cockpit');
  const [horizonDays, setHorizonDays] = useState(30);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Financial State
  const [healthData, setHealthData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [subData, setSubData] = useState(null);
  const [autopilotData, setAutopilotData] = useState(null);
  const [twinData, setTwinData] = useState(null);

  const { refreshStore } = useFinanceStore();

  // Initialize Lenis smooth scroll
  useEffect(() => {
    let lenis;
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis smooth scroll fallback:', e);
    }

    return () => {
      if (lenis) lenis.destroy();
    };
  }, []);

  // Load dashboard data
  const loadData = async (hDays = horizonDays) => {
    try {
      const [health, forecast, subs, autopilot, twins] = await Promise.all([
        fetchHealthScore('0'),
        fetchForecast('0', hDays),
        fetchSubscriptions('0'),
        fetchAutopilot('0'),
        fetchTwins('0'),
      ]);
      setHealthData(health);
      setForecastData(forecast);
      setSubData(subs);
      setAutopilotData(autopilot);
      setTwinData(twins);
      await refreshStore();
    } catch (err) {
      console.error('Failed to load financial state:', err);
    }
  };

  useEffect(() => {
    loadData(horizonDays);
  }, []);

  const handleHorizonChange = async (days) => {
    setHorizonDays(days);
    const forecast = await fetchForecast('0', days);
    setForecastData(forecast);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncIngestion('PLAID', '0');
      setSyncStatus(res);
      await loadData();
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#F8FAFC' }}>
      <CustomCursor />
      
      {/* Global Bank Sync & Ingestion Modal */}
      <BankSyncModal />

      {/* Floating Cockpit Switcher on Landing Page Only (Never overlap cockpit) */}
      {viewMode === 'landing' && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9990,
          }}
        >
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setViewMode('cockpit');
            }}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: '1px solid #334155',
              borderRadius: '9999px',
              padding: '10px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <LayoutDashboard size={15} />
            <span>Live Executive Cockpit</span>
          </button>
        </div>
      )}

      {/* VIEW 1: AUTH SCREEN */}
      {viewMode === 'auth' ? (
        <AuthScreen
          initialMode={authInitialMode}
          onBack={() => setViewMode('landing')}
          onSuccess={() => setViewMode('onboarding')}
        />
      ) : viewMode === 'onboarding' ? (
        /* VIEW 2: BEHAVIORAL QUESTIONNAIRE ONBOARDING */
        <BehavioralQuestionnaire
          onBack={() => setViewMode('landing')}
          onComplete={() => setViewMode('cockpit')}
        />
      ) : viewMode === 'landing' ? (
        /* VIEW 3: INSTITUTIONAL LANDING PAGE */
        <>
          <Navbar
            onOpenCockpit={() => setViewMode('cockpit')}
            onOpenAuth={(mode) => {
              setAuthInitialMode(mode);
              setViewMode('auth');
            }}
          />
          <main style={{ flex: 1 }}>
            <HeroSection
              onStartOnboarding={() => setViewMode('onboarding')}
              onOpenCockpit={() => setViewMode('cockpit')}
            />
            <SocialProofStrip />
            <ScrollStory onOpenCockpit={() => setViewMode('cockpit')} />
            <FinalCTA
              onStartOnboarding={() => setViewMode('onboarding')}
              onOpenCockpit={() => setViewMode('cockpit')}
            />
          </main>
          <Footer onOpenCockpit={() => setViewMode('cockpit')} />
        </>
      ) : (
        /* VIEW 4: PRODUCTION EXECUTIVE COCKPIT WITH APPSHELL */
        <AppShell
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSync={handleSync}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
          onOpenLanding={() => setViewMode('landing')}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'cockpit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <HealthHero healthData={healthData} />
                  <RecentActivityLedger />
                  <ForecastHorizon
                    forecastData={forecastData}
                    onHorizonChange={handleHorizonChange}
                    currentHorizon={horizonDays}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    <AutopilotHub autopilotData={autopilotData} onSweepExecuted={loadData} />
                    <AffordabilitySimulator />
                  </div>
                  <SubscriptionCommander subscriptionData={subData} />
                  <AnomalyGuardModule />
                  <SpendingAnalysisDashboard 
                    subscriptionData={subData} 
                    onRunwayUpdated={() => loadData(horizonDays)} 
                  />
                  <TwinBenchmarking twinData={twinData} />
                </div>
              )}

              {activeTab === 'forecast' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ForecastHorizon
                    forecastData={forecastData}
                    onHorizonChange={handleHorizonChange}
                    currentHorizon={horizonDays}
                  />
                  <RecentActivityLedger />
                </div>
              )}

              {activeTab === 'subscriptions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <SubscriptionCommander subscriptionData={subData} />
                  <TwinBenchmarking twinData={twinData} />
                </div>
              )}

              {activeTab === 'autopilot' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <AutopilotHub autopilotData={autopilotData} onSweepExecuted={loadData} />
                  <ForecastHorizon
                    forecastData={forecastData}
                    onHorizonChange={handleHorizonChange}
                    currentHorizon={horizonDays}
                  />
                </div>
              )}

              {activeTab === 'anomalies' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <AnomalyGuardModule />
                  <TwinBenchmarking twinData={twinData} />
                </div>
              )}

              {activeTab === 'graph' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <BehavioralSpendGraph />
                  <SpendingAnalysisDashboard 
                    subscriptionData={subData} 
                    onRunwayUpdated={() => loadData(horizonDays)} 
                  />
                </div>
              )}

              {activeTab === 'features' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <FeatureExplorer />
                </div>
              )}

              {activeTab === 'affordability' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <AffordabilitySimulator />
                  <ForecastHorizon
                    forecastData={forecastData}
                    onHorizonChange={handleHorizonChange}
                    currentHorizon={horizonDays}
                  />
                </div>
              )}

              {activeTab === 'twins' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <TwinBenchmarking twinData={twinData} />
                </div>
              )}

              {activeTab === 'copilot' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <CopilotChat />
                </div>
              )}

              {activeTab === 'spending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <SpendingAnalysisDashboard 
                    subscriptionData={subData} 
                    onRunwayUpdated={() => loadData(horizonDays)} 
                  />
                  <BehavioralSpendGraph />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </AppShell>
      )}
    </div>
  );
}
