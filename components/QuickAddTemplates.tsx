import React from 'react';
import { Button } from './Button';
import { Zap, Truck, GraduationCap, Stethoscope, Activity } from 'lucide-react';

interface QuickTemplate {
  id: string;
  title: string;
  type: 'Screening' | 'Consultation' | 'Training';
  duration: number; // minutes
  icon: React.ReactNode;
  color: string;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: '1',
    title: 'Mobil Sağlık Taraması',
    type: 'Screening',
    duration: 240,
    icon: <Truck size={20} />,
    color: 'blue'
  },
  {
    id: '3',
    title: 'Yerinde Poliklinik',
    type: 'Consultation',
    duration: 120,
    icon: <Stethoscope size={20} />,
    color: 'orange'
  },
  {
    id: '4',
    title: 'Aşı Uygulaması',
    type: 'Consultation',
    duration: 60,
    icon: <Activity size={20} />,
    color: 'green'
  },
  {
    id: '5',
    title: 'Test ve Ölçüm',
    type: 'Screening',
    duration: 90,
    icon: <Activity size={20} />,
    color: 'indigo'
  }
];

interface QuickAddTemplatesProps {
  onTemplateSelect: (template: QuickTemplate) => void;
}

export const QuickAddTemplates: React.FC<QuickAddTemplatesProps> = ({ onTemplateSelect }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">Hızlı Ekleme Şablonları</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {QUICK_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template)}
            className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group hover:shadow-lg hover:scale-[1.02] border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className={`w-12 h-12 rounded-xl bg-${template.color}-100 dark:bg-${template.color}-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <div className={`text-${template.color}-600 dark:text-${template.color}-400`}>
                {template.icon}
              </div>
            </div>
            <div className="font-medium text-slate-900 dark:text-white text-sm mb-1">
              {template.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {template.duration} dakika
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 İpucu: Şablonları kullanarak randevuları hızlıca oluşturabilirsiniz. Tarih ve saat seçimi için takvim üzerinde istediğiniz güne tıklayın.
        </p>
      </div>
    </div>
  );
};
