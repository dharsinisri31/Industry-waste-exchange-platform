/**
 * Centralized Role Normalization Utility for EcoLink
 * 
 * Canonical Application Roles:
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
 * Normalizes any backend or session role representations into canonical ROLES
 * @param {Object|string} user - User object or role string
 * @param {Object} [profile] - Industry or Admin profile object
 * @param {string} [activeRole] - Active switcher state ('seller' | 'buyer')
 * @returns {'SELLER'|'BUYER'|'ADMIN'}
 */
export function normalizeRole(user, profile = null, activeRole = null) {
  if (!user) return ROLES.SELLER;

  const rawRole = (
    typeof user === 'string' 
      ? user 
      : (user.role || user.canonicalRole || user.user?.role || '')
  ).toLowerCase().trim();

  // 1. Admin Role ALWAYS takes absolute precedence (Admin is NEVER an industry user)
  if (
    rawRole === 'admin' || 
    rawRole === 'administrator' || 
    rawRole === 'platform_admin' || 
    user.isAdmin === true ||
    (typeof user === 'object' && (user.email?.includes('admin@') || user.email?.includes('admin.ecolink')))
  ) {
    return ROLES.ADMIN;
  }

  // 2. Explicit Active Role Switcher for dual-role / industry participants
  if (activeRole) {
    const normActive = activeRole.toLowerCase().trim();
    if (normActive === 'buyer' || normActive === 'receiver') return ROLES.BUYER;
    if (normActive === 'seller' || normActive === 'sender') return ROLES.SELLER;
  }

  // 3. Profile-based businessRole detection
  if (profile?.businessRole) {
    const bRole = profile.businessRole.toLowerCase().trim();
    if (bRole === 'receiver' || bRole === 'buyer') return ROLES.BUYER;
    if (bRole === 'sender' || bRole === 'seller') return ROLES.SELLER;
  }

  // 4. Fallback user string matching
  if (rawRole.includes('buyer') || rawRole.includes('receiver') || rawRole.includes('procurement')) {
    return ROLES.BUYER;
  }

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

