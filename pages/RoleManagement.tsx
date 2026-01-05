import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Shield, Users, Eye, EyeOff, Settings, FileText, Calendar, BarChart3, Building2, UserCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface RolePermission {
  id: string;
  name: string;
  description: string;
  permissions: {
    dashboard: boolean;
    companies: boolean;
    staff: boolean;
    tests: boolean;
    proposals: boolean;
    screenings: boolean;
    calendar: boolean;
    reports: boolean;
    settings: boolean;
    users: boolean;
  };
}

const RoleManagement: React.FC = () => {
  const { user } = useData();
  const [roles, setRoles] = useState<RolePermission[]>([
    {
      id: 'admin',
      name: 'Süper Admin',
      description: 'Tüm yetkilere sahip sistem yöneticisi',
      permissions: {
        dashboard: true,
        companies: true,
        staff: true,
        tests: true,
        proposals: true,
        screenings: true,
        calendar: true,
        reports: true,
        settings: true,
        users: true,
      }
    },
    {
      id: 'manager',
      name: 'Yönetici',
      description: 'Kurumsal yönetim ve kullanıcı yönetimi yetkileri',
      permissions: {
        dashboard: true,
        companies: true,
        staff: true,
        tests: true,
        proposals: true,
        screenings: true,
        calendar: true,
        reports: true,
        settings: true,
        users: true,
      }
    },
    {
      id: 'standard',
      name: 'Standart Kullanıcı',
      description: 'Temel işlemleri yapabilen kullanıcı',
      permissions: {
        dashboard: true,
        companies: true,
        staff: true,
        tests: true,
        proposals: true,
        screenings: true,
        calendar: true,
        reports: true,
        settings: false,
        users: false,
      }
    }
  ]);

  const [selectedRole, setSelectedRole] = useState<string>('standard');

  const handlePermissionChange = (roleId: string, permission: string) => {
    setRoles(prev => prev.map(role =>
      role.id === roleId
        ? { ...role, permissions: { ...role.permissions, [permission]: !role.permissions[permission as keyof typeof role.permissions] } }
        : role
    ));
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('rolePermissions', JSON.stringify(roles));
    toast.success('Rol yetkileri güncellendi!');
  };

  const permissionSections = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 size={16} />,
      description: 'Ana panel ve istatistikler'
    },
    {
      key: 'companies',
      label: 'Firmalar',
      icon: <Building2 size={16} />,
      description: 'Firma yönetimi ve detayları'
    },
    {
      key: 'staff',
      label: 'Personel',
      icon: <Users size={16} />,
      description: 'Personel listesi ve yönetimi'
    },
    {
      key: 'tests',
      label: 'Test Havuzu',
      icon: <FileText size={16} />,
      description: 'Test tanımları ve yönetimi'
    },
    {
      key: 'proposals',
      label: 'Teklifler',
      icon: <FileText size={16} />,
      description: 'Teklif oluşturma ve yönetimi'
    },
    {
      key: 'screenings',
      label: 'Taramalar',
      icon: <UserCheck size={16} />,
      description: 'Sağlık taramaları ve görev emirleri'
    },
    {
      key: 'calendar',
      label: 'Takvim',
      icon: <Calendar size={16} />,
      description: 'Randevu ve etkinlik takvimi'
    },
    {
      key: 'reports',
      label: 'Raporlar',
      icon: <BarChart3 size={16} />,
      description: 'Raporlama ve analizler'
    },
    {
      key: 'settings',
      label: 'Ayarlar',
      icon: <Settings size={16} />,
      description: 'Sistem ayarları ve yapılandırma'
    },
    {
      key: 'users',
      label: 'Kullanıcı Yönetimi',
      icon: <Users size={16} />,
      description: 'Kullanıcı ekleme ve yönetme'
    }
  ];

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Rol ve Yetki Yönetimi</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kullanıcı rollerinin erişim yetkilerini yapılandırın.</p>
        </div>
        <Button icon={<Save size={18} />} onClick={handleSave}>Değişiklikleri Kaydet</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Role Selection */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full space-y-6">
            <div>
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1">Erişim Rolleri</h3>
              <p className="text-[10px] text-slate-500 font-medium">Yapılandırılacak rolü seçin</p>
            </div>
            <div className="space-y-3">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${selectedRole === role.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10'
                      : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 bg-white dark:bg-slate-900'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-sm ${role.id === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        role.id === 'manager' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                      <Shield size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${selectedRole === role.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>{role.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">{role.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Permissions */}
        <div className="lg:col-span-8">
          <Card className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shadow-sm ${currentRole?.id === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    currentRole?.id === 'manager' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                  <Shield size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">{currentRole?.name} Yetkileri</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{Object.values(currentRole?.permissions || {}).filter(Boolean).length} / {Object.keys(currentRole?.permissions || {}).length} Aktif Modül</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-800">
              {permissionSections.map(section => (
                <div
                  key={section.key}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${currentRole?.permissions[section.key as keyof typeof currentRole.permissions]
                      ? 'border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-900/5'
                      : 'border-slate-50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl shadow-inner transition-colors ${currentRole?.permissions[section.key as keyof typeof currentRole.permissions]
                        ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                      }`}>
                      {section.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{section.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{section.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePermissionChange(selectedRole, section.key)}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${currentRole?.permissions[section.key as keyof typeof currentRole.permissions]
                        ? 'bg-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-sm ${currentRole?.permissions[section.key as keyof typeof currentRole.permissions]
                          ? 'translate-x-7'
                          : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 dark:shadow-none overflow-hidden relative group">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-inner">
            <Eye size={40} className="text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-2xl font-black mb-4 tracking-tight">Yetkilendirme Matrisi Özeti</h4>
            <p className="text-slate-400 text-sm mb-8 max-w-2xl font-medium">Bu matris, kullanıcıların sistemdeki modüllere erişim seviyelerini görselleştirir. Değişiklikler kaydedildikten sonra tüm oturumlar için anında geçerli olur.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {roles.map(role => {
                const enabledCount = Object.values(role.permissions).filter(Boolean).length;
                const totalCount = Object.keys(role.permissions).length;
                const percentage = Math.round((enabledCount / totalCount) * 100);

                return (
                  <div key={role.id} className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{role.name}</span>
                      <span className="text-[10px] font-black text-blue-400">%{percentage}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${role.id === 'admin' ? 'bg-purple-500' :
                            role.id === 'manager' ? 'bg-blue-500' :
                              'bg-slate-500'
                          }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      {enabledCount} / {totalCount} Modül Erişimi
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
