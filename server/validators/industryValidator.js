const validateIndustryInput = (data) => {
  const errors = [];
  if (!data.companyName) errors.push('Company name is required');
  if (!data.registrationNumber) errors.push('Registration number is required');
  if (!data.contactPhone) errors.push('Contact phone is required');
  return { isValid: errors.length === 0, errors };
};

module.exports = { validateIndustryInput };
