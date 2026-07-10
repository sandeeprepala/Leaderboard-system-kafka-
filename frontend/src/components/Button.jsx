import React from 'react';
import { motion } from 'framer-motion';

export default function Button({ children, type = 'button', variant = 'primary', className = '', onClick, disabled, loading }) {
  const base = 'px-6 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm outline-none disabled:opacity-40 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'accent-gradient text-white border border-transparent shadow-glow hover:brightness-110 active:brightness-95',
    secondary: 'bg-white/10 hover:bg-white/15 text-textPrimary border border-borderLight active:bg-white/5',
    outline: 'bg-transparent text-textPrimary border border-borderLight hover:bg-white/5 active:bg-white/10 hover:border-textSecondary',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/5'
  };

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
}
