import React from 'react';
import { FiZap } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#DDE7E2] py-6 px-4 sm:px-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5F6B7A]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#009B6B] text-white">
            <FiZap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-[#12233F]">
              Eco<span className="text-[#009B6B]">Link</span>
            </span>
            <span className="text-[#DDE7E2]">|</span>
            <span className="font-semibold text-xs text-[#5F6B7A]">
              Industrial Resource Exchange
            </span>
          </div>
        </div>

        <div className="text-[11px] font-medium text-[#5F6B7A]">
          &copy; {new Date().getFullYear()} EcoLink. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

