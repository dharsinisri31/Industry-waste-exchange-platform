import React from 'react';
import { FiSearch } from 'react-icons/fi';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search...' }) {
  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 placeholder-gray-500 font-medium"
      />
    </form>
  );
}
