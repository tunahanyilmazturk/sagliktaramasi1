import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import '../styles/login.css';
import {
  Eye, EyeOff, Mail, Lock, User, Briefcase, Shield, ArrowRight,
  CheckCircle, AlertCircle, Sparkles, Zap, Globe, Smartphone,
  ChevronRight, Loader2
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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Demo kullanıcılar
  const demoUsers = [
    { email: 'ahmet@hantech.com', role: 'Yönetici', name: 'Sistem Yöneticisi', color: 'bg-indigo-600' },
    { email: 'ayse@hantech.com', role: 'Doktor', name: 'Dr. Ahmet Yılmaz', color: 'bg-emerald-600' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
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

    setIsLoading(true);
    try {
      if (onLogin) {
        await onLogin(email, password);
      } else {
        await login(email, password);
      }
      toast.success('Giriş başarılı!');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }
    } catch (error) {
      toast.error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    // constants.ts içindeki hash 'admin123' şifresine aittir.
    // Hash: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
    setPassword('admin123');
    setErrors({});

    // Hızlı giriş için formu otomatik gönder
    setTimeout(() => {
      const loginButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (loginButton) loginButton.click();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-violet-900/20 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 dark:bg-violet-800/20 rounded-full mix-blend-multiply dark:mix-blend-color-dodge filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-800/20 rounded-full mix-blend-multiply dark:mix-blend-color-dodge filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-200 dark:bg-purple-800/20 rounded-full mix-blend-multiply dark:mix-blend-color-dodge filter blur-xl opacity-30 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Sol Taraf - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">HanTech</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mobil Sağlık Hizmetleri Platformu</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Sağlık Odaklı Çözüm</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Mobil tarama ve poliklinik süreçlerinde uzmanlaşmış altyapı</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">AI Destekli Analiz</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Akıllı risk analizi ve raporlama</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Mobil Entegrasyon</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Her yerden erişim ve gerçek zamanlı veri</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">500+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Kurum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Personel</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">99.9%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Uptime</div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl p-8 space-y-6">

              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hoş Geldiniz</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Hesabınıza giriş yapın</p>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all ${errors.email ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'
                        }`}
                      placeholder="adsoyad@hantech.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Şifre
                    </label>
                    <a href="#" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      Şifremi Unuttum
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      className={`w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-700/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all ${errors.password ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'
                        }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Oturumu açık tut</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-500/25 text-base"
                  icon={isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                >
                  {isLoading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
                </Button>
              </form>

              {/* Demo Users */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center font-medium">
                  Hızlı Erişim için Demo Hesaplar
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {demoUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => handleDemoLogin(user.email)}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/30 rounded-2xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${user.color} rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                          <User size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                          {user.role}
                        </span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
