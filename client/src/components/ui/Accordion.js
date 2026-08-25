import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="glass-card rounded-2xl border border-slate-700/60 overflow-hidden transition-colors"
          >
            <button
              onClick={() => toggleIndex(idx)}
              className="w-full p-5 text-left flex justify-between items-center text-slate-100 font-semibold text-base sm:text-lg focus:outline-none cursor-pointer"
            >
              <span>{item.question}</span>
              <FiChevronDown
                className={`w-5 h-5 text-emerald-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-5 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 pt-3">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
