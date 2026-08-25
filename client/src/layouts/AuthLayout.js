import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf9] via-emerald-50/40 to-[#f0fdf4] flex items-center justify-center p-4 font-sans text-gray-900">
      {children}
    </div>
  );
}
