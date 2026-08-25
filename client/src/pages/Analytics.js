import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminAnalytics from './admin/AdminAnalytics';

export default function Analytics() {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <AdminAnalytics />;
  }
  return <Navigate to="/dashboard" replace />;
}
