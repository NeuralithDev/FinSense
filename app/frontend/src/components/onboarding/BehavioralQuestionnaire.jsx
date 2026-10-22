import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Brain, 
  Compass, 
  Zap, 
  Lock,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useCurrency } from '../../design-system/currencyStore';

export default function BehavioralQuestionnaire({ onComplete, onBack }) {
  const { currency, format } = useCurrency();
  const isINR = currency?.code === 'INR';
  const [currentStep, setCurrentStep] = useState(0); // 0 to 4: questions, 5: computing, 6: reveal
  const [answers, setAnswers] = useState({});
  const [computingStage, setComputingStage] = useState(0);

  const questions = [
    {
      id: 'trigger',
      category: 'Behavioral Psychology',
      title: 'When are you most vulnerable to unplanned spending?',
      subtitle: 'FinSense catches behavioral triggers before checkout, unlike rear-view apps that only alert you after.',
      options: [
        {
          key: '1',
          text: 'After exhausting workdays (convenience food, quick retail fixes)',
          badge: 'Fatigue Trigger',
          archetypeWeight: { velocity: 3, builder: 1, accumulator: 0, architect: 2 }
        },
        {
          key: '2',
          text: 'Weekend social gatherings and group events (dining, rounds of drinks)',
          badge: 'Social Velocity',
          archetypeWeight: { velocity: 4, builder: 0, accumulator: 0, architect: 2 }
        },
        {
          key: '3',
          text: 'Targeted flash sales and digital algorithms (limited-time FOMO)',
          badge: 'Algorithmic Trap',
          archetypeWeight: { velocity: 3, builder: 0, accumulator: 1, architect: 1 }
        },
        {
          key: '4',
          text: 'Rarely impulsive, but I experience anxiety over necessary purchases',
          badge: 'Vigilant Reserve',
          archetypeWeight: { velocity: 0, builder: 2, accumulator: 4, architect: 3 }
        }
      ]
    },
    {
      id: 'subscriptions',
      category: 'Subscription Defense',
      title: 'How do you currently handle dormant subscriptions and price hikes?',
      subtitle: 'Traditional apps tell you to cancel manually. FinSense computes redundancy and creeps proactively.',
      options: [
        {
          key: '1',
          text: 'Autonomous Defense: Flag and cancel anything unused for 60+ days',
          badge: 'High Autonomy',
          archetypeWeight: { velocity: 2, builder: 4, accumulator: 2, architect: 3 }
        },
        {
          key: '2',
          text: 'Advisory Queue: Send me a weekly clawback queue for 1-tap confirmation',
          badge: 'Semi-Autonomous',
          archetypeWeight: { velocity: 2, builder: 3, accumulator: 2, architect: 4 }
        },
        {
          key: '3',
          text: 'Overdraft Immune Only: Alert me strictly if a recurring charge threatens liquidity',
          badge: 'Safety Net',
          archetypeWeight: { velocity: 3, builder: 1, accumulator: 3, architect: 2 }
        },
        {
          key: '4',
          text: 'I keep subscriptions active "just in case" even if rarely used',
          badge: 'Subscription Creep Risk',
          archetypeWeight: { velocity: 4, builder: 0, accumulator: 1, architect: 1 }
        }
      ]
    },
    {
      id: 'forecast',
      category: 'Forward Cash Horizon',
      title: isINR ? 'When considering a large purchase (₹10,000+), how do you decide?' : 'When considering a large purchase ($500+), how do you decide?',
      subtitle: 'Moving beyond checking balance guesswork with 30-day forward forecasts.',
      options: [
        {
          key: '1',
          text: 'I look at current checking balance and guess if upcoming payroll covers it',
          badge: 'Rearview Guessing',
          archetypeWeight: { velocity: 4, builder: 0, accumulator: 0, architect: 1 }
        },
        {
          key: '2',
          text: 'I run a mental forecast of upcoming bills for the next 2-3 weeks',
          badge: 'Manual Estimator',
          archetypeWeight: { velocity: 2, builder: 2, accumulator: 2, architect: 3 }
        },
        {
          key: '3',
          text: 'I delay 48 hours to test if the impulse subsides',
          badge: 'Friction Barrier',
          archetypeWeight: { velocity: 1, builder: 3, accumulator: 3, architect: 3 }
        },
        {
          key: '4',
          text: 'I consult an automated forward-looking cash flow runway model',
          badge: 'Quantitative Horizon',
          archetypeWeight: { velocity: 0, builder: 4, accumulator: 3, architect: 4 }
        }
      ]
    },
    {
      id: 'autopilot',
      category: 'Automated Wealth Velocity',
      title: 'What is your preferred savings sweep strategy?',
      subtitle: 'FinSense uses probabilistic confidence intervals to guarantee 0.00% overdraft risk.',
      options: [
        {
          key: '1',
          text: 'Conservative Guardrail: Maximum cash buffer retention (99.5% confidence)',
          badge: 'Risk Minimizer',
          archetypeWeight: { velocity: 0, builder: 2, accumulator: 4, architect: 3 }
        },
        {
          key: '2',
          text: 'Recommended Balance: Optimal mix of growing savings while staying 100% safe for upcoming bills',
          badge: 'Most Popular',
          archetypeWeight: { velocity: 2, builder: 4, accumulator: 2, architect: 4 }
        },
        {
          key: '3',
          text: 'Wealth Accelerator: Maximum compound velocity into high-yield reserves (95.0% confidence)',
          badge: 'Alpha Maximizer',
          archetypeWeight: { velocity: 4, builder: 3, accumulator: 1, architect: 3 }
        },
        {
          key: '4',
          text: 'Manual Transfers Only: I prefer approving all capital movements',
          badge: 'Full Manual',
          archetypeWeight: { velocity: 1, builder: 1, accumulator: 3, architect: 2 }
        }
      ]
    },
    {
      id: 'anomalies',
      category: 'Autonomous Guardrails',
      title: 'How should FinSense handle surprise charges and unusual spending?',
      subtitle: 'Continuous real-time protection against duplicate bills and unexpected charges.',
      options: [
        {
          key: '1',
          text: 'Active Defense: Freeze virtual cards on consensus fraud/duplicate anomalies',
          badge: 'Hard Lockdown',
          archetypeWeight: { velocity: 1, builder: 4, accumulator: 3, architect: 4 }
        },
        {
          key: '2',
          text: 'Instant Push Verification: Send 2-factor push before processing abnormal amounts',
          badge: 'Human-in-the-Loop',
          archetypeWeight: { velocity: 2, builder: 3, accumulator: 3, architect: 3 }
        },
        {
          key: '3',
          text: 'Weekly Summary: Log surprise charges in my dashboard for a quiet weekly review',
          badge: 'Weekly Review',
          archetypeWeight: { velocity: 3, builder: 1, accumulator: 1, architect: 2 }
        },
        {
          key: '4',
          text: 'Behavioral Friction: Enforce 15-minute cooling lock on late-night impulse spikes',
          badge: 'Impulse Brake',
          archetypeWeight: { velocity: 3, builder: 4, accumulator: 2, architect: 4 }
        }
      ]
    }
  ];

  // Handle keyboard 1-4 shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentStep >= questions.length) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const option = questions[currentStep].options.find(o => o.key === e.key);
        if (option) handleSelectOption(option);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const handleSelectOption = (option) => {
    const qId = questions[currentStep].id;
    setAnswers(prev => ({ ...prev, [qId]: option }));

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 200);
    } else {
      // Advance to computing stage
      setCurrentStep(5);
    }
  };

  // Computing interstitial sequence
  useEffect(() => {
    if (currentStep === 5) {
      const t1 = setTimeout(() => setComputingStage(1), 600);
      const t2 = setTimeout(() => setComputingStage(2), 1200);
      const t3 = setTimeout(() => setComputingStage(3), 1800);
      const t4 = setTimeout(() => setCurrentStep(6), 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentStep]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          height: '64px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
            FinSense<span style={{ color: '#0D9488' }}>.</span>
          </span>
        </div>

        {currentStep < 5 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Question <span style={{ color: '#0F172A', fontWeight: 700 }}>{currentStep + 1}</span> of {questions.length}
            </div>
            <button
              onClick={onComplete}
              style={{
                background: '#0D9488',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Skip to Dashboard</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={onBack}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#64748B',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              Exit
            </button>
          </div>
        )}
      </header>

      {/* Progress Line */}
      {currentStep < 5 && (
        <div style={{ width: '100%', height: '3px', background: '#E2E8F0' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: '#0D9488',
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* STAGE 1: QUESTIONS (0 to 4) */}
        {currentStep < 5 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', maxWidth: '640px' }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#0D9488',
                  marginBottom: '10px',
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9488' }} />
                <span>{questions[currentStep].category}</span>
              </div>

              <h2
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                  marginBottom: '8px',
                }}
              >
                {questions[currentStep].title}
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#64748B',
                  lineHeight: 1.5,
                  marginBottom: '28px',
                }}
              >
                {questions[currentStep].subtitle}
              </p>

              {/* Option List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {questions[currentStep].options.map((option) => {
                  const isSelected = answers[questions[currentStep].id]?.key === option.key;
                  return (
                    <div
                      key={option.key}
                      onClick={() => handleSelectOption(option)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: isSelected ? '#F0FDF4' : '#FFFFFF',
                        border: isSelected ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isSelected ? '#0D9488' : '#F1F5F9',
                            color: isSelected ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}
                        >
                          {option.key}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                          {option.text}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#F1F5F9',
                          color: '#475569',
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace'
                        }}
                      >
                        {option.badge}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '0.78rem',
                  color: '#64748B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Press keys</span>
                  <span style={{ padding: '2px 6px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#0F172A', fontWeight: 600 }}>1</span>
                  <span style={{ padding: '2px 6px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#0F172A', fontWeight: 600 }}>2</span>
                  <span style={{ padding: '2px 6px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#0F172A', fontWeight: 600 }}>3</span>
                  <span style={{ padding: '2px 6px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', color: '#0F172A', fontWeight: 600 }}>4</span>
                </div>

                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* STAGE 2: COMPUTING INTERSTITIAL (5) */}
        {currentStep === 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: '100%',
              maxWidth: '500px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Compass size={28} color="#0D9488" />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Synthesizing Spending DNA
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748B', marginBottom: '24px' }}>
              Calibrating forward cash-flow models against your behavioral profile...
            </p>

            <div
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                textAlign: 'left',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: computingStage >= 0 ? '#0D9488' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Forecasting your 30-day upcoming balance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: computingStage >= 1 ? '#0D9488' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Spotting everyday spending habits and impulse triggers</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: computingStage >= 2 ? '#0D9488' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Personalizing your smart auto-save pace</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: computingStage >= 3 ? '#0D9488' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Connecting anonymous peer savings benchmarks</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: ARCHETYPE REVEAL (6) */}
        {currentStep === 6 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: '580px' }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
                textAlign: 'center'
              }}
            >
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: '#F0FDF4',
                  color: '#0D9488',
                  border: '1px solid #BBF7D0',
                  fontFamily: 'monospace',
                  display: 'inline-block',
                  marginBottom: '12px'
                }}
              >
                BEHAVIORAL ARCHETYPE IDENTIFIED
              </span>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                The Strategic Wealth Architect
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                High income stability with specific temporal impulse spikes around evening exhaustion. FinSense has configured autonomous friction locks and 99.0% overdraft-immune sweeps.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Recommended Pace:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>Recommended Balance (Protected)</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Safe-Sweep Capacity:</span>
                  <div style={{ fontWeight: 600, color: '#0D9488', fontFamily: 'monospace' }}>{format(850)} / cycle</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Vulnerability Window:</span>
                  <div style={{ fontWeight: 600, color: '#E11D48' }}>Friday 20:00 &ndash; 23:00</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Runway Multiplier:</span>
                  <div style={{ fontWeight: 600, color: '#0D9488', fontFamily: 'monospace' }}>+2.4 Months (30D)</div>
                </div>
              </div>

              <button
                onClick={onComplete}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Enter Live Financial Cockpit</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
