import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, trend }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-700/60 shadow-xl backdrop-blur-md relative overflow-hidden group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="text-3xl font-extrabold text-slate-100 tracking-tight">{value}</div>

      {subtext && (
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          {trend && <span className="text-emerald-400 font-semibold">{trend}</span>}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
