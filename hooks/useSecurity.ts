import { useEffect, useState, useCallback } from 'react';
import { SecureSession } from '../utils/enhancedSecurity';

// Security hook for session management and security checks
export function useSecurity() {
  const [sessionValid, setSessionValid] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  // Check session validity
  useEffect(() => {
    const checkSession = () => {
      const isValid = SecureSession.isSessionValid();
      setSessionValid(isValid);
      
      if (!isValid) {
        setSecurityWarnings(prev => [...prev, 'Oturum süresi doldu. Lütfen tekrar giriş yapın.']);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Track user activity
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now());
    
    // Update session activity
    const session = SecureSession.getSession();
    if (session) {
      session.lastActivity = Date.now();
      sessionStorage.setItem('secure_session', JSON.stringify(session));
    }
  }, []);

  // Auto-logout after inactivity
  useEffect(() => {
    const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        SecureSession.destroySession();
        window.location.href = '/login';
      }, inactivityTimeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout(); // Initial timeout

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, []);

  // Clear security warnings
  const clearWarnings = useCallback(() => {
    setSecurityWarnings([]);
  }, []);

  return {
    sessionValid,
    lastActivity,
    securityWarnings,
    trackActivity,
    clearWarnings
  };
}

// XSS Protection hook
export function useXSSProtection() {
  const [xssDetected, setXssDetected] = useState(false);

  useEffect(() => {
    // Check for potential XSS in URL
    const checkURL = () => {
      const url = window.location.href;
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /vbscript:/i,
        /data:text\/html/i
      ];

      const hasXSS = xssPatterns.some(pattern => pattern.test(url));
      
      if (hasXSS) {
        setXssDetected(true);
        console.error('Potential XSS attack detected in URL');
        // Redirect to safe page
        window.location.href = '/security-error';
      }
    };

    checkURL();
    
    // Monitor for dynamic script injections
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check for suspicious attributes
            const suspiciousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover'];
            suspiciousAttrs.forEach(attr => {
              if (element.hasAttribute(attr)) {
                const value = element.getAttribute(attr);
                if (value && /javascript:|<script/i.test(value)) {
                  setXssDetected(true);
                  element.removeAttribute(attr);
                }
              }
            });

            // Check for script tags
            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              const content = element.textContent;
              
              if ((src && !src.includes(window.location.hostname)) ||
                  (content && /javascript:|<script/i.test(content))) {
                setXssDetected(true);
                element.remove();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return { xssDetected };
}

// Content Security Policy hook
export function useCSP() {
  const [cspViolations, setCspViolations] = useState<string[]>([]);

  useEffect(() => {
    // Listen for CSP violations
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation = `CSP Violation: ${event.blockedURI} blocked by ${event.violatedDirective}`;
      setCspViolations(prev => [...prev, violation]);
      
      // Log to monitoring service in production
      console.error('CSP Violation:', event);
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  return { cspViolations };
}

// Secure storage hook (encrypted localStorage)
export function useSecureStorage() {
  const encrypt = (data: string): string => {
    // Simple encryption - in production use proper encryption
    return btoa(data);
  };

  const decrypt = (encryptedData: string): string => {
    try {
      return atob(encryptedData);
    } catch {
      return '';
    }
  };

  const setItem = useCallback((key: string, value: any) => {
    try {
      const encrypted = encrypt(JSON.stringify(value));
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
    }
  }, []);

  const getItem = useCallback((key: string) => {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    localStorage.removeItem(`secure_${key}`);
  }, []);

  return { setItem, getItem, removeItem };
}

// Rate limiting hook for client-side
export function useRateLimit(maxAttempts: number, windowMs: number) {
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [resetTime, setResetTime] = useState(0);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing attempts from sessionStorage
    const existingAttempts = JSON.parse(sessionStorage.getItem('rateLimit') || '[]');
    
    // Filter old attempts
    const validAttempts = existingAttempts.filter((time: number) => time > windowStart);
    
    if (validAttempts.length >= maxAttempts) {
      setIsBlocked(true);
      setResetTime(validAttempts[0] + windowMs);
      return false;
    }
    
    // Add new attempt
    validAttempts.push(now);
    sessionStorage.setItem('rateLimit', JSON.stringify(validAttempts));
    
    setAttempts(validAttempts.length);
    setIsBlocked(false);
    
    // Clear block after window expires
    setTimeout(() => {
      setIsBlocked(false);
      setAttempts(0);
    }, windowMs);
    
    return true;
  }, [maxAttempts, windowMs]);

  const reset = useCallback(() => {
    setAttempts(0);
    setIsBlocked(false);
    sessionStorage.removeItem('rateLimit');
  }, []);

  return { attempts, isBlocked, resetTime, recordAttempt, reset };
}

// Biometric authentication hook
export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if Web Authentication API is supported
    if (window.PublicKeyCredential) {
      setIsSupported(true);
    }
  }, []);

  const authenticate = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            type: 'public-key',
            id: new Uint8Array(32), // User's credential ID
            transports: ['internal', 'usb']
          }],
          userVerification: 'required'
        }
      });

      if (credential) {
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    }

    return false;
  }, [isSupported]);

  return { isSupported, isAuthenticated, authenticate };
}

// Security monitoring hook
export function useSecurityMonitor() {
  const [threats, setThreats] = useState<string[]>([]);

  useEffect(() => {
    // Monitor for suspicious activities
    const monitor = () => {
      // Check for console access (potential tampering)
      const checkConsole = () => {
        const threshold = 50;
        let count = 0;
        
        const originalLog = console.log;
        console.log = function(...args) {
          count++;
          if (count > threshold) {
            setThreats(prev => [...prev, 'Suspicious console activity detected']);
            console.log = originalLog;
          }
          originalLog.apply(console, args);
        };
      };

      // Check for dev tools
      const checkDevTools = () => {
        const threshold = 160;
        setInterval(() => {
          if (window.outerHeight - window.innerHeight > threshold ||
              window.outerWidth - window.innerWidth > threshold) {
            setThreats(prev => [...prev, 'Developer tools detected']);
          }
        }, 1000);
      };

      checkConsole();
      checkDevTools();
    };

    monitor();
  }, []);

  const clearThreats = useCallback(() => {
    setThreats([]);
  }, []);

  return { threats, clearThreats };
}
