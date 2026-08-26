import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, registerIndustryAPI, registerAdminAPI, logoutAPI, getMeAPI } from '../services/authAPI';
import { ROLES, normalizeRole, getUserRoles, isDualRoleUser, hasBuyerRole, hasSellerRole } from '../utils/roleUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || 'seller');

  const sanitizeUser = (rawUser, rawProfile, currentActiveRole) => {
    if (!rawUser) return null;
    const roles = getUserRoles(rawUser, rawProfile);
    const canonical = normalizeRole(rawUser, rawProfile, currentActiveRole);
    return {
      ...rawUser,
      id: rawUser.id || rawUser._id,
      _id: rawUser._id || rawUser.id,
      role: rawUser.role || (canonical === ROLES.ADMIN ? 'admin' : 'industry_user'),
      roles,
      canonicalRole: canonical,
      name: rawProfile?.companyName || rawProfile?.fullName || rawUser.name || rawUser.email?.split('@')[0] || 'User',
      industryId: rawProfile?._id || rawProfile?.id
    };
  };

  const loadUser = async () => {
    try {
      const data = await getMeAPI();
      const roles = getUserRoles(data.user, data.profile);
      
      let initialActive = 'seller';
      if (roles.includes('buyer') && !roles.includes('seller')) {
        initialActive = 'buyer';
      } else if (roles.includes('seller') && !roles.includes('buyer')) {
        initialActive = 'seller';
      } else if (roles.includes('buyer') && roles.includes('seller')) {
        initialActive = localStorage.getItem('activeRole') || 'seller';
      }

      setUser(sanitizeUser(data.user, data.profile, initialActive));
      setProfile(data.profile);
      setActiveRole(initialActive);
      localStorage.setItem('activeRole', initialActive);
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
      
      const roles = getUserRoles(data.user, data.profile);
      let initialActive = 'seller';
      if (roles.includes('buyer') && !roles.includes('seller')) {
        initialActive = 'buyer';
      } else if (roles.includes('seller') && !roles.includes('buyer')) {
        initialActive = 'seller';
      } else if (roles.includes('buyer') && roles.includes('seller')) {
        initialActive = localStorage.getItem('activeRole') || 'seller';
      }

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
      
      const roles = getUserRoles(data.user, data.profile);
      let initialActive = roles.includes('buyer') && !roles.includes('seller') ? 'buyer' : 'seller';

      const cleanUser = sanitizeUser(data.user, data.profile, initialActive);
      setUser(cleanUser);
      setProfile(data.profile);
      setActiveRole(initialActive);
      localStorage.setItem('activeRole', initialActive);
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

  const switchRole = (newRole) => {
    const isDual = isDualRoleUser(user, profile);
    if (!isDual) return; // Do not switch if user is single-role

    setActiveRole(newRole);
    localStorage.setItem('activeRole', newRole);
    if (user) {
      setUser(sanitizeUser(user, profile, newRole));
    }
  };

  const roles = getUserRoles(user, profile);
  const canonicalRole = normalizeRole(user, profile, activeRole);
  const isBuyerOnly = roles.includes('buyer') && !roles.includes('seller') && !roles.includes('admin');
  const isSellerOnly = roles.includes('seller') && !roles.includes('buyer') && !roles.includes('admin');
  const isDualRole = isDualRoleUser(user, profile);
  const isBuyerMode = canonicalRole === ROLES.BUYER;
  const isSellerMode = canonicalRole === ROLES.SELLER;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        error,
        activeRole,
        canonicalRole,
        switchRole,
        isBuyerMode,
        isSellerMode,
        isBuyerOnly,
        isSellerOnly,
        isDualRole,
        hasBuyerRole: hasBuyerRole(user, profile),
        hasSellerRole: hasSellerRole(user, profile),
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
