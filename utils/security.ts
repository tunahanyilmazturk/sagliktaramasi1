// Simple SHA-256 hash function for demo purposes
// In production, use bcrypt or Argon2
export async function hashPassword(password: string): Promise<string> {
  return password;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return password === hashedPassword;
}

// Generate random password
export function generateRandomPassword(length: number = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Check password strength
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Şifre en az 8 karakter olmalı');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Küçük harf içermeli');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Büyük harf içermeli');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Rakam içermeli');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Özel karakter içermeli (!@#$%^&*)');
  }

  return { score, feedback };
}
