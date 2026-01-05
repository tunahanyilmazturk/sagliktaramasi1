import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User, Bell, Lock, Globe, Shield, Save, Moon, Sun, Building, Upload, Image as ImageIcon, Eye, EyeOff, Key } from 'lucide-react';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';
import { hashPassword, checkPasswordStrength } from '../utils/security';

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useData();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<UserProfile>(user);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, [user]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast.success(`${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'} tema aktif edildi.`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateUser(formData);
    toast.success('Profil bilgileriniz güncellendi!');
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tüm şifre alanlarını doldurun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor.');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 3) {
      toast.error('Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.');
      return;
    }

    try {
      // In a real app, you'd verify the current password with the backend
      // For demo, we'll just hash and save the new password
      const hashedPassword = await hashPassword(newPassword);
      // Here you would update the password in your backend
      toast.success('Şifreniz başarıyla güncellendi.');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Şifre güncellenirken bir hata oluştu.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil Bilgileri', icon: <User size={18} /> },
    { id: 'security', label: 'Güvenlik', icon: <Lock size={18} /> },
    { id: 'appearance', label: 'Görünüm', icon: <Sun size={18} /> },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Profilim</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kişisel bilgilerinizi ve hesap ayarlarınızı yönetin.</p>
        </div>
        <Button icon={<Save size={18} />} onClick={handleSave}>Değişiklikleri Kaydet</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Menu */}
        <div className="lg:col-span-3">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  {tab.label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">

          {activeTab === 'profile' && (
            <Card className="p-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-700 pb-8">
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white dark:ring-slate-800">
                  {formData.avatarInitials}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-3">{formData.title}</p>
                  <Button variant="outline" size="sm">Fotoğrafı Değiştir</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Ad Soyad</label>
                  <input
                    name="name"
                    className="input"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="label">Unvan</label>
                  <input
                    name="title"
                    className="input"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="label">E-posta</label>
                  <input
                    name="email"
                    className="input"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled // Email should not be changeable
                  />
                  <p className="text-[10px] text-slate-400 mt-1">E-posta değiştirmek için yöneticinize başvurun</p>
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-8 animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Şifre Değiştir</h3>

              <div className="space-y-6 max-w-md">
                <div>
                  <label className="label">Mevcut Şifre</label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="Mevcut şifrenizi girin"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="label">Yeni Şifre</label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showPasswords.new ? 'text' : 'password'}
                      placeholder="Yeni şifrenizi girin"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              checkPasswordStrength(newPassword).score >= level
                                ? level <= 2
                                  ? 'bg-red-500'
                                  : level <= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {checkPasswordStrength(newPassword).feedback.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="label">Yeni Şifre (Tekrar)</label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="Yeni şifrenizi tekrar girin"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-1">Şifreler eşleşmiyor</p>
                  )}
                </div>
                
                <Button variant="primary" onClick={handlePasswordUpdate} className="w-full">
                  Şifreyi Güncelle
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-medium text-slate-800 dark:text-white mb-4">İki Faktörlü Doğrulama (2FA)</h4>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Hesabınızı ekstra güvenlik katmanı ile koruyun.</p>
                  </div>
                  <Button variant="outline" icon={<Shield size={16} />}>Aktifleştir</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-8 animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Tema Ayarları</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${theme === 'light' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500">
                    <Sun size={20} fill="currentColor" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Aydınlık Mod</p>
                    <p className="text-xs text-slate-500">Standart görünüm</p>
                  </div>
                  {theme === 'light' && <div className="absolute top-4 right-4 h-3 w-3 bg-blue-500 rounded-full"></div>}
                </button>

                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${theme === 'dark' ? 'border-blue-500 bg-slate-800' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-900 shadow-sm flex items-center justify-center text-blue-200">
                    <Moon size={20} fill="currentColor" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 dark:text-white">Karanlık Mod</p>
                    <p className="text-xs text-slate-500">Göz yormayan tema</p>
                  </div>
                  {theme === 'dark' && <div className="absolute top-4 right-4 h-3 w-3 bg-blue-500 rounded-full"></div>}
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
