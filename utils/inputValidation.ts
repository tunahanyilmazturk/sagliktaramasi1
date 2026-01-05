// Input Validation and Sanitization Utilities

// XSS Protection: Sanitize user input
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .trim();
}

// HTML Sanitization (basic version - use DOMPurify in production)
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// SQL Injection Protection (basic)
export function sanitizeSql(input: string): string {
  return input.replace(/['"\\;]/g, '');
}

// File upload validation
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Bu dosya türüne izin verilmiyor' };
  }
  
  return { isValid: true };
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Email validation with more strict rules
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone number validation (international format)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Turkish ID number validation
export function isValidTurkishId(tckn: string): boolean {
  if (!/^[0-9]{11}$/.test(tckn)) return false;
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(tckn[i]);
  }
  
  const tenthDigit = (sum % 10);
  const eleventhDigit = parseInt(tckn[10]);
  
  if (tenthDigit !== eleventhDigit) return false;
  
  // Additional validation rules
  let oddSum = 0, evenSum = 0;
  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
      oddSum += parseInt(tckn[i]);
    } else {
      evenSum += parseInt(tckn[i]);
    }
  }
  
  const ninthDigit = ((oddSum * 7 - evenSum) % 10);
  return ninthDigit === parseInt(tckn[8]);
}

// Credit card validation (basic Luhn algorithm)
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Input length validation
export function validateLength(input: string, minLength: number, maxLength: number): { isValid: boolean; error?: string } {
  if (input.length < minLength) {
    return { isValid: false, error: `En az ${minLength} karakter girilmelidir` };
  }
  
  if (input.length > maxLength) {
    return { isValid: false, error: `En fazla ${maxLength} karakter girilebilir` };
  }
  
  return { isValid: true };
}

// Required fields validation
export function validateRequired(obj: Record<string, any>, requiredFields: string[]): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = obj[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// Numeric validation
export function isNumeric(input: string): boolean {
  return !isNaN(parseFloat(input)) && isFinite(parseFloat(input));
}

// Integer validation
export function isInteger(input: string): boolean {
  return /^-?\d+$/.test(input);
}

// Positive number validation
export function isPositive(input: string): boolean {
  const num = parseFloat(input);
  return !isNaN(num) && num > 0;
}

// Date validation
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Future date validation
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

// Past date validation
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

// Age validation
export function isValidAge(birthDate: string, minAge: number = 18, maxAge: number = 120): boolean {
  const birth = new Date(birthDate);
  const now = new Date();
  const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  return age >= minAge && age <= maxAge;
}

// Custom validation rule
export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

// Validate field with custom rules
export function validateField(value: any, rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.validator(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Batch validation for forms
export function validateForm(data: Record<string, any>, validationRules: Record<string, ValidationRule[]>): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let isValid = true;
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const result = validateField(data[field], rules);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
  }
  
  return { isValid, errors };
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Export validation patterns for reuse
export const patterns = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  turkishId: /^[0-9]{11}$/,
  creditCard: /^\d{13,19}$/,
  url: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  letters: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/
};
