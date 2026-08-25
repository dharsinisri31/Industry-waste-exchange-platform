const validateRegisterIndustry = (req, res, next) => {
  const {
    email,
    password,
    companyName,
    registrationNumber,
    address,
    city,
    contactPhone,
    industryType,
    coordinates
  } = req.body;

  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!companyName || companyName.trim() === '') {
    errors.push('Company name is required');
  }
  if (!registrationNumber || registrationNumber.trim() === '') {
    errors.push('Registration/license number is required');
  }
  if (!address || address.trim() === '') {
    errors.push('Address is required');
  }
  if (!city || city.trim() === '') {
    errors.push('City is required');
  }
  if (!contactPhone || contactPhone.trim() === '') {
    errors.push('Contact phone number is required');
  }
  if (!industryType || industryType.trim() === '') {
    errors.push('Industry type is required');
  }
  if (coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      errors.push('Location coordinates must be an array of [longitude, latitude]');
    } else {
      const [lng, lat] = coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        errors.push('Valid coordinates [longitude (-180 to 180), latitude (-90 to 90)] are required');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  return next();
};

const validateRegisterAdmin = (req, res, next) => {
  const { email, password, fullName, adminSecret } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!fullName || fullName.trim() === '') {
    errors.push('Full name is required');
  }
  if (!adminSecret || adminSecret.trim() === '') {
    errors.push('Admin registration secret is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  return next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  return next();
};

module.exports = {
  validateRegisterIndustry,
  validateRegisterAdmin,
  validateLogin
};
