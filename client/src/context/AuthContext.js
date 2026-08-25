import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, registerIndustryAPI, registerAdminAPI, logoutAPI, getMeAPI } from '../services/authAPI';
import { ROLES, normalizeRole } from '../utils/roleUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || 'seller');

  const sanitizeUser = (rawUser, rawProfile, currentActiveRole) => {
    if (!rawUser) return null;
    const canonical = normalizeRole(rawUser, rawProfile, currentActiveRole);
    return {
      ...rawUser,
      id: rawUser.id || rawUser._id,
      _id: rawUser._id || rawUser.id,
      role: rawUser.role || (canonical === ROLES.ADMIN ? 'admin' : 'industry_user'),
      canonicalRole: canonical,
      name: rawProfile?.companyName || rawProfile?.fullName || rawUser.name || rawUser.email?.split('@')[0] || 'User',
      industryId: rawProfile?._id || rawProfile?.id
    };
  };

  const loadUser = async () => {
    try {
      const data = await getMeAPI();
      const storedActive = localStorage.getItem('activeRole') || (data.profile?.businessRole === 'receiver' ? 'buyer' : 'seller');
      setUser(sanitizeUser(data.user, data.profile, storedActive));
      setProfile(data.profile);
      return data;
    } catch (err) {
      console.log('No active session recovered:', err.message);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginAPI({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      const initialActive = data.profile?.businessRole === 'receiver' ? 'buyer' : 'seller';
      const cleanUser = sanitizeUser(data.user, data.profile, initialActive);
      setUser(cleanUser);
      setProfile(data.profile);
      setActiveRole(initialActive);
      localStorage.setItem('activeRole', initialActive);
      return cleanUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const registerIndustry = async (industryData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerIndustryAPI(industryData);
      localStorage.setItem('accessToken', data.accessToken);
      const cleanUser = sanitizeUser(data.user, data.profile, industryData.businessRole === 'receiver' ? 'buyer' : 'seller');
      setUser(cleanUser);
      setProfile(data.profile);
      return cleanUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async (adminData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerAdminAPI(adminData);
      localStorage.setItem('accessToken', data.accessToken);
      const cleanUser = sanitizeUser(data.user, data.profile, null);
      setUser(cleanUser);
      setProfile(data.profile);
      return cleanUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Admin registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (err) {
      console.error('Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('activeRole');
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (profile?.businessRole) {
      if (profile.businessRole === 'receiver' || profile.businessRole === 'buyer') {
        setActiveRole('buyer');
      } else if (profile.businessRole === 'sender' || profile.businessRole === 'seller') {
        setActiveRole('seller');
      }
    }
  }, [profile]);

  const switchRole = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem('activeRole', newRole);
    if (user) {
      setUser(sanitizeUser(user, profile, newRole));
    }
  };

  const canonicalRole = normalizeRole(user, profile, activeRole);
  const isBuyerMode = canonicalRole === ROLES.BUYER;
  const isSellerMode = canonicalRole === ROLES.SELLER;
  const isDualRole = profile?.businessRole === 'both';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        activeRole,
        canonicalRole,
        switchRole,
        isBuyerMode,
        isSellerMode,
        isDualRole,
        login,
        registerIndustry,
        registerAdmin,
        logout,
        loadUser,
        isAuthenticated: !!user,
        isAdmin: canonicalRole === ROLES.ADMIN,
        isIndustry: canonicalRole === ROLES.SELLER || canonicalRole === ROLES.BUYER
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

