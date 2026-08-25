import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, ROLES } from '../utils/roleUtils';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, profile, activeRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8faf9] text-gray-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <span className="text-xs font-bold text-gray-600">Verifying session credentials...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated:
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role check is required:
  if (allowedRoles && allowedRoles.length > 0) {
    const canonical = normalizeRole(user, profile, activeRole);
    const rawRole = (user.role || '').toLowerCase();

    const isAllowed = allowedRoles.some(r => {
      const target = r.toLowerCase();
      return (
        target === rawRole ||
        target === canonical?.toLowerCase() ||
        (target === 'industry_user' && (canonical === ROLES.SELLER || canonical === ROLES.BUYER)) ||
        (target === 'seller' && canonical === ROLES.SELLER) ||
        (target === 'buyer' && canonical === ROLES.BUYER) ||
        (target === 'admin' && canonical === ROLES.ADMIN)
      );
    });

    if (!isAllowed) {
      if (canonical === ROLES.ADMIN) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
