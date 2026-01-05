// Security Service for API calls and secure operations
import { generateSecureToken, CSRFProtection } from '../utils/enhancedSecurity';
import { sanitizeObject } from '../utils/inputValidation';

// Security configuration
const SECURITY_CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_URL || '/api',
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  CSRF_TOKEN_KEY: 'csrf_token',
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  TIMEOUT_DURATION: 30000 // 30 seconds
};

// Token management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
    
    // Store securely (in production, use httpOnly cookies)
    sessionStorage.setItem(SECURITY_CONFIG.TOKEN_KEY, accessToken);
    sessionStorage.setItem(SECURITY_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem('token_expiry', this.tokenExpiry.toString());
  }

  getAccessToken(): string | null {
    // Check if token is expired
    if (Date.now() > this.tokenExpiry) {
      return null;
    }
    
    if (!this.accessToken) {
      this.accessToken = sessionStorage.getItem(SECURITY_CONFIG.TOKEN_KEY);
      const expiry = sessionStorage.getItem('token_expiry');
      if (expiry) {
        this.tokenExpiry = parseInt(expiry);
      }
    }
    
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = sessionStorage.getItem(SECURITY_CONFIG.REFRESH_TOKEN_KEY);
    }
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    
    sessionStorage.removeItem(SECURITY_CONFIG.TOKEN_KEY);
    sessionStorage.removeItem(SECURITY_CONFIG.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem('token_expiry');
  }

  shouldRefreshToken(): boolean {
    return Date.now() > (this.tokenExpiry - SECURITY_CONFIG.TOKEN_REFRESH_THRESHOLD);
  }
}

// Secure HTTP client
class SecureHttpClient {
  private tokenManager = new TokenManager();
  private refreshPromise: Promise<boolean> | null = null;

  private async refreshToken(): Promise<boolean> {
    // Prevent multiple refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = this.tokenManager.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${SECURITY_CONFIG.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.tokenManager.setTokens(
          data.accessToken,
          data.refreshToken,
          data.expiresIn
        );
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private async makeRequest(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<Response> {
    // Add security headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };

    // Add auth token if available
    const token = this.tokenManager.getAccessToken();
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || '')) {
      const csrfToken = CSRFProtection.getToken();
      if (csrfToken) {
        (headers as any)['X-CSRF-Token'] = csrfToken;
      }
    }

    // Sanitize request body
    let body = options.body;
    if (body && typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        body = JSON.stringify(sanitizeObject(parsed));
      } catch {
        // Not JSON, skip sanitization
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      body
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.TIMEOUT_DURATION);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === 401 && retryCount < SECURITY_CONFIG.MAX_RETRY_ATTEMPTS) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          return this.makeRequest(url, options, retryCount + 1);
        }
        
        // Refresh failed, clear tokens and redirect to login
        this.tokenManager.clearTokens();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async get(url: string, options: RequestInit = {}) {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  async post(url: string, data: any, options: RequestInit = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(url: string, data: any, options: RequestInit = {}) {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(url: string, options: RequestInit = {}) {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  // File upload with security checks
  async uploadFile(url: string, file: File, options: RequestInit = {}) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };

    const token = this.tokenManager.getAccessToken();
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers
    });
  }
}

// Authentication service
export class AuthService {
  private httpClient = new SecureHttpClient();

  async login(credentials: { email: string; password: string }) {
    const response = await this.httpClient.post('/auth/login', credentials);
    
    if (response.ok) {
      const data = await response.json();
      this.httpClient['tokenManager'].setTokens(
        data.accessToken,
        data.refreshToken,
        data.expiresIn
      );
      
      // Generate CSRF token
      CSRFProtection.generateToken();
      
      return data;
    }
    
    throw new Error('Login failed');
  }

  async logout() {
    try {
      await this.httpClient.post('/auth/logout', {});
    } finally {
      this.httpClient['tokenManager'].clearTokens();
      CSRFProtection.getToken = null;
    }
  }

  async register(userData: any) {
    const response = await this.httpClient.post('/auth/register', userData);
    
    if (response.ok) {
      return response.json();
    }
    
    throw new Error('Registration failed');
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await this.httpClient.post('/auth/change-password', {
      oldPassword,
      newPassword
    });
    
    if (!response.ok) {
      throw new Error('Password change failed');
    }
  }

  async enable2FA() {
    const response = await this.httpClient.post('/auth/2fa/enable', {});
    
    if (response.ok) {
      return response.json();
    }
    
    throw new Error('2FA enable failed');
  }

  async verify2FA(code: string) {
    const response = await this.httpClient.post('/auth/2fa/verify', { code });
    
    if (response.ok) {
      return response.json();
    }
    
    throw new Error('2FA verification failed');
  }
}

// Security audit service
export class SecurityAuditService {
  private httpClient = new SecureHttpClient();

  async logSecurityEvent(event: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    timestamp: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.httpClient.post('/security/audit', event);
  }

  async reportThreat(threat: {
    type: string;
    description: string;
    evidence?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    return this.httpClient.post('/security/report-threat', threat);
  }

  async getSecurityLogs(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    severity?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    const response = await this.httpClient.get(`/security/logs?${params}`);
    
    if (response.ok) {
      return response.json();
    }
    
    throw new Error('Failed to fetch security logs');
  }
}

// Data encryption service
export class EncryptionService {
  private algorithm = 'AES-GCM';
  private keyLength = 256;

  async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv
      },
      key,
      encoded
    );
    
    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer)
    };
  }

  async decrypt(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
    const encrypted = this.base64ToArrayBuffer(encryptedData);
    const ivBuffer = this.base64ToArrayBuffer(iv);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: ivBuffer
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer; // Return the underlying ArrayBuffer
  }
}

// Export singleton instances
export const authService = new AuthService();
export const auditService = new SecurityAuditService();
export const encryptionService = new EncryptionService();
export const httpClient = new SecureHttpClient();

// Security utilities
export const securityUtils = {
  // Generate secure random ID
  generateId: () => generateSecureToken(),
  
  // Check if connection is secure
  isSecureConnection: () => window.location.protocol === 'https:',
  
  // Get device fingerprint
  getDeviceFingerprint: async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      const fingerprint = canvas.toDataURL();
      return fingerprint.slice(-50); // Return last 50 chars
    }
    return 'unknown';
  },
  
  // Check for common security vulnerabilities
  checkSecurityHeaders: async () => {
    const response = await fetch(window.location.href);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy'
    ];
    
    const missing = requiredHeaders.filter(header => !headers.get(header));
    
    return {
      isSecure: missing.length === 0,
      missingHeaders: missing
    };
  }
};
