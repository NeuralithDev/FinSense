import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { useMetricInspector } from '../../store/metricInspectorStore';
import Badge from '../primitives/Badge';
import Button from '../primitives/Button';

export default function MetricInspectorModal() {
  const {
    isOpen,
    metricTitle,
    metricValue,
    formula,
    category,
    interpretation,
    engineeredFeatures,
    weights,
    close,
  } = useMetricInspector();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '88vh',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0F172A',
                }}
              >
                <Sliders size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {metricTitle}
                  </h3>
                  <Badge variant="emerald">{category}</Badge>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '3px 0 0' }}>
                  How this number is calculated in plain English
                </p>
              </div>
            </div>

            <button
              onClick={close}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metric Value & Formula Box */}
            <div
              style={{
                padding: '16px 20px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Current Value
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>
                  {metricValue}
                </div>
              </div>
              <div style={{ textAlign: 'right', maxWidth: '340px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                  How It Works
                </div>
                <div style={{ fontSize: '0.82rem', color: '#0F172A', background: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'inline-block', marginTop: '4px', lineHeight: 1.4 }}>
                  {formula}
                </div>
              </div>
            </div>

            {/* Plain-Language Interpretation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                background: '#F0F9FF',
                borderRadius: '10px',
                border: '1px solid #BAE6FD',
              }}
            >
              <Info size={18} style={{ color: '#0284C7', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8125rem', color: '#0369A1', lineHeight: 1.5 }}>
                <strong style={{ color: '#0C4A6E' }}>What this means for you:</strong> {interpretation}
              </div>
            </div>

            {/* Engineered Features Table */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} style={{ color: '#0D9488' }} />
                <span>What Goes Into This Number</span>
              </h4>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Factor</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Amount / Detail</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Importance</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineeredFeatures.length > 0 ? (
                      engineeredFeatures.map((feat, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < engineeredFeatures.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>
                            {feat.name}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#0F172A' }}>
                            {feat.value}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                            {feat.weight || '25%'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <Badge variant={feat.status === 'POSITIVE' || feat.status === 'OPTIMAL' || feat.status === 'Safe' || feat.status === 'Strong' ? 'emerald' : 'amber'}>
                              {feat.status || 'Normal'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>
                          Calculated directly from your bills, income, emergency buffer, and spending trends.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="secondary" size="sm" onClick={close}>
              Got It
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
