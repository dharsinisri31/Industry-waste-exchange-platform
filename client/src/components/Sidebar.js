import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiUploadCloud, FiShoppingBag, 
  FiTrendingUp, FiUser, FiZap, FiNavigation, 
  FiShield, FiFileText, FiLayers, FiActivity, FiBell, FiCheckCircle, FiX 
} from 'react-icons/fi';
import { ROLES, normalizeRole } from '../utils/roleUtils';
import API from '../services/authAPI';

export default function Sidebar() {
  const { user, profile, activeRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await API.get('/notifications');
      setNotifications(response.data || []);
    } catch (err) {
      // Quiet background check
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn(err.message);
    }
  };

  if (!user) return null;

  const currentRole = normalizeRole(user, profile, activeRole);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // SELLER NAVIGATION
  const sellerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/upload-waste', label: 'Upload Waste', icon: FiUploadCloud },
    { to: '/marketplace', label: 'Marketplace', icon: FiShoppingBag },
    { to: '/recommendations', label: 'Smart Matching', icon: FiZap },
    { to: '/traceability', label: 'Exchanges', icon: FiActivity },
    { to: '/route-optimization', label: 'Route Optimization', icon: FiNavigation },
    { to: '/documents', label: 'Documents', icon: FiFileText },
    { to: '/profile', label: 'Profile', icon: FiUser }
  ];

  // BUYER NAVIGATION
  const buyerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/marketplace', label: 'Marketplace', icon: FiShoppingBag },
    { to: '/my-requirements', label: 'Material Requirements', icon: FiLayers },
    { to: '/sourcing-matcher', label: 'Smart Matching', icon: FiZap },
    { to: '/traceability', label: 'Exchanges', icon: FiActivity },
    { to: '/route-optimization', label: 'Route Optimization', icon: FiNavigation },
    { to: '/documents', label: 'Documents', icon: FiFileText },
    { to: '/profile', label: 'Profile', icon: FiUser }
  ];

  // ADMIN NAVIGATION
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/admin/users', label: 'Users & Industries', icon: FiUser },
    { to: '/admin/waste-listings', label: 'Waste Listings', icon: FiShoppingBag },
    { to: '/admin/material-requirements', label: 'Material Requirements', icon: FiLayers },
    { to: '/admin/exchanges', label: 'Exchange Monitoring', icon: FiActivity },
    { to: '/admin/smart-matching', label: 'Smart Matching', icon: FiZap },
    { to: '/admin/analytics', label: 'Analytics', icon: FiTrendingUp },
    { to: '/admin/route-logistics', label: 'Route & Logistics', icon: FiNavigation },
    { to: '/admin/sustainability', label: 'Sustainability', icon: FiZap },
    { to: '/admin/compliance', label: 'Compliance', icon: FiShield },
    { to: '/admin/knowledge', label: 'Documents & Knowledge', icon: FiFileText },
    { to: '/admin/alerts', label: 'Alerts', icon: FiBell },
    { to: '/admin/settings', label: 'Settings', icon: FiLayers }
  ];

  const links = currentRole === ROLES.ADMIN ? adminLinks : (currentRole === ROLES.BUYER ? buyerLinks : sellerLinks);

  return (
    <>
      <aside className="w-64 border-r border-[#DDE7E2] bg-white h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex transition-colors shrink-0 sticky top-16 shadow-2xs font-sans">
        <div className="space-y-1 overflow-y-auto pr-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#E8F7F1] text-[#009B6B] border border-[#DDE7E2] shadow-2xs font-extrabold'
                      : 'text-[#12233F]/80 hover:bg-[#F7FAF8] hover:text-[#12233F] border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-[#009B6B] shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}

          {/* Dedicated Sidebar Notification Item */}
          <div className="pt-2 mt-2 border-t border-[#DDE7E2]">
            <button
              onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                showNotificationDrawer
                  ? 'bg-[#E8F7F1] text-[#009B6B] border border-[#DDE7E2] font-extrabold'
                  : 'text-[#12233F]/80 hover:bg-[#F7FAF8] hover:text-[#12233F] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <FiBell className="w-4 h-4 text-[#009B6B] shrink-0" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#009B6B] text-white flex items-center gap-1">
                  <span>●</span> {unreadCount}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-bold">0</span>
              )}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#DDE7E2] text-[11px] text-gray-500 text-center font-bold">
          EcoLink PoC Platform
        </div>
      </aside>

      {/* Slide-over / Modal Notification Drawer */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/20 backdrop-blur-xs font-sans">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowNotificationDrawer(false)}
          />
          <div className="relative w-80 sm:w-96 bg-white h-full shadow-2xl border-r border-[#DDE7E2] flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#DDE7E2]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#E8F7F1] text-[#009B6B]">
                    <FiBell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#12233F]">Notifications</h3>
                    <p className="text-[11px] text-gray-500 font-medium">Activity & transaction alerts</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {unreadCount > 0 && (
                <div className="flex justify-between items-center py-2.5 px-1">
                  <span className="text-[11px] font-bold text-[#009B6B]">{unreadCount} Unread Alert{unreadCount > 1 ? 's' : ''}</span>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-gray-600 hover:text-[#009B6B] font-bold underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>
              )}

              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-2 mt-3 pr-1">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <Link
                      key={i}
                      to={n.link || '/dashboard'}
                      onClick={() => setShowNotificationDrawer(false)}
                      className={`p-3 rounded-2xl text-xs space-y-1 block border transition-all ${
                        n.isRead 
                          ? 'bg-[#F7FAF8] border-[#DDE7E2] text-gray-600' 
                          : 'bg-[#E8F7F1] border-emerald-200 text-[#12233F] font-semibold'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#12233F]">{n.title || 'Platform Alert'}</p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#009B6B]"></span>}
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-gray-400 block pt-1">{new Date(n.createdAt || Date.now()).toLocaleDateString()}</span>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium space-y-2">
                    <FiCheckCircle className="w-8 h-8 mx-auto text-emerald-400/60" />
                    <p>All caught up! No notifications right now.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDE7E2]">
              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="w-full py-2.5 rounded-xl bg-[#F7FAF8] hover:bg-gray-100 text-[#12233F] font-bold text-xs border border-[#DDE7E2] transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
