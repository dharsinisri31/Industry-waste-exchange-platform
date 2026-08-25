import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col text-gray-900 font-sans">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-[1500px] mx-auto">
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
