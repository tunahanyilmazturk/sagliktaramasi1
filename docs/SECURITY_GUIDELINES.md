# Güvenlik Kılavuzu

Bu doküman, projemizde uygulanan güvenlik önlemlerini ve geliştiricilerin takip etmesi gereken güvenlik en iyi uygulamalarını açıklamaktadır.

## 📋 İçerik

1. [Kimlik Doğrulama ve Yetkilendirme](#kimlik-doğrulama-ve-yetkilendirme)
2. [Şifre Güvenliği](#şifre-güvenliği)
3. [Oturum Yönetimi](#oturum-yönetimi)
4. [Input Validasyonu ve XSS Koruması](#input-validasyonu-ve-xss-koruması)
5. [CSRF Koruması](#csrf-koruması)
6. [Rate Limiting](#rate-limiting)
7. [Veri Şifreleme](#veri-şifreleme)
8. [API Güvenliği](#api-güvenliği)
9. [Frontend Güvenliği](#frontend-güvenliği)
10. [Güvenlik İzleme ve Loglama](#güvenlik-izleme-ve-loglama)

## 🔐 Kimlik Doğrulama ve Yetkilendirme

### Mevcut Uygulama
- JWT tabanlı kimlik doğrulama
- Access ve refresh token mekanizması
- Otomatik token yenileme
- Rol bazlı yetkilendirme (RBAC)

### Güvenlik Önlemleri
```typescript
// Token güvenliği
const tokenManager = new TokenManager();
tokenManager.setTokens(accessToken, refreshToken, expiresIn);

// Otomatik token yenileme
if (tokenManager.shouldRefreshToken()) {
  await refreshToken();
}
```

### Best Practices
- ✅ Her zaman HTTPS kullanın
- ✅ Token'ı httpOnly çerezlerde saklayın (production)
- ✅ Token'lara expiry date ekleyin
- ✅ Refresh token'ı güvenli bir şekilde saklayın
- ❌ Token'ı localStorage'da saklamayın (XSS riski)

## 🔑 Şifre Güvenliği

### Mevcut Uygulama
- PBKDF2 ile şifre hashing
- Salt kullanımı
- Minimum 8 karakter zorunluluğu
- Şifre güç kontrolü

### Güvenlik Önlemleri
```typescript
// Güçlü şifre hashing
const { hash, salt } = await hashPassword(password);

// Şifre validasyonu
const { score, feedback, isStrong } = checkPasswordStrength(password);
if (!isStrong) {
  // Kullanıcıyı bilgilendir
}
```

### Best Practices
- ✅ En az 12 karakter uzunluğunda şifreler
- ✅ Büyük/küçük harf, rakam ve özel karakter zorunluluğu
- ✅ Şifre hashing için PBKDF2, Argon2 veya bcrypt kullanın
- ✅ Her şifre için unique salt kullanın
- ❌ Plain text şifre saklamayın
- ❌ MD5 veya SHA-1 gibi eski algoritmalar kullanmayın

## 📱 Oturum Yönetimi

### Mevcut Uygulama
- Secure session management
- Otomatik logout (inactivity timeout)
- Session tracking
- Concurrent session control

### Güvenlik Önlemleri
```typescript
// Secure session
SecureSession.createSession(userData, 8 * 60 * 60 * 1000); // 8 saat

// Inactivity kontrolü
const { sessionValid } = useSecurity();
if (!sessionValid) {
  // Logout yap
}
```

### Best Practices
- ✅ Session timeout'u kısa tutun (30 dakika)
- ✅ Inactivity timeout ekleyin
- ✅ Session'ı server-side da yönetin
- ✅ Logout butonu ekleyin
- ❌ Session'ı client-side only yönetmeyin

## 🛡️ Input Validasyonu ve XSS Koruması

### Mevcut Uygulama
- Comprehensive input validation
- XSS protection
- HTML sanitization
- SQL injection prevention

### Güvenlik Önlemleri
```typescript
// Input sanitization
const sanitizedInput = sanitizeInput(userInput);

// Form validasyonu
const validation = validateForm(data, validationRules);
if (!validation.isValid) {
  // Hataları göster
}

// SecureForm component kullanımı
<SecureForm
  onSubmit={handleSubmit}
  validationRules={validationRules}
>
  <SecureFormField name="email" type="email" required />
  <SecureFormField name="password" type="password" required />
</SecureForm>
```

### Best Practices
- ✅ Her user input'unu validate edin
- ✅ HTML içeriğini sanitize edin
- ✅ CSP (Content Security Policy) kullanın
- ✅ DOMPurify kütüphanesi kullanın (production)
- ❌ User input'unu doğrudan HTML'e eklemeyin
- ❌ eval() veya innerHTML kullanmaktan kaçının

## 🔄 CSRF Koruması

### Mevcut Uygulama
- CSRF token generation
- Token validation
- SameSite cookies
- Origin header validation

### Güvenlik Önlemleri
```typescript
// CSRF token
const token = CSRFProtection.generateToken();

// Request header'a ekle
headers: {
  'X-CSRF-Token': token
}

// Middleware'de validasyon
if (!CSRFProtection.validateToken(requestToken)) {
  return 403;
}
```

### Best Practices
- ✅ Her state-changing request için CSRF token kullanın
- ✅ Token'ı her request'te yenileyin
- ✅ SameSite cookie attribute kullanın
- ❌ GET request'leri için state değiştirmeyin

## ⏱️ Rate Limiting

### Mevcut Uygulama
- IP bazlı rate limiting
- Endpoint bazlı limitler
- Progressive delays
- Account lockout

### Güvenlik Önlemleri
```typescript
// Rate limiting
const rateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 deneme, 15 dakika

if (rateLimiter.isBlocked(ip)) {
  return 'Too many requests';
}

// Client-side rate limiting
const { recordAttempt, isBlocked } = useRateLimit(3, 60000);
if (!recordAttempt()) {
  // Block UI
}
```

### Best Practices
- ✅ Login endpoint'inde strict rate limiting
- ✅ API endpoint'lerinde rate limiting
- ✅ Progressive delays kullanın
- ✅ IP ve user bazlı limiting

## 🔒 Veri Şifreleme

### Mevcut Uygulama
- AES-GCM encryption
- Client-side encryption
- Key management
- Secure storage

### Güvenlik Önlemleri
```typescript
// Veri şifreleme
const key = await encryptionService.generateKey();
const { encrypted, iv } = await encryptionService.encrypt(data, key);

// Şifre çözme
const decrypted = await encryptionService.decrypt(encrypted, iv, key);
```

### Best Practices
- ✅ Hassas verileri şifreleyin
- ✅ Güçlü encryption algoritmaları kullanın
- ✅ Key management güvenli olsun
- ❌ Encryption key'ini kod içinde saklamayın

## 🌐 API Güvenliği

### Mevcut Uygulama
- Security headers
- CORS configuration
- Request validation
- Response sanitization

### Güvenlik Önlemleri
```typescript
// Security headers
const headers = getSecurityHeaders();
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Content-Security-Policy: default-src 'self'

// CORS configuration
const corsOptions = {
  origin: ['https://yourdomain.com'],
  credentials: true
};
```

### Best Practices
- ✅ Tüm security header'ları ekleyin
- ✅ CORS'i kısıtlayın
- ✅ Request body'ı validate edin
- ✅ Response'da hassas bilgi paylaşmayın

## 💻 Frontend Güvenliği

### Mevcut Uygulama
- XSS protection hooks
- Security monitoring
- Device fingerprinting
- Threat detection

### Güvenlik Önlemleri
```typescript
// XSS protection
const { xssDetected } = useXSSProtection();

// Security monitoring
const { threats, clearThreats } = useSecurityMonitor();

// Secure storage
const { setItem, getItem } = useSecureStorage();
```

### Best Practices
- ✅ React'in built-in XSS korumasını kullanın
- ✅ Dynamic HTML'den kaçının
- ✅ Third-party script'leri güvenlik kontrolünden geçirin
- ❌ Inline event handlers kullanmaktan kaçının

## 📊 Güvenlik İzleme ve Loglama

### Mevcut Uygulama
- Security event logging
- Audit trail
- Threat reporting
- Real-time monitoring

### Güvenlik Önlemleri
```typescript
// Security event log
await auditService.logSecurityEvent({
  type: 'LOGIN_ATTEMPT',
  severity: 'medium',
  details: { email, success: false },
  timestamp: new Date().toISOString()
});

// Threat reporting
await auditService.reportThreat({
  type: 'XSS_ATTEMPT',
  description: 'XSS attempt detected',
  severity: 'high'
});
```

### Best Practices
- ✅ Tüm security event'leri loglayın
- ✅ Logları güvenli saklayın
- ✅ Real-time monitoring ekleyin
- ✅ Alert mekanizması kurun

## 🚀 Güvenlik Checklist

### Development
- [ ] Tüm input'lar validate edildi mi?
- [ ] XSS koruması uygulandı mı?
- [ ] CSRF token kullanılıyor mu?
- [ ] Rate limiting eklendi mi?
- [ ] Security header'lar eklendi mi?
- [ ] Hassas veriler şifrelendi mi?

### Production
- [ ] HTTPS aktif mi?
- [ ] httpOnly cookies kullanılıyor mu?
- [ ] CSP header'ı var mı?
- [ ] Monitoring aktif mi?
- [ ] Backup ve recovery planı var mı?
- [ ] Penetrasyon testi yapıldı mı?

## 📚 Ek Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Security Headers Test](https://securityheaders.com/)

## 🚨 Acil Durum Prosedürü

1. **Güvenlik İhlali Tespiti**:
   - Hemen security team'e bildir
   - Etki alanı belirle
   - Logları koru

2. **Hızlı Müdahale**:
   - Etkilen hesapları kapat
   - Şifreleri sıfırla
   - Kullanıcıları bilgilendir

3. **Soruşturma**:
   - Root cause analiz
   - Logları incele
   - Rapor hazırla

4. **İyileştirme**:
   - Zafiyetleri kapat
   - Kontrolleri güçlendir
   - Dokümantasyonu güncelle
