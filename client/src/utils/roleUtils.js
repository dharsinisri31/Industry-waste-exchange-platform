/**
 * Centralized Role Normalization & Authorization Utility for EcoLink
 * 
 * Canonical Roles:
 * - SELLER: Industry waste producer listing byproducts & selling secondary resources
 * - BUYER: Industry consumer procuring secondary materials & posting requirements
 * - ADMIN: Platform operator managing compliance, moderation & system analytics
 */

export const ROLES = {
  SELLER: 'SELLER',
  BUYER: 'BUYER',
  ADMIN: 'ADMIN'
};

/**
 * Extracts normalized roles array from user and profile
 * @param {Object} user 
 * @param {Object} [profile] 
 * @returns {Array<string>} ['buyer'] | ['seller'] | ['buyer', 'seller'] | ['admin']
 */
export function getUserRoles(user, profile = null) {
  if (!user) return ['seller'];

  const rawRole = (user.role || '').toLowerCase().trim();
  if (
    rawRole === 'admin' || 
    rawRole === 'administrator' || 
    rawRole === 'platform_admin' || 
    user.isAdmin === true ||
    user.email?.includes('admin@') || 
    user.email?.includes('admin.ecolink')
  ) {
    return ['admin'];
  }

  // 1. Direct roles array
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles.map(r => r.toLowerCase().trim());
  }

  if (Array.isArray(profile?.roles) && profile.roles.length > 0) {
    return profile.roles.map(r => r.toLowerCase().trim());
  }

  // 2. Profile businessRole fallback
  if (profile?.businessRole) {
    const bRole = profile.businessRole.toLowerCase().trim();
    if (bRole === 'receiver' || bRole === 'buyer') return ['buyer'];
    if (bRole === 'both' || bRole === 'dual') return ['buyer', 'seller'];
    return ['seller'];
  }

  return ['seller'];
}

export function hasBuyerRole(user, profile = null) {
  const roles = getUserRoles(user, profile);
  return roles.includes('buyer') || roles.includes('admin');
}

export function hasSellerRole(user, profile = null) {
  const roles = getUserRoles(user, profile);
  return roles.includes('seller') || roles.includes('admin');
}

export function isDualRoleUser(user, profile = null) {
  const roles = getUserRoles(user, profile);
  return roles.includes('buyer') && roles.includes('seller');
}

/**
 * Normalizes active role into canonical ROLES enum
 */
export function normalizeRole(user, profile = null, activeRole = null) {
  if (!user) return ROLES.SELLER;

  const roles = getUserRoles(user, profile);

  if (roles.includes('admin')) {
    return ROLES.ADMIN;
  }

  // For dual role accounts, use activeRole switcher
  if (roles.includes('buyer') && roles.includes('seller')) {
    if (activeRole) {
      const norm = activeRole.toLowerCase().trim();
      if (norm === 'buyer' || norm === 'receiver') return ROLES.BUYER;
      if (norm === 'seller' || norm === 'sender') return ROLES.SELLER;
    }
    return ROLES.SELLER; // Default active role for dual accounts
  }

  // Single-role accounts: enforce strictly
  if (roles.includes('buyer')) return ROLES.BUYER;
  return ROLES.SELLER;
}

export function isSellerRole(role) {
  return role === ROLES.SELLER;
}

export function isBuyerRole(role) {
  return role === ROLES.BUYER;
}

export function isAdminRole(role) {
  return role === ROLES.ADMIN;
}
