import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import Home from '../pages/Home';
import Marketplace from '../pages/Marketplace';
import HowItWorks from '../pages/HowItWorks';
import Solutions from '../pages/Solutions';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import Traceability from '../pages/Traceability';
import ExchangeDetail from '../pages/ExchangeDetail';

// Authenticated Industry Pages
import Dashboard from '../pages/Dashboard';
import UploadWaste from '../pages/UploadWaste';
import WasteDetails from '../pages/WasteDetails';
import PostRequirement from '../pages/PostRequirement';
import MyRequirements from '../pages/MyRequirements';
import BuyerSupplierMatcher from '../pages/BuyerSupplierMatcher';
import Recommendations from '../pages/Recommendations';
import RouteOptimization from '../pages/RouteOptimization';
import Documents from '../pages/Documents';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import ResourcePassport from '../pages/ResourcePassport';
import WasteJourneyTracker from '../pages/WasteJourneyTracker';

// Dedicated Modular Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminWasteListings from '../pages/admin/AdminWasteListings';
import AdminMaterialRequirements from '../pages/admin/AdminMaterialRequirements';
import AdminExchanges from '../pages/admin/AdminExchanges';
import AdminSmartMatching from '../pages/admin/AdminSmartMatching';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminRouteLogistics from '../pages/admin/AdminRouteLogistics';
import AdminSustainability from '../pages/admin/AdminSustainability';
import AdminCompliance from '../pages/admin/AdminCompliance';
import AdminKnowledge from '../pages/admin/AdminKnowledge';
import AdminAlerts from '../pages/admin/AdminAlerts';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminProfilePage from '../pages/admin/AdminProfilePage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Multi-Page Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/traceability" element={<Traceability />} />
      <Route path="/traceability/:id" element={<Traceability />} />

      {/* 2. Common Industry User (Seller / Buyer) Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['industry_user', 'admin']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/waste/:id" element={<WasteDetails />} />
        <Route path="/exchange/:id" element={<ExchangeDetail />} />
        <Route path="/route-optimization" element={<RouteOptimization />} />
        <Route path="/gis-map" element={<RouteOptimization />} />
        <Route path="/logistics" element={<RouteOptimization />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/compliance-manager" element={<Documents />} />
        <Route path="/resource-passport/:id" element={<ResourcePassport />} />
        <Route path="/waste-journey/:id" element={<WasteJourneyTracker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 3. Seller-Only Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
        <Route path="/upload-waste" element={<UploadWaste />} />
        <Route path="/recommendations" element={<Recommendations />} />
      </Route>

      {/* 4. Buyer-Only Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['buyer', 'admin']} />}>
        <Route path="/post-requirement" element={<PostRequirement />} />
        <Route path="/my-requirements" element={<MyRequirements />} />
        <Route path="/sourcing-matcher" element={<BuyerSupplierMatcher />} />
      </Route>

      {/* 5. Dedicated Admin Platform Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/listings" element={<AdminWasteListings />} />
        <Route path="/admin/waste-listings" element={<AdminWasteListings />} />
        <Route path="/admin/requirements" element={<AdminMaterialRequirements />} />
        <Route path="/admin/material-requirements" element={<AdminMaterialRequirements />} />
        <Route path="/admin/exchanges" element={<AdminExchanges />} />
        <Route path="/admin/ai" element={<AdminSmartMatching />} />
        <Route path="/admin/smart-matching" element={<AdminSmartMatching />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/routes" element={<AdminRouteLogistics />} />
        <Route path="/admin/logistics" element={<AdminRouteLogistics />} />
        <Route path="/admin/route-logistics" element={<AdminRouteLogistics />} />
        <Route path="/admin/sustainability" element={<AdminSustainability />} />
        <Route path="/admin/compliance" element={<AdminCompliance />} />
        <Route path="/admin/knowledge" element={<AdminKnowledge />} />
        <Route path="/admin/knowledge-base" element={<AdminKnowledge />} />
        <Route path="/admin/rag" element={<AdminKnowledge />} />
        <Route path="/admin/alerts" element={<AdminAlerts />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      {/* 6. Fallback */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
