import React from 'react';

export default function Badge({ children, variant = 'emerald', className = '' }) {
  const variants = {
    ai: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${variants[variant] || variants.emerald} ${className}`}>
      {children}
    </span>
  );
}
