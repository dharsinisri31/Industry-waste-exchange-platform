import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiShoppingBag, FiLayers, FiTrendingUp, 
  FiZap, FiBarChart2, FiNavigation, 
  FiGlobe, FiShield, FiFileText, 
  FiBell, FiSettings 
} from 'react-icons/fi';
import API from '../services/authAPI';

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    const fetchAlertsCount = async () => {
      try {
        const response = await API.get('/notifications');
        const count = (response.data || []).filter(n => !n.isRead).length;
        setUnreadAlertsCount(count);
      } catch (err) {
        // Quiet check
      }
    };
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const navSections = [
    {
      title: 'OVERVIEW',
      links: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome, aliases: ['/admin', '/admin/dashboard'] }
      ]
    },
    {
      title: 'PLATFORM',
      links: [
        { to: '/admin/users', label: 'Users & Industries', icon: FiUsers, aliases: ['/admin/users'] },
        { to: '/admin/waste-listings', label: 'Waste Listings', icon: FiShoppingBag, aliases: ['/admin/waste-listings', '/admin/listings'] },
        { to: '/admin/material-requirements', label: 'Material Requirements', icon: FiLayers, aliases: ['/admin/material-requirements', '/admin/requirements'] },
        { to: '/admin/exchanges', label: 'Exchange Monitoring', icon: FiTrendingUp, aliases: ['/admin/exchanges'] }
      ]
    },
    {
      title: 'INTELLIGENCE',
      links: [
        { to: '/admin/smart-matching', label: 'Smart Matching', icon: FiZap, aliases: ['/admin/smart-matching', '/admin/ai'] },
        { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2, aliases: ['/admin/analytics'] }
      ]
    },
    {
      title: 'OPERATIONS',
      links: [
        { to: '/admin/route-logistics', label: 'Route & Logistics', icon: FiNavigation, aliases: ['/admin/route-logistics', '/admin/logistics'] },
        { to: '/admin/sustainability', label: 'Sustainability', icon: FiGlobe, aliases: ['/admin/sustainability'] }
      ]
    },
    {
      title: 'TRUST & COMPLIANCE',
      links: [
        { to: '/admin/compliance', label: 'Compliance', icon: FiShield, aliases: ['/admin/compliance'] },
        { to: '/admin/knowledge', label: 'Knowledge & Documents', icon: FiFileText, aliases: ['/admin/knowledge', '/admin/rag', '/admin/documents'] }
      ]
    },
    {
      title: 'SYSTEM',
      links: [
        { to: '/admin/alerts', label: 'Alerts & Notifications', icon: FiBell, aliases: ['/admin/alerts'], hasBadge: true },
        { to: '/admin/settings', label: 'Settings', icon: FiSettings, aliases: ['/admin/settings'] }
      ]
    }
  ];

  const isLinkActive = (link) => {
    if (currentPath === link.to) return true;
    if (link.aliases && link.aliases.some(alias => currentPath.startsWith(alias))) return true;
    return false;
  };

  return (
    <aside className="w-64 border-r border-[#DDE7E2] bg-white h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex transition-colors shrink-0 sticky top-16 shadow-2xs font-sans">
      <div className="space-y-4 overflow-y-auto pr-1">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-gray-500 px-3 block">
              {section.title}
            </span>
            {section.links.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(link);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#E8F7F1] text-[#009B6B] border border-[#DDE7E2] shadow-2xs'
                      : 'text-[#12233F]/80 hover:bg-[#F7FAF8] hover:text-[#12233F] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#009B6B]' : 'text-gray-500'}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.hasBadge && unreadAlertsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-[#009B6B] text-white">
                      {unreadAlertsCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-[#DDE7E2] text-[11px] text-gray-500 text-center font-bold">
        Admin Platform Hub
      </div>
    </aside>
  );
}
