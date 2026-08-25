const validateUserInput = (data) => {
  const errors = [];
  if (!data.email || !data.email.includes('@')) errors.push('Valid email is required');
  if (!data.password || data.password.length < 6) errors.push('Password must be at least 6 characters');
  return { isValid: errors.length === 0, errors };
};

module.exports = { validateUserInput };
