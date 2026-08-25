/**
 * Centralized Indian Rupee (INR) Currency Formatter
 * Formats numbers into standard Indian numbering system (e.g. ₹45, ₹1,250, ₹12,500, ₹1,25,000, ₹10,00,000)
 */
export const formatINR = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹0';
  }
  const num = Math.round(Number(value));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export default formatINR;
