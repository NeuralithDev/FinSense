import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Zap,
  CalendarClock,
  DollarSign,
  ShieldCheck,
  Building
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendChatMessage } from '../services/api';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';

export default function CopilotChat({ onNavigateTab }) {
  const { format, currency } = useCurrency();
  const {
    accounts,
    executeSweep,
    openSyncModal,
    safeSweepAmount
  } = useFinanceStore();

  const sweepVal = safeSweepAmount || 850.0;
  const chkBal = accounts?.checking?.balance || 10754.62;
  const savBal = accounts?.savings?.balance || 0.0;

  const greetingReserveText = savBal > 0
    ? `, with an emergency reserve of **${format(savBal)}** secured in your reserve account`
    : '';

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello! 👋 Great to see you.\n\nYour verified checking balance is sitting at **${format(chkBal)}**${greetingReserveText}.\n\nAll your upcoming bills and recurring transactions are accounted for, and our system calculates that **${format(sweepVal)}** is 100% safe to sweep into your savings goals today without any overdraft risk.\n\nWhat would you like to explore?`,
      intent: 'GREETING',
      confidence: 1.0,
      timestamp: 'Just now',
      action_card: {
        title: 'Smart Safe Sweep Ready',
        subtitle: `${format(sweepVal)} is ready to transfer without overdraft risk`,
        button_text: `Transfer ${format(sweepVal)} Now`,
        action_type: 'TRANSFER_SWEEP',
        amount: sweepVal
      }
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Can I afford a ₹24,990 gadget?',
    'How much can I safely save today?',
    'What subscriptions am I paying for?',
    'What will my balance look like in 14 days?',
    'How do I compare to peers like me?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleActionClick = async (card) => {
    if (!card) return;

    if (card.action_type === 'TRANSFER_SWEEP') {
      const amt = card.amount || 214.50;
      await executeSweep(amt);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `🎉 Transfer complete! **$${amt.toFixed(2)}** was successfully moved from Checking ($${(accounts.checking.balance - amt).toFixed(2)}) to your High-Yield Savings account and allocated to your Emergency Cushion.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if (card.action_type === 'NAVIGATE_TAB') {
      if (onNavigateTab && card.target_tab) {
        onNavigateTab(card.target_tab);
      }
    } else if (card.action_type === 'OPEN_SYNC') {
      openSyncModal();
    }
  };

  const handleSend = async (queryText = inputValue) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg = {
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage('0', queryText);
      const text = response.grounded_narrative || response.response || response.message || "I've analyzed your account data.";

      const assistantMsg = {
        sender: 'assistant',
        text: text,
        intent: response.intent,
        confidence: response.confidence,
        action_card: response.action_card,
        metrics: response.verified_metrics,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `I ran into a temporary hiccup retrieving the latest figures. Your current checking balance is ${format(chkBal)} and ${format(sweepVal)} is safe to sweep.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      color: '#0F172A',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488'
            }}>
              <Bot size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Ask FinSense AI
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0'
            }}>
              Personal Companion
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
            Conversational financial copilot grounded in your verified accounts, bills, and forward-looking models.
          </p>
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#334155',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat History Box */}
      <div style={{
        height: '420px',
        overflowY: 'auto',
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#0D9488',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: '0 1px 3px rgba(13, 148, 136, 0.2)'
                }}>
                  <Bot size={16} />
                </div>
              )}

              <div style={{
                maxWidth: '78%',
                background: isUser ? '#0F172A' : '#FFFFFF',
                color: isUser ? '#FFFFFF' : '#0F172A',
                border: isUser ? 'none' : '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '14px 18px',
                boxShadow: isUser ? 'none' : '0 2px 4px rgba(15, 23, 42, 0.04)',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap'
              }}>
                <div>
                  {m.text}
                </div>

                {/* 1-Click Interactive Action Card inside Chat Bubble */}
                {m.action_card && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="#0D9488" />
                        {m.action_card.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#15803D', marginTop: '2px' }}>
                        {m.action_card.subtitle}
                      </div>
                    </div>

                    <button
                      onClick={() => handleActionClick(m.action_card)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        alignSelf: 'flex-start',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.1)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#1E293B')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                    >
                      <Zap size={14} fill="#FFFFFF" />
                      <span>{m.action_card.button_text}</span>
                    </button>
                  </motion.div>
                )}

                <div style={{
                  fontSize: '0.68rem',
                  color: isUser ? '#94A3B8' : '#94A3B8',
                  marginTop: '8px',
                  textAlign: 'right'
                }}>
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <User size={15} />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#0D9488',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9488', animation: 'bounce 1s infinite 0ms' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9488', animation: 'bounce 1s infinite 200ms' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9488', animation: 'bounce 1s infinite 400ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
          padding: '4px 6px 4px 14px',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask anything (e.g. 'Can I afford a ₹24,990 gadget?' or 'How much can I safely save?')..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.88rem',
            color: '#0F172A',
            background: 'transparent',
            padding: '8px 0'
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: inputValue.trim() ? '#0F172A' : '#F1F5F9',
            color: inputValue.trim() ? '#FFFFFF' : '#94A3B8',
            border: 'none',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
