import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  FiUser, FiShield, FiMail, FiLock, 
  FiLogOut, FiCheckCircle, FiSave 
} from 'react-icons/fi';

export default function AdminProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Platform Administrator');
  const [email] = useState(user?.email || 'admin@ecolink.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    showNotification('Administrator profile updated successfully.');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert('Please fill out both password fields.');
      return;
    }
    showNotification('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans max-w-4xl">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Administrator Profile
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Manage platform governance credentials and security authentication.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Identity Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <FiUser className="text-emerald-700 w-4 h-4" />
              <span>Account Credentials</span>
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Administrator Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">System Access Tier</label>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-emerald-700" />
                  <span>Platform Super-Administrator (Full Clearance)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
              >
                Update Profile Info
              </button>
            </form>
          </div>

          {/* Security Credentials */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <FiLock className="text-teal-700 w-4 h-4" />
              <span>Change Password</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-[11px] text-gray-500 space-y-1">
                <span className="font-bold text-gray-800 block">Security Policy:</span>
                <span>Requires minimum 8 characters with alphanumeric symbols. Platform governance enforces single root administrator clearance.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold shadow-xs transition-all cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
