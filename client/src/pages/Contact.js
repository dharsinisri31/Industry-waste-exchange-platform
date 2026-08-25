import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiArrowRight, FiInfo } from 'react-icons/fi';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 max-w-xl mx-auto w-full">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-2xs text-center space-y-6 w-full">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <FiInfo className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Contact EcoLink
            </h1>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              For this prototype, please use the platform after registration.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium leading-relaxed">
            Registered industrial participants can upload waste streams, specify material requirements, and coordinate transactions directly from within their dashboard.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>Register Facility</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200 transition-all text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

