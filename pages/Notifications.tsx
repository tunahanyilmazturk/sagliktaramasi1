import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Calendar, Truck, Users, ClipboardList } from 'lucide-react';

const Notifications: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<'All' | 'System' | 'Vehicle' | 'Staff' | 'Screening'>('All');

  const filteredList = notifications.filter(n => {
    const matchesRead = filter === 'all' || !n.read;
    const matchesCategory = category === 'All' || n.category === category;
    return matchesRead && matchesCategory;
  });

  const getIcon = (type: string, category?: string) => {
    if (category === 'Vehicle') return <Truck className="text-blue-500" size={24} />;
    if (category === 'Staff') return <Users className="text-purple-500" size={24} />;
    if (category === 'Screening') return <ClipboardList className="text-emerald-500" size={24} />;
    
    switch(type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
      case 'error': return <XCircle className="text-red-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  const getBgColor = (type: string, category?: string) => {
    if (category === 'Vehicle') return 'bg-blue-50 dark:bg-blue-900/20';
    if (category === 'Staff') return 'bg-purple-50 dark:bg-purple-900/20';
    if (category === 'Screening') return 'bg-emerald-50 dark:bg-emerald-900/20';

    switch(type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20';
      case 'error': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bildirim Merkezi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sistem uyarıları, randevu hatırlatmaları ve teklif durumları.</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
             {[
               { id: 'All', label: 'Tümü' },
               { id: 'System', label: 'Sistem' },
               { id: 'Vehicle', label: 'Araçlar' },
               { id: 'Staff', label: 'Personel' },
               { id: 'Screening', label: 'Taramalar' }
             ].map((cat) => (
               <button 
                 key={cat.id}
                 onClick={() => setCategory(cat.id as any)}
                 className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${category === cat.id ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
               >
                 {cat.label}
               </button>
             ))}
           </div>

           <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-inner' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
               Tümü
             </button>
             <button 
                onClick={() => setFilter('unread')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${filter === 'unread' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-inner' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
               Okunmamış
             </button>
           </div>
           <Button variant="outline" icon={<CheckCheck size={18} />} onClick={markAllNotificationsRead}>
             Hepsini Oku
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredList.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-slate-300 dark:text-slate-600" />
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium">Şu an için yeni bir bildirim bulunmuyor.</p>
           </div>
        ) : (
          filteredList.map(notification => (
            <div 
              key={notification.id} 
              className={`p-5 rounded-3xl border transition-all duration-300 group ${
                !notification.read 
                ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 shadow-md shadow-blue-500/5 ring-1 ring-blue-100 dark:ring-blue-900/20' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-5">
                <div className={`p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${getBgColor(notification.type, notification.category)}`}>
                  {getIcon(notification.type, notification.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.category && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            notification.category === 'Vehicle' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' :
                            notification.category === 'Staff' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40' :
                            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'
                          }`}>
                            {notification.category}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-lg font-bold truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                           <Calendar size={12} />
                           {new Date(notification.date).toLocaleDateString('tr-TR')} {new Date(notification.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm leading-relaxed">{notification.message}</p>
                </div>
                {!notification.read && (
                  <button 
                    onClick={() => markNotificationRead(notification.id)}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all shadow-sm hover:shadow"
                    title="Okundu işaretle"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;