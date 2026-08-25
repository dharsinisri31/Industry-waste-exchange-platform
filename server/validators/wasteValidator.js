const validateWasteInput = (data) => {
  const errors = [];
  if (!data.name) errors.push('Waste material name is required');
  if (!data.quantity || isNaN(parseFloat(data.quantity))) errors.push('Valid quantity is required');
  if (!data.price || isNaN(parseFloat(data.price))) errors.push('Valid price is required');
  return { isValid: errors.length === 0, errors };
};

module.exports = { validateWasteInput };
