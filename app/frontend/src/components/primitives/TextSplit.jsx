import React from 'react';
import { motion } from 'framer-motion';

export default function TextSplit({
  text,
  accentWords = [],
  className = '',
  delay = 0,
  style = {},
}) {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: () => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 180,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 180,
      },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.28em', ...style }}
      className={className}
    >
      {words.map((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        const isAccent = accentWords.some(
          (aw) => aw.toLowerCase() === cleanWord || aw.toLowerCase() === word.toLowerCase()
        );

        return (
          <motion.span
            key={index}
            variants={child}
            style={{
              display: 'inline-block',
              fontWeight: 'inherit',
              color: isAccent ? '#0D9488' : 'inherit',
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
