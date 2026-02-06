const validator = require('validator');

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for now
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters (if required)
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function validateEmail(email) {
  return validator.isEmail(email);
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and script content
  return validator.escape(input);
}

/**
 * Validate and sanitize trip data
 * @param {Object} tripData - Trip data to validate
 * @returns {Object} { valid: boolean, errors: string[], sanitized: Object }
 */
function validateTripData(tripData) {
  const errors = [];
  const sanitized = {};

  // Validate date
  if (!tripData.date || !validator.isDate(tripData.date)) {
    errors.push('Valid date is required');
  } else {
    sanitized.date = tripData.date;
  }

  // Validate and sanitize addresses
  if (!tripData.from_address || tripData.from_address.trim() === '') {
    errors.push('From address is required');
  } else {
    sanitized.from_address = validator.trim(tripData.from_address);
  }

  if (!tripData.to_address || tripData.to_address.trim() === '') {
    errors.push('To address is required');
  } else {
    sanitized.to_address = validator.trim(tripData.to_address);
  }

  // Validate and sanitize site name
  if (tripData.site_name) {
    sanitized.site_name = sanitizeInput(validator.trim(tripData.site_name));
  }

  // Validate and sanitize purpose
  if (tripData.purpose) {
    sanitized.purpose = sanitizeInput(validator.trim(tripData.purpose));
  }

  // Validate expenses (if provided)
  if (tripData.expenses !== undefined && tripData.expenses !== null) {
    const expenses = parseFloat(tripData.expenses);
    if (isNaN(expenses) || expenses < 0) {
      errors.push('Expenses must be a valid non-negative number');
    } else {
      sanitized.expenses = expenses;
    }
  }

  // Validate expense notes
  if (tripData.expense_notes) {
    sanitized.expense_notes = sanitizeInput(validator.trim(tripData.expense_notes));
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate and sanitize user data
 * @param {Object} userData - User data to validate
 * @returns {Object} { valid: boolean, errors: string[], sanitized: Object }
 */
function validateUserData(userData) {
  const errors = [];
  const sanitized = {};

  // Validate email
  if (!userData.email || !validateEmail(userData.email)) {
    errors.push('Valid email address is required');
  } else {
    sanitized.email = validator.normalizeEmail(userData.email);
  }

  // Validate role
  const validRoles = ['inspector', 'supervisor', 'fleet_manager', 'admin'];
  if (!userData.role || !validRoles.includes(userData.role)) {
    errors.push('Valid role is required');
  } else {
    sanitized.role = userData.role;
  }

  // Validate first name (if provided)
  if (userData.first_name) {
    sanitized.first_name = sanitizeInput(validator.trim(userData.first_name));
  }

  // Validate last name (if provided)
  if (userData.last_name) {
    sanitized.last_name = sanitizeInput(validator.trim(userData.last_name));
  }

  // Validate phone (if provided)
  if (userData.phone) {
    if (!validator.isMobilePhone(userData.phone, 'any', { strictMode: false })) {
      errors.push('Valid phone number is required');
    } else {
      sanitized.phone = userData.phone;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Password strength meter (0-5 scale)
 * @param {string} password - Password to check
 * @returns {number} Strength score (0-5)
 */
function getPasswordStrength(password) {
  let strength = 0;

  if (!password) return 0;

  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  return strength;
}

module.exports = {
  PASSWORD_REQUIREMENTS,
  validatePassword,
  validateEmail,
  sanitizeInput,
  validateTripData,
  validateUserData,
  getPasswordStrength
};
