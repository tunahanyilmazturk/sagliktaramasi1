import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { 
  Plus, FileText, Users, Calendar, BarChart3, Settings, 
  TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { companies, proposals, appointments, tests } = useData();

  const actions = [
    {
      title: 'Yeni Firma',
      description: 'Müşteri ekle',
      icon: <Plus size={20} />,
      color: 'bg-blue-500',
      onClick: () => navigate('/companies'),
      badge: null
    },
    {
      title: 'Teklif Oluştur',
      description: 'Yeni teklif',
      icon: <FileText size={20} />,
      color: 'bg-violet-500',
      onClick: () => navigate('/proposals/create'),
      badge: proposals.filter(p => p.status === 'Draft').length || null
    },
    {
      title: 'Randevu Planla',
      description: 'Test takvimi',
      icon: <Calendar size={20} />,
      color: 'bg-emerald-500',
      onClick: () => navigate('/calendar'),
      badge: appointments.filter(a => a.status === 'Scheduled').length || null
    },
    {
      title: 'Personel',
      description: 'Çalışanlar',
      icon: <Users size={20} />,
      color: 'bg-orange-500',
      onClick: () => navigate('/staff'),
      badge: null
    },
    {
      title: 'Raporlar',
      description: 'Analizler',
      icon: <BarChart3 size={20} />,
      color: 'bg-pink-500',
      onClick: () => navigate('/reports'),
      badge: null
    },
    {
      title: 'Ayarlar',
      description: 'Yönetim',
      icon: <Settings size={20} />,
      color: 'bg-slate-500',
      onClick: () => navigate('/settings'),
      badge: null
    }
  ];

  const stats = [
    {
      label: 'Bekleyen Teklif',
      value: proposals.filter(p => p.status === 'Sent').length,
      icon: <Clock size={16} />,
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      label: 'Bugünkü Randevu',
      value: appointments.filter(a => {
        const today = new Date();
        const aptDate = new Date(a.date);
        return aptDate.toDateString() === today.toDateString();
      }).length,
      icon: <Calendar size={16} />,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Tamamlanan Test',
      value: tests.filter(t => t.status === 'Completed').length,
      icon: <CheckCircle size={16} />,
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Yüksek Risk',
      value: companies.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').length,
      icon: <AlertTriangle size={16} />,
      color: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Hızlı İşlemler
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="group relative p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:shadow-violet-900/20 hover:-translate-y-1 transition-all duration-200"
            >
              {action.badge && action.badge > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{action.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Genel Durum
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
