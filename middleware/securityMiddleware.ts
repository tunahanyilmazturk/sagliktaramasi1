// Security Middleware for API Routes
import { getSecurityHeaders } from '../utils/enhancedSecurity';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Simple Request interface for Node.js environment
interface SecurityRequest {
  ip?: string;
  headers: Map<string, string> | Record<string, string>;
  method?: string;
  url?: string;
}

// Simple Response interface
interface SecurityResponse {
  status: number;
  headers: Map<string, string> | Record<string, string>;
  json?: any;
}

// Rate limiting middleware
export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return function (req: SecurityRequest): SecurityResponse | null {
    const ip = req.ip || 'unknown';
    const key = `rate-limit:${ip}`;
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // New window or expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return null; // Allow request
    }
    
    if (record.count >= options.max) {
      // Rate limit exceeded
      return {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
        },
        json: { error: options.message || 'Too many requests' }
      };
    }
    
    // Increment counter
    record.count++;
    return null; // Allow request
  };
}

// CORS middleware
export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
} = {}) {
  const defaultOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true
  };
  
  const corsOptions = { ...defaultOptions, ...options };
  
  return function (req: SecurityRequest): SecurityResponse | null {
    const origin = typeof req.headers.get === 'function' 
      ? req.headers.get('origin') 
      : req.headers['origin'];
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response: SecurityResponse = { status: 200, headers: {} };
      
      if (origin && (corsOptions.origin === '*' || corsOptions.origin.includes(origin))) {
        if (response.headers instanceof Map) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        } else {
          response.headers['Access-Control-Allow-Origin'] = origin;
        }
      }
      
      if (response.headers instanceof Map) {
        response.headers.set('Access-Control-Allow-Methods', corsOptions.methods!.join(', '));
        response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders!.join(', '));
        response.headers.set('Access-Control-Allow-Credentials', corsOptions.credentials!.toString());
      } else {
        response.headers['Access-Control-Allow-Methods'] = corsOptions.methods!.join(', ');
        response.headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders!.join(', ');
        response.headers['Access-Control-Allow-Credentials'] = corsOptions.credentials!.toString();
      }
      
      return response;
    }
    
    return null; // Continue to next middleware
  };
}

// Security headers middleware
export function securityHeaders() {
  return function (req: SecurityRequest): SecurityResponse | null {
    const response: SecurityResponse = { status: 200, headers: {} };
    
    const headers = getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      if (response.headers instanceof Map) {
        response.headers.set(key, value);
      } else {
        response.headers[key] = value;
      }
    });
    
    return response;
  };
}

// Request validation middleware
export function validateRequest(options: {
  maxBodySize?: number;
  allowedContentTypes?: string[];
  requireAuth?: boolean;
  requireCSRF?: boolean;
}) {
  return function (req: SecurityRequest): SecurityResponse | null {
    // Check content type
    if (options.allowedContentTypes) {
      const contentType = typeof req.headers.get === 'function' 
        ? req.headers.get('content-type')
        : req.headers['content-type'];
      if (contentType && !options.allowedContentTypes.some(type => contentType.includes(type))) {
        return {
          status: 415,
          headers: {},
          json: { error: 'Unsupported Media Type' }
        };
      }
    }
    
    // Check body size
    if (options.maxBodySize) {
      const contentLength = typeof req.headers.get === 'function' 
        ? req.headers.get('content-length')
        : req.headers['content-length'];
      if (contentLength && parseInt(contentLength) > options.maxBodySize) {
        return {
          status: 413,
          headers: {},
          json: { error: 'Payload Too Large' }
        };
      }
    }
    
    // Check authentication
    if (options.requireAuth) {
      const token = typeof req.headers.get === 'function' 
        ? req.headers.get('authorization')
        : req.headers['authorization'];
      if (!token || !token.startsWith('Bearer ')) {
        return {
          status: 401,
          headers: {},
          json: { error: 'Unauthorized' }
        };
      }
      // Add token validation logic here
    }
    
    // Check CSRF token
    if (options.requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
      const csrfToken = typeof req.headers.get === 'function' 
        ? req.headers.get('x-csrf-token')
        : req.headers['x-csrf-token'];
      
      if (!csrfToken) {
        return {
          status: 403,
          headers: {},
          json: { error: 'Invalid CSRF Token' }
        };
      }
    }
    
    return null; // Continue to next middleware
  };
}

// Input sanitization middleware
export function sanitizeInput() {
  return function (req: SecurityRequest): SecurityResponse | null {
    // Sanitize URL parameters
    if (req.url) {
      const url = new URL(req.url);
      url.searchParams.forEach((value, key) => {
        url.searchParams.set(key, sanitizeParam(value));
      });
    }
    
    return null; // Continue to next middleware
  };
}

// Helper function to sanitize URL parameters
function sanitizeParam(value: string): string {
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// IP whitelist middleware
export function ipWhitelist(allowedIPs: string[]) {
  return function (req: SecurityRequest): SecurityResponse | null {
    const ip = req.ip || 'unknown';
    
    if (!allowedIPs.includes(ip)) {
      return {
        status: 403,
        headers: {},
        json: { error: 'Access Denied' }
      };
    }
    
    return null;
  };
}

// Compose multiple middleware functions
export function composeMiddleware(...middlewares: Function[]) {
  return function (req: SecurityRequest): SecurityResponse | null {
    for (const middleware of middlewares) {
      const result = middleware(req);
      if (result) {
        return result; // Return early if middleware returns a response
      }
    }
    return null; // Continue to route handler
  };
}

// Example usage:
/*
export const middleware = composeMiddleware(
  securityHeaders(),
  cors(),
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
  validateRequest({
    maxBodySize: 10 * 1024 * 1024, // 10MB
    allowedContentTypes: ['application/json'],
    requireAuth: true,
    requireCSRF: true
  }),
  sanitizeInput()
);
*/
