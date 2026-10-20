import React, { useState, useEffect, Suspense, lazy } from 'react';
import FallbackCard2D from './FallbackCard2D';

const GlassCard3D = lazy(() => import('./GlassCard3D'));

export default function Hero3DContainer() {
  const [use3D, setUse3D] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check WebGL availability and reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl || prefersReducedMotion || isMobile) {
        setUse3D(false);
      }
    } catch (e) {
      setUse3D(false);
    }
  }, []);

  if (hasError || !use3D) {
    return <FallbackCard2D />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Suspense fallback={<FallbackCard2D />}>
        <GlassCard3D />
      </Suspense>
    </div>
  );
}
