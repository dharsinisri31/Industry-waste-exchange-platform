import React from 'react';

export default function Card({ children, className = '', hover = true }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden transition-all duration-200 shadow-xs ${
        hover ? 'hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
