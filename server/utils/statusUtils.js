/**
 * Standardized Status System for ECOLINK Platform
 * 
 * Standardized Statuses:
 * - PENDING
 * - ACCEPTED
 * - PROCESSING
 * - IN_TRANSIT
 * - DELIVERED
 * - COMPLETED
 * - CANCELLED
 */

const STANDARDIZED_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PROCESSING: 'PROCESSING',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

/**
 * Normalizes any legacy or variant status string into one of the 7 standardized statuses.
 * @param {string} rawStatus 
 * @returns {string} One of STANDARDIZED_STATUSES
 */
function normalizeStatus(rawStatus) {
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

const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PROCESSING: 'Processing',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  PROCESSING: '#6366f1',
  IN_TRANSIT: '#8b5cf6',
  DELIVERED: '#0d9488',
  COMPLETED: '#009E73',
  CANCELLED: '#ef4444'
};

module.exports = {
  STANDARDIZED_STATUSES,
  normalizeStatus,
  STATUS_LABELS,
  STATUS_COLORS
};
