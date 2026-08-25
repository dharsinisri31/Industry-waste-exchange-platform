import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardData as getIndustryDashboard } from '../services/industryAPI';
import { apiGet } from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import { ROLES, normalizeRole } from '../utils/roleUtils';
import { Link, Navigate } from 'react-router-dom';
import { FiAlertCircle, FiLogIn } from 'react-icons/fi';

export default function Dashboard() {
  const { user, profile, activeRole, loading: authLoading } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    uploadedWasteCount: 0,
    revenue: 0,
    carbonSaved: 0,
    pendingCount: 0,
    completedCount: 0
  });
  const [nearbyIndustries, setNearbyIndustries] = useState([]);
  const [userProfileData, setUserProfileData] = useState(null);
  const [myRequirements, setMyRequirements] = useState([]);

  const currentRole = normalizeRole(user, profile, activeRole);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      // Admin dashboard handles its own data fetching
      if (currentRole === ROLES.ADMIN) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        const [dashData, reqsData] = await Promise.all([
          getIndustryDashboard().catch(() => ({})),
          apiGet('/api/buyer-requirements/my').catch(() => ([]))
        ]);

        if (isMounted) {
          if (dashData && typeof dashData === 'object') {
            if (dashData.metrics) {
              setDashboardMetrics(prev => ({ ...prev, ...dashData.metrics }));
            }
            if (Array.isArray(dashData.nearbyIndustries)) {
              setNearbyIndustries(dashData.nearbyIndustries);
            }
            if (dashData.profile) {
              setUserProfileData(dashData.profile);
            }
          }

          if (Array.isArray(reqsData)) {
            setMyRequirements(reqsData);
          }
        }
      } catch (err) {
        console.warn('[Dashboard data warning]:', err.message);
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    if (user && !authLoading) {
      fetchDashboard();
    }
    return () => { isMounted = false; };
  }, [user, authLoading, currentRole]);

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8faf9] text-gray-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <span className="text-xs font-bold text-gray-600">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Admin Role -> Redirect cleanly to Admin Dashboard
  if (currentRole === ROLES.ADMIN || user?.role === 'admin' || user?.canonicalRole === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // 4. Undetermined Role Fallback (Never crash to blank page!)
  if (!currentRole) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-900">Role Verification Required</h2>
          <p className="text-xs text-gray-600">
            Your account role could not be determined. Please log in again to refresh your session credentials.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
          >
            <FiLogIn className="w-4 h-4" /> Log In Again
          </Link>
        </div>
      </div>
    );
  }

  const activeProfile = userProfileData || profile;

  return (
    <DashboardLayout>
      {dataLoading ? (
        <div className="py-16 flex justify-center">
          <Loader />
        </div>
      ) : currentRole === ROLES.BUYER ? (
        <BuyerDashboard
          user={user}
          profile={activeProfile}
          metrics={dashboardMetrics}
          myRequirements={myRequirements}
        />
      ) : (
        <SellerDashboard
          user={user}
          profile={activeProfile}
          metrics={dashboardMetrics}
          nearbyIndustries={nearbyIndustries}
        />
      )}
    </DashboardLayout>
  );
}
