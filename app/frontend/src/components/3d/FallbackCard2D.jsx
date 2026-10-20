import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { springs } from '../../design-system/tokens';
import { useCurrency } from '../../design-system/currencyStore';
import { useFinanceStore } from '../../store/financeStore';

export default function FallbackCard2D() {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 4, y: -6 });
  const [isHovered, setIsHovered] = useState(false);
  const { format } = useCurrency();
  const { accounts } = useFinanceStore();
  const primaryAccount = accounts?.checking || Object.values(accounts || {})[0];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: -y * 0.05,
      y: x * 0.05,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 4, y: -6 });
    setIsHovered(false);
  };

  return (
    <div
      style={{
        perspective: '1200px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
      }}
    >
      {/* Floating Institutional Card (Stripe / Apple Card / Ramp aesthetic) */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          y: isHovered ? -6 : [-4, 4, -4],
        }}
        transition={{
          rotateX: { type: 'spring', stiffness: 240, damping: 22 },
          rotateY: { type: 'spring', stiffness: 240, damping: 22 },
          y: isHovered ? { duration: 0.25 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          width: '380px',
          height: '230px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid #334155',
          boxShadow: isHovered
            ? '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 15px 30px -10px rgba(15, 23, 42, 0.18)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          color: '#FFFFFF',
          cursor: 'pointer',
        }}
      >
        {/* Subtle Hairline Geometry */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Metallic EMV Chip */}
          <div
            style={{
              width: '42px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
              border: '1px solid #94A3B8',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#94A3B8' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: '1px', background: '#94A3B8' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: '35%', width: '1px', background: '#94A3B8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wifi size={16} color="rgba(255, 255, 255, 0.6)" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              FinSense<span style={{ color: '#0D9488' }}>.</span>
            </span>
          </div>
        </div>

        {/* Card Balance Metric */}
        <div>
          <div style={{ fontSize: '0.675rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Available Liquidity
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', color: '#F8FAFC' }}>
            {format(primaryAccount?.balance ?? 10754.62)}
          </div>
        </div>

        {/* Card Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.625rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Autopilot Defense
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', letterSpacing: '0.01em' }}>
              0% Overdraft Bound
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(13, 148, 136, 0.2)',
              border: '1px solid rgba(13, 148, 136, 0.4)',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#34D399',
            }}
          >
            <ShieldCheck size={13} />
            <span>99% Safety Margin</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
