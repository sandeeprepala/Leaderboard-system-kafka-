import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hoverEffect = true, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect ? { y: -4, boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.65)', borderColor: 'rgba(59, 130, 246, 0.35)' } : {}}
      transition={{ duration: 0.2 }}
      className={`glass-card rounded-2xl p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
