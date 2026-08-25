import React from 'react';

export default function Loader() {
  return (
    <div className="flex justify-center items-center py-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  );
}
