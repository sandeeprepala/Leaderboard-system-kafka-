import React from 'react';

export default function Loader({ size = 'medium', className = '' }) {
  const sizes = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-white/10 border-t-accentBlue rounded-full animate-spin`} />
    </div>
  );
}
