/**
 * Standardized Status System for ECOLINK Frontend
 */

export const STANDARDIZED_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PROCESSING: 'PROCESSING',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const STATUS_LIST = [
  'PENDING',
  'ACCEPTED',
  'PROCESSING',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
];

export const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PROCESSING: 'Processing',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  PROCESSING: '#6366f1',
  IN_TRANSIT: '#8b5cf6',
  DELIVERED: '#0d9488',
  COMPLETED: '#009E73',
  CANCELLED: '#ef4444'
};

/**
 * Normalizes any legacy or variant status string into one of the 7 standardized statuses.
 * @param {string} rawStatus 
 * @returns {string} One of STANDARDIZED_STATUSES
 */
export function normalizeStatus(rawStatus) {
  if (!rawStatus) return STANDARDIZED_STATUSES.PENDING;
  const s = String(rawStatus).trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (['PENDING', 'REQUESTED', 'ORDER_PLACED'].includes(s)) {
    return STANDARDIZED_STATUSES.PENDING;
  }
  if (['ACCEPTED', 'CONFIRMED', 'APPROVED', 'PAYMENT_CONFIRMED', 'SELLER_ACCEPTED'].includes(s)) {
    return STANDARDIZED_STATUSES.ACCEPTED;
  }
  if (['PROCESSING', 'PREPARING', 'WASTE_PREPARED'].includes(s)) {
    return STANDARDIZED_STATUSES.PROCESSING;
  }
  if (['IN_TRANSIT', 'TRANSIT', 'ROUTE_PLANNED', 'PICKUP_SCHEDULED', 'DISPATCHED', 'SHIPPED'].includes(s)) {
    return STANDARDIZED_STATUSES.IN_TRANSIT;
  }
  if (['DELIVERED', 'ARRIVED'].includes(s)) {
    return STANDARDIZED_STATUSES.DELIVERED;
  }
  if (['COMPLETED', 'PROCESSED', 'SETTLED', 'CLOSED'].includes(s)) {
    return STANDARDIZED_STATUSES.COMPLETED;
  }
  if (['CANCELLED', 'CANCELED', 'REJECTED', 'DISPUTED', 'DISPUTE'].includes(s)) {
    return STANDARDIZED_STATUSES.CANCELLED;
  }

  return STANDARDIZED_STATUSES.PENDING;
}

export function getStatusBadgeStyle(rawStatus) {
  const norm = normalizeStatus(rawStatus);
  switch (norm) {
    case 'COMPLETED':
      return 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30';
    case 'IN_TRANSIT':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'DELIVERED':
      return 'bg-teal-100 text-teal-800 border border-teal-200';
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'PROCESSING':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-900 border border-amber-200';
  }
}
