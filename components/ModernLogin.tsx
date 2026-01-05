import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import '../styles/login.css';
import { Captcha } from './Captcha';
import {
  Eye, EyeOff, Mail, Lock, User, Shield, ArrowRight,
  CheckCircle, AlertCircle, Zap, Globe, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ModernLoginProps {
  onLogin?: (email: string, password: string) => Promise<void>;
}

export const ModernLogin: React.FC<ModernLoginProps> = ({ onLogin }) => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-posta veya kullanıcı adı gereklidir';
    }

    if (!password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isCaptchaVerified) {
      toast.error('Lütfen güvenlik doğrulamasını tamamlayın.');
      return;
    }

    setIsLoading(true);
    try {
      if (onLogin) {
        await onLogin(email, password);
      } else {
        await login(email, password);
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      
      <div className="login-card">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl shadow-xl shadow-indigo-500/20 mb-4 animate-float">
            <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">HanTech</h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Sistem Girişi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="login-input-group">
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className="login-input"
              placeholder="E-posta veya kullanıcı adı"
              required
            />
            <User className="login-input-icon" size={20} />
            {errors.email && (
              <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1 ml-2">
                <AlertCircle size={14} />
                {errors.email}
              </p>
            )}
          </div>

          <div className="login-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className="login-input"
              placeholder="Şifreniz"
              required
            />
            <Lock className="login-input-icon" size={20} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {errors.password && (
              <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1 ml-2">
                <AlertCircle size={14} />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="custom-checkbox"
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
                Beni Hatırla
              </span>
            </label>
          </div>

          <div className="py-2">
            <Captcha onVerify={setIsCaptchaVerified} />
          </div>

          <button
            type="submit"
            disabled={isLoading || !isCaptchaVerified}
            className="login-button group"
          >
            {isLoading ? (
              <Loader2 className="loading-spinner" size={22} />
            ) : (
              <>
                <span className="font-black">SİSTEME GİRİŞ YAP</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50 text-center">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Güvenli Sağlık Platformu v2.0
          </p>
        </div>
      </div>
    </div>
  );
};
