import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User, Bell, Lock, Globe, Shield, Save, Moon, Sun, Building, Upload, Image as ImageIcon, ChevronRight, Monitor, BookOpen, Trash2, Plus, Zap, Sparkles, Download, AlertCircle, Mail, Phone, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { UserProfile, InstitutionProfile } from '../types';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import RoleManagement from './RoleManagement';
import { createBackup, downloadBackup, restoreBackup, validateBackupData } from '../utils/dataBackup';

const Settings: React.FC = () => {
  const {
    user,
    institution,
    updateInstitution,
    companies,
    staff,
    tests,
    proposals,
    appointments,
    notifications,
    accounts,
    setCompanies,
    setStaff,
    setTests,
    setProposals,
    setAppointments,
    setNotifications,
    setAccounts
  } = useData();
  const [activeTab, setActiveTab] = useState('institution');
  const [instData, setInstData] = useState<InstitutionProfile>(institution);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<any>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, []);

  // Backup handlers
  const handleBackup = () => {
    const backup = createBackup(
      companies,
      staff,
      tests,
      proposals,
      appointments,
      notifications,
      accounts
    );
    downloadBackup(backup);
    toast.success('Yedekleme başarıyla indirildi');
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const backup = await restoreBackup(file);
      const errors = validateBackupData(backup);

      if (errors.length > 0) {
        toast.error('Yedek dosyasında hatalar: ' + errors.join(', '));
        return;
      }

      setPendingBackup(backup);
      setShowRestoreConfirm(true);
    } catch (error) {
      toast.error('Geri yükleme başarısız: ' + (error as Error).message);
    } finally {
      setIsRestoring(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const confirmRestore = () => {
    if (!pendingBackup) return;

    // Restore data
    setCompanies(pendingBackup.data.companies);
    setStaff(pendingBackup.data.staff);
    setTests(pendingBackup.data.tests);
    setProposals(pendingBackup.data.proposals);
    setAppointments(pendingBackup.data.appointments);
    setNotifications(pendingBackup.data.notifications);
    setAccounts(pendingBackup.data.accounts);

    toast.success('Veriler başarıyla geri yüklendi');
    setShowRestoreConfirm(false);
    setPendingBackup(null);
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

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

  const handleInstInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInstData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateInstitution(instData);
    toast.success('Ayarlar başarıyla kaydedildi!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo dosyası 2MB\'dan küçük olmalıdır.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setInstData(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter Tabs based on Role
  const tabs = [
    { id: 'institution', label: 'Kurumsal Bilgiler', icon: <Building size={18} /> },
    { id: 'appearance', label: 'Görünüm & Tema', icon: <Monitor size={18} /> },
  ];

  if (user.role === 'Admin') {
    tabs.splice(1, 0, { id: 'roles', label: 'Rol ve Yetkiler', icon: <Shield size={18} /> });
  }


  return (
    <div className="w-full mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Ayarlar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uygulama tercihleri ve hesap yönetimi.</p>
        </div>
        <Button icon={<Save size={18} />} onClick={handleSave}>Kaydet</Button>
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
                {activeTab === tab.id && <ChevronRight size={16} />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">

          {activeTab === 'institution' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-700">
                  <div className="h-40 w-40 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group shadow-inner">
                    {instData.logoBase64 ? (
                      <img src={instData.logoBase64} alt="Kurum Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ImageIcon size={40} strokeWidth={1.5} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Logo Yok</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-blue-600/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                      <label className="cursor-pointer text-white text-xs font-bold flex flex-col items-center gap-2 px-4 text-center">
                        <Upload size={20} />
                        <span>Logoyu Güncelle</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-3">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Kurumsal Markalama</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                      Kurum logonuz teklifler, periyodik raporlar ve saha görev emirlerinde başlık kısmında yer alacaktır. Şeffaf arka planlı (PNG) yüksek çözünürlüklü logolar tavsiye edilir.
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                      {instData.logoBase64 && (
                        <button
                          onClick={() => setInstData(prev => ({ ...prev, logoBase64: undefined }))}
                          className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-100 hover:border-red-200 bg-red-50/50 transition-all"
                        >
                          <Trash2 size={14} /> Logoyu Sil
                        </button>
                      )}
                      <label className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-100 hover:border-blue-200 bg-blue-50/50 cursor-pointer transition-all">
                        <Upload size={14} /> Dosya Seç
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2 space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Firma Ticari Adı</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        name="name"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        value={instData.name}
                        onChange={handleInstInputChange}
                        placeholder="Örn: HanTech Sağlık Hizmetleri A.Ş."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Kurumsal E-posta</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        name="email"
                        type="email"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        value={instData.email}
                        onChange={handleInstInputChange}
                        placeholder="info@kurumadresi.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Web Sitesi</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        name="website"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        value={instData.website}
                        onChange={handleInstInputChange}
                        placeholder="www.kurumsalsite.com"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Resmi Adres Bilgisi</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        name="address"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        value={instData.address}
                        onChange={handleInstInputChange}
                        placeholder="Mahalle, Sokak, No, İlçe/İl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Zap className="text-yellow-300" size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Dış Üyelik Entegrasyonu</h4>
                    <p className="text-sm text-blue-50/80 leading-relaxed">
                      Sisteminiz şu anda dış üyelik yapısıyla senkronize çalışmaktadır. Paket yükseltme, ödeme ve limit işlemleri ana portal üzerinden otomatik olarak güncellenir.
                    </p>
                    <button className="mt-4 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2">
                      Portalı Görüntüle <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
                    <Sun size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Görünüm Tercihleri</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Arayüz temasını çalışma ortamınıza göre özelleştirin.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-start gap-4 ${theme === 'light'
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-500/5'}`}
                  >
                    <div className="h-20 w-full bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-2 flex flex-col gap-1.5">
                      <div className="h-2 w-1/3 bg-slate-100 rounded"></div>
                      <div className="h-2 w-1/2 bg-slate-50 rounded"></div>
                      <div className="mt-auto h-4 w-full bg-blue-500 rounded-lg"></div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Aydınlık Mod</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Klasik ve temiz bir görünüm.</p>
                    </div>
                    {theme === 'light' && <div className="absolute top-4 right-4 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white ring-4 ring-blue-500/20 animate-pulse-slow">
                      <Save size={12} strokeWidth={3} />
                    </div>}
                  </button>

                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-start gap-4 ${theme === 'dark'
                      ? 'border-blue-500 bg-slate-900'
                      : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-500/5'}`}
                  >
                    <div className="h-20 w-full bg-slate-950 rounded-xl border border-slate-800 shadow-sm overflow-hidden p-2 flex flex-col gap-1.5">
                      <div className="h-2 w-1/3 bg-slate-800 rounded"></div>
                      <div className="h-2 w-1/2 bg-slate-900 rounded"></div>
                      <div className="mt-auto h-4 w-full bg-blue-600 rounded-lg"></div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Karanlık Mod</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Düşük ışıkta konforlu kullanım.</p>
                    </div>
                    {theme === 'dark' && <div className="absolute top-4 right-4 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white ring-4 ring-blue-500/20 animate-pulse-slow">
                      <Save size={12} strokeWidth={3} />
                    </div>}
                  </button>
                </div>
              </div>

              {/* Security & Backup Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Güvenlik ve Veri Yönetimi</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verilerinizi yedekleyin veya sisteminizi geri yükleyin.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                    <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Önemli Veri Güvenliği Notu</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
                        Yedekleme dosyası tüm kurumsal verilerinizi, personel kayıtlarınızı ve test sonuçlarınızı içerir. Dosyayı başkalarıyla paylaşmayın ve güvenli, şifreli bir depolama alanında saklayın.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleBackup}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
                    >
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                        <Download size={20} />
                      </div>
                      <div className="text-left">
                        <span>Veri Yedeği İndir</span>
                        <p className="text-[10px] font-medium text-slate-400">Tüm sistem .json olarak iner</p>
                      </div>
                    </button>

                    <div className="relative group overflow-hidden rounded-2xl">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isRestoring}
                      />
                      <div className={`flex items-center gap-4 p-4 h-full border rounded-2xl transition-all font-bold text-sm ${isRestoring
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900 group-hover:bg-white dark:group-hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <div className="p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                          <Upload size={20} />
                        </div>
                        <div className="text-left">
                          <span>{isRestoring ? 'Geri Yükleniyor...' : 'Veri Yedeği Yükle'}</span>
                          <p className="text-[10px] font-medium text-slate-400">Dosya seçerek sistemi yenileyin</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <RoleManagement />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setPendingBackup(null);
          toast('İşlem iptal edildi');
        }}
        onConfirm={confirmRestore}
        title="Verileri Geri Yükle"
        message="Bu işlem mevcut tüm verilerinizi (firmalar, personel, testler vb.) kalıcı olarak silecektir. Devam etmek istediğinizden emin misiniz?"
        confirmText="Verileri Üstüne Yaz"
        variant="danger"
      />
    </div>
  );
};

export default Settings;
