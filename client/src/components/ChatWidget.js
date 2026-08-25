import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function ChatWidget() {
  return (
    <Link
      to="/chat"
      className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-all z-50 flex items-center justify-center cursor-pointer"
      title="Open Resource Assistant"
    >
      <FiMessageSquare className="w-6 h-6" />
    </Link>
  );
}
