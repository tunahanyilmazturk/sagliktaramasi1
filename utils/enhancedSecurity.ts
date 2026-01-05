// Enhanced Security Utilities

// Salt generation for password hashing
export function generateSalt(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Enhanced password hashing with salt using PBKDF2
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const generatedSalt = salt || generateSalt();
  const saltedPassword = password + generatedSalt;
  
  // Using Web Crypto API with PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(saltedPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(generatedSalt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex, salt: generatedSalt };
}

// Verify password with salt
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// Generate secure random token
export function generateSecureToken(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// XSS Protection: Sanitize HTML input
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Input validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  name: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{2,50}$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128
  }
};

// Validate input against patterns
export function validateInput(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

// Enhanced password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < validationPatterns.password.minLength) {
    feedback.push(`Şifre en az ${validationPatterns.password.minLength} karakter olmalı`);
  } else {
    score += 1;
  }

  if (password.length > validationPatterns.password.maxLength) {
    feedback.push(`Şifre en fazla ${validationPatterns.password.maxLength} karakter olabilir`);
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else if (validationPatterns.password.requireLowercase) {
    feedback.push('Küçük harf içermeli');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else if (validationPatterns.password.requireUppercase) {
    feedback.push('Büyük harf içermeli');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else if (validationPatterns.password.requireNumbers) {
    feedback.push('Rakam içermeli');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else if (validationPatterns.password.requireSpecialChars) {
    feedback.push('Özel karakter içermeli (!@#$%^&*)');
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Ardışık tekrar eden karakterler içeremez');
  }

  if (password.toLowerCase().includes('password') || 
      password.toLowerCase().includes('123456') ||
      password.toLowerCase().includes('qwerty')) {
    score -= 1;
    feedback.push('Yaygın şifre desenleri kullanılamaz');
  }

  return { 
    score: Math.max(0, Math.min(5, score)), 
    feedback,
    isStrong: score >= 4 && feedback.length === 0
  };
}

// Rate limiting implementation
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return false;

    const now = Date.now();
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }

    return attempt.count >= this.maxAttempts;
  }

  recordAttempt(identifier: string): { blocked: boolean; remainingAttempts: number } {
    const now = Date.now();
    const attempt = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };

    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      attempt.count = 0;
    }

    attempt.count += 1;
    attempt.lastAttempt = now;
    this.attempts.set(identifier, attempt);

    const blocked = attempt.count >= this.maxAttempts;
    const remainingAttempts = Math.max(0, this.maxAttempts - attempt.count);

    return { blocked, remainingAttempts };
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// CSRF Token generation and validation
export class CSRFProtection {
  private static token: string | null = null;

  static generateToken(): string {
    this.token = generateSecureToken(32);
    return this.token;
  }

  static getToken(): string | null {
    return this.token;
  }

  static validateToken(token: string): boolean {
    return token === this.token;
  }
}

// Secure session management
export class SecureSession {
  private static sessionKey = 'secure_session';
  
  static createSession(userData: any, expiresIn: number = 8 * 60 * 60 * 1000): void {
    const sessionData = {
      userData,
      token: generateSecureToken(),
      expiresAt: Date.now() + expiresIn,
      createdAt: Date.now()
    };
    
    // In production, use httpOnly cookies
    sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
  }

  static getSession(): any | null {
    try {
      const sessionData = JSON.parse(sessionStorage.getItem(this.sessionKey) || 'null');
      if (!sessionData) return null;

      if (Date.now() > sessionData.expiresAt) {
        this.destroySession();
        return null;
      }

      return sessionData;
    } catch {
      return null;
    }
  }

  static destroySession(): void {
    sessionStorage.removeItem(this.sessionKey);
  }

  static isSessionValid(): boolean {
    return this.getSession() !== null;
  }
}

// Content Security Policy helper
export const CSP_HEADERS = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: https:",
  'font-src': "'self' data:",
  'connect-src': "'self'",
  'frame-ancestors': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'"
};

// Export security headers for middleware implementation
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': Object.entries(CSP_HEADERS)
      .map(([key, value]) => `${key} ${value}`)
      .join('; ')
  };
}
