import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, AlertTriangle, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import AnimatedNumber from '../primitives/AnimatedNumber';

export default function FloatingWidgets() {
  return (
    <>
      {/* Widget 1: Top Left - Subscription Leak Plugged */}
      <motion.div
        animate={{
          y: [-6, 4, -6],
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '12%',
          left: '2%',
          zIndex: 10,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '280px',
        }}
        className="hidden md:flex"
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} color="#0D9488" />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Subscription Creep Blocked
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
            Saved <span style={{ color: '#0D9488' }}><AnimatedNumber value={2340} decimals={0} /></span>/yr
          </div>
        </div>
      </motion.div>

      {/* Widget 2: Bottom Right - Weekend Spend Trigger */}
      <motion.div
        animate={{
          y: [4, -6, 4],
        }}
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '2%',
          zIndex: 10,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '290px',
        }}
        className="hidden md:flex"
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={18} color="#D97706" />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Behavioral Trigger Flagged
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
            Friday 21:00 Food Delivery
          </div>
        </div>
      </motion.div>
    </>
  );
}
