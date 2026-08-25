import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AdminLayout from './AdminLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { ROLES, normalizeRole } from '../utils/roleUtils';

export default function DashboardLayout({ children }) {
  const { user, profile, activeRole, canonicalRole, isAdmin } = useAuth();

  const currentRole = canonicalRole || normalizeRole(user, profile, activeRole);

  // If Admin is accessing ANY page, always render the dedicated AdminLayout
  if (isAdmin || currentRole === ROLES.ADMIN) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col text-gray-900 font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
