import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiLogOut, FiZap, FiSearch, FiUser } from 'react-icons/fi';
import API from '../services/authAPI';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      setNotifications(response.data || []);
    } catch (err) {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/admin/exchanges', label: 'Exchanges' },
    { to: '/admin/users', label: 'Industries' },
    { to: '/admin/analytics', label: 'Analytics' }
  ];

  return (
    <header className="h-16 border-b border-[#E1E8E5] bg-white sticky top-0 z-50 shadow-xs font-sans">
      <div className="max-w-[1500px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* LEFT: Logo & Platform Label */}
        <Link to="/admin/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="p-2 rounded-xl bg-[#008F68] text-white shadow-xs group-hover:bg-[#006B4F] transition-all">
            <FiZap className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-[#172B3A] leading-tight">
              ECO<span className="text-[#008F68]">LINK</span>
            </span>
            <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider hidden sm:block">
              Industrial Resource Exchange
            </span>
          </div>
        </Link>

        {/* CENTER: Horizontal Top Navigation */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to || (link.to === '/marketplace' && location.pathname.startsWith('/marketplace'));
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
                  isActive
                    ? 'text-[#006B4F] bg-[#E8F7F1] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-[#008F68]'
                    : 'text-[#172B3A] hover:text-[#008F68] hover:bg-gray-50'
                }`}
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* RIGHT: Search, Profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  placeholder="Search marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  autoFocus
                  className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#008F68] bg-white text-[#172B3A]"
                />
                <FiSearch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#172B3A] hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                title="Search Marketplace"
              >
                <FiSearch className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile Badge */}
          <Link
            to="/admin/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 border border-[#E1E8E5] transition-all text-xs"
            title="Administrator Account"
          >
            <div className="w-6 h-6 rounded-full bg-[#006B4F] text-white flex items-center justify-center text-[11px] font-bold">
              {userInitial}
            </div>
            <div className="text-left hidden lg:block">
              <span className="font-bold text-[#172B3A] block leading-tight">Platform Admin</span>
              <span className="text-[10px] text-[#6B7280] font-medium">{user?.email || 'admin@ecolink.market'}</span>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
            title="Sign Out"
          >
            <FiLogOut className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
