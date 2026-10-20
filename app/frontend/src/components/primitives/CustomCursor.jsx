import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.btn') ||
        target.closest('.interactive-target')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      animate={{
        x: mousePos.x - (isHovered ? 16 : 4),
        y: mousePos.y - (isHovered ? 16 : 4),
        width: isHovered ? 32 : 8,
        height: isHovered ? 32 : 8,
        backgroundColor: isHovered ? 'rgba(15, 23, 42, 0.08)' : '#0F172A',
        borderColor: isHovered ? '#0F172A' : 'transparent',
      }}
      transition={{ type: 'spring', damping: 28, stiffness: 450, mass: 0.15 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        borderRadius: '50%',
        borderWidth: '1px',
        borderStyle: 'solid',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
