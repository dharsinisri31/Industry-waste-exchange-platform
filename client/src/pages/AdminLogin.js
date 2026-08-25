import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiShield, FiLock, FiMail, FiAlertCircle, FiArrowLeft, FiZap } from 'react-icons/fi';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide both administrator email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const user = await login(email, password);
      if (user.role === 'admin' || user.canonicalRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setErrorMsg('Access denied. This account does not possess platform administrative privileges.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-850 to-gray-900 p-4 font-sans text-gray-100 selection:bg-emerald-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-teal-600/10 blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl relative z-10 border border-slate-700/80 shadow-2xl space-y-6"
      >
        {/* Top Logo & Shield Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-900/40">
            <FiShield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              Eco<span className="text-emerald-400">Link</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Platform Governance & Regulatory Control Center
            </p>
          </div>
        </div>

        {/* Notice alert */}
        <div className="p-3 bg-slate-750/70 border border-slate-700 rounded-xl text-[11px] text-slate-300 flex items-start gap-2.5">
          <FiShield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Authorized personnel only. All access attempts and governance actions are cryptographically logged.
          </span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 p-3.5 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl text-xs font-semibold"
          >
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Admin Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <FiMail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ecolink.org"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Security Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <FiShield className="w-4 h-4" />
                <span>Authenticate Platform Operator</span>
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-slate-700/60">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Industry User Portal</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
