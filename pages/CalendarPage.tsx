import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuickAddTemplates } from '../components/QuickAddTemplates';
import { generateAppointmentPDF } from '../services/pdfService';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Building2, Check, 
  Download, FileText, X, FlaskConical, User, List, Grid3X3, Truck, Filter, 
  Stethoscope, MoreHorizontal, Plus, ClipboardList, ArrowRight,
  CalendarDays, Users, MapPin, AlertCircle, Video, MessageSquare, Bell,
  Edit3, Trash2, Copy, ExternalLink, RefreshCw, Search, ChevronDown, Zap
} from 'lucide-react';
import { Appointment } from '../types';
import toast from 'react-hot-toast';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';

const CalendarPage: React.FC = () => {
  const { appointments, companies, staff, tests, addAppointment, updateAppointment, deleteAppointment, institution } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);

  // Filter States
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [companyFilter, setCompanyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Randevuyu Sil',
      message: `"${selectedAppointment.title}" operasyonunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      onConfirm: () => {
        deleteAppointment(selectedAppointment.id);
        setIsDetailModalOpen(false);
        toast.success('Randevu silindi!');
      }
    });
  };
  
  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Form States
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({ status: 'Planned', type: 'Screening' });
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Check for incoming navigation states
  useEffect(() => {
    if (location.state) {
      if (location.state.createFromProposal) {
        const proposal = location.state.createFromProposal;
        const testIds = proposal.items.map((i: any) => i.testId);
        
        setNewAppointment({
          companyId: proposal.companyId,
          title: `Sağlık Taraması (Teklif: ${proposal.id})`,
          type: 'Screening',
          status: 'Planned',
          date: new Date().toISOString()
        });
        setSelectedTests(testIds);
        setIsModalOpen(true);
      } else if (location.state.preselectedCompanyId) {
        const comp = companies.find(c => c.id === location.state.preselectedCompanyId);
        setNewAppointment(prev => ({
            ...prev,
            companyId: location.state.preselectedCompanyId,
            title: comp ? `${comp.name} - Sağlık Taraması` : '',
            date: new Date().toISOString()
        }));
        setIsModalOpen(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, companies]);

  // --- FILTER LOGIC ---
  const filteredAppointments = useMemo(() => {
      return appointments.filter(app => {
          const matchType = typeFilter === 'All' || app.type === typeFilter;
          const matchStatus = statusFilter === 'All' || app.status === statusFilter;
          const matchCompany = companyFilter === 'All' || app.companyId === companyFilter;
          const matchSearch = searchQuery === '' || 
            app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            companies.find(c => c.id === app.companyId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
          
          return matchType && matchStatus && matchCompany && matchSearch;
      });
  }, [appointments, typeFilter, statusFilter, companyFilter, searchQuery, companies]);

  // --- WEEK VIEW LOGIC ---
  const getWeekDays = useCallback(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate]);

  const weekDays = getWeekDays();

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newDate: Date) => {
    e.preventDefault();
    if (draggedAppointment) {
      const updatedAppointment = {
        ...draggedAppointment,
        date: newDate.toISOString()
      };
      updateAppointment(updatedAppointment);
      toast.success('Randevu tarihi güncellendi!');
      setDraggedAppointment(null);
    }
  };

  // --- CALENDAR GRID LOGIC ---
  const getCalendarGrid = (): Array<{day: number | null, date: Date | null, apps: Appointment[]}> => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon start

      const grid: Array<{day: number | null, date: Date | null, apps: Appointment[]}> = [];
      // Previous Month Fillers
      for(let i=0; i<startOffset; i++) grid.push({ day: null, date: null, apps: [] });
      
      // Current Month Days
      for(let i=1; i<=daysInMonth; i++) {
          const date = new Date(year, month, i);
          const dayApps = filteredAppointments.filter(a => {
              const d = new Date(a.date);
              return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
          });
          grid.push({ day: i, date: date, apps: dayApps });
      }

      // Next Month Fillers to complete 35 or 42 grid
      while(grid.length % 7 !== 0) grid.push({ day: null, date: null, apps: [] });

      return grid;
  };

  const calendarGrid = getCalendarGrid();

  // --- HANDLERS ---

  const handleDateClick = (date: Date | null) => {
      if (date) {
          // Set time to 09:00 local
          const newDate = new Date(date);
          newDate.setHours(9, 0, 0, 0);
          // Adjust for timezone offset for input[type="datetime-local"]
          const offset = newDate.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(newDate.getTime() - offset)).toISOString().slice(0, 16);

          setNewAppointment({ 
              status: 'Planned', 
              type: 'Screening',
              date: localISOTime
          });
          setSelectedStaff([]);
          setSelectedTests([]);
          setIsModalOpen(true);
      }
  };

  const handleQuickAdd = (template: any) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const appointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: companies[0]?.id || '',
      title: template.title,
      date: tomorrow.toISOString(),
      type: template.type,
      status: 'Planned',
      staffIds: [],
      testIds: template.type === 'Screening' ? tests.slice(0, 3).map(t => t.id) : []
    };
    addAppointment(appointment);
    toast.success('Randevu hızlıca eklendi!');
  };

  const handleSave = () => {
    if (newAppointment.title && newAppointment.companyId && newAppointment.date) {
      const appointment: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: newAppointment.companyId,
        title: newAppointment.title || '',
        date: new Date(newAppointment.date).toISOString(),
        type: newAppointment.type as any,
        status: 'Planned',
        staffIds: selectedStaff,
        testIds: selectedTests
      };
      addAppointment(appointment);
      setIsModalOpen(false);
      toast.success('Randevu başarıyla oluşturuldu!');
    } else {
      toast.error('Lütfen zorunlu alanları doldurun.');
    }
  };

  const getTypeStyles = (type: string) => {
      switch(type) {
          case 'Screening': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: <Truck size={12} />, label: 'Mobil Tarama' };
          case 'Consultation': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: <Stethoscope size={12} />, label: 'Yerinde Hizmet' };
          case 'Training': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: <Users size={12} />, label: 'Eğitim' };
          case 'Vehicle': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: <Truck size={12} />, label: 'Araç Bakım' };
          default: return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', icon: <CalendarIcon size={12} />, label: 'Diğer' };
      }
  };

  const getMonthlyStats = () => {
      const currentMonthApps = appointments.filter(a => new Date(a.date).getMonth() === currentDate.getMonth());
      return {
          total: currentMonthApps.length,
          completed: currentMonthApps.filter(a => a.status === 'Completed').length,
          screening: currentMonthApps.filter(a => a.type === 'Screening').length
      };
  };

  const monthlyStats = getMonthlyStats();

  return (
    <div className="space-y-8 animate-fade-in-up flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 order-3 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Operasyon Takvimi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Mobil sağlık taramaları, eğitimler ve yerinde hizmet planlaması.</p>
        </div>
          
          {/* Quick Stats for Current Month */}
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400"><CalendarIcon size={18} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Bu Ay</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{monthlyStats.total} <span className="text-xs font-normal text-slate-400">İş</span></p>
                </div>
            </div>
            <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400"><Check size={18} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Tamamlanan</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{monthlyStats.completed}</p>
                </div>
            </div>
        </div>

      <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" icon={<ClipboardList size={18} />} onClick={() => navigate('/screenings')}>Taramalar</Button>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => { setIsModalOpen(true); setNewAppointment({ status: 'Planned', type: 'Screening', date: new Date().toISOString() }); }}>Yeni Ekle</Button>
        </div>
      </div>

      {/* 1. CALENDAR VIEW - Always on Top */}
      {viewMode === 'month' ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden order-1 flex-1 min-h-0">
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day, idx) => (
                      <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{day.slice(0, 3)}</span>
                      </div>
                  ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[1fr] h-full bg-slate-50 dark:bg-slate-900">
                  {calendarGrid.map((cell, idx) => {
                      const isToday = cell.date && cell.date.getDate() === new Date().getDate() && cell.date.getMonth() === new Date().getMonth();
                      
                      return (
                        <div 
                            key={idx} 
                            onClick={() => handleDateClick(cell.date)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, cell.date || new Date())}
                            className={`
                                border-b border-r border-slate-200 dark:border-slate-700 p-2 relative transition-all group hover:bg-slate-50 dark:hover:bg-slate-800/80
                                ${!cell.day ? 'bg-slate-100/50 dark:bg-slate-950/50 pointer-events-none' : 'bg-white dark:bg-slate-800 cursor-pointer'}
                            `}
                        >
                            {cell.day && (
                                <>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                                            ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-700 dark:text-slate-300'}
                                        `}>
                                            {cell.day}
                                        </span>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-500 transition-all">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-1.5 overflow-hidden">
                                        {cell.apps.slice(0, 3).map(app => {
                                            const styles = getTypeStyles(app.type);
                                            return (
                                                <div 
                                                    key={app.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, app)}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsDetailModalOpen(true); }}
                                                    className={`
                                                        px-2 py-1 rounded-md border text-[10px] font-medium truncate flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02] cursor-move
                                                        ${styles.bg} ${styles.text} ${styles.border}
                                                        ${app.status === 'Cancelled' ? 'opacity-50 line-through decoration-slate-500' : ''}
                                                    `}
                                                    title={`${app.title} (${new Date(app.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})})`}
                                                >
                                                    {styles.icon}
                                                    <span className="truncate">{companies.find(c => c.id === app.companyId)?.name}</span>
                                                </div>
                                            );
                                        })}
                                        {cell.apps.length > 3 && (
                                            <div className="text-[10px] font-bold text-slate-400 text-center hover:text-blue-500">
                                                +{cell.apps.length - 3} daha...
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                      );
                  })}
              </div>
          </div>
      ) : viewMode === 'week' ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden order-1 flex-1 min-h-0">
              <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400">Saat</div>
                  {weekDays.map(day => (
                      <div key={day.toString()} className="py-3 text-center">
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {format(day, 'EEE', { locale: tr })}
                          </div>
                          <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                              {format(day, 'd')}
                          </div>
                      </div>
                  ))}
              </div>
              <div className="relative overflow-y-auto h-full">
                  {Array.from({ length: 14 }, (_, i) => i + 6).map(hour => (
                      <div key={hour} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800">
                          <div className="p-2 text-xs text-slate-400 text-right">
                              {hour}:00
                          </div>
                          {weekDays.map(day => {
                              const hourAppointments = filteredAppointments.filter(app => {
                                  const appDate = new Date(app.date);
                                  return isSameDay(appDate, day) && appDate.getHours() === hour;
                              });

                              return (
                                  <div 
                                      key={day.toString() + hour}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => {
                                          const newDate = new Date(day);
                                          newDate.setHours(hour, 0, 0, 0);
                                          handleDrop(e, newDate);
                                      }}
                                      className="border-l border-slate-100 dark:border-slate-800 p-1 min-h-[60px] hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                      onClick={() => {
                                          const newDate = new Date(day);
                                          newDate.setHours(hour, 0, 0, 0);
                                          handleDateClick(newDate);
                                      }}
                                  >
                                      {hourAppointments.map(app => {
                                          const styles = getTypeStyles(app.type);
                                          return (
                                              <div
                                                  key={app.id}
                                                  draggable
                                                  onDragStart={(e) => handleDragStart(e, app)}
                                                  onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsDetailModalOpen(true); }}
                                                  className={`
                                                      mb-1 p-1 rounded text-xs cursor-move
                                                      ${styles.bg} ${styles.text}
                                                  `}
                                              >
                                                  <div className="font-medium truncate">{app.title}</div>
                                                  <div className="opacity-75">
                                                      {companies.find(c => c.id === app.companyId)?.name}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              );
                          })}
                      </div>
                  ))}
              </div>
          </div>
      ) : (
          <div className="space-y-6 order-1 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {/* Grouped List View */}
              {Object.entries(
                filteredAppointments.reduce((groups: Record<string, Appointment[]>, app: Appointment) => {
                  const dateKey = new Date(app.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(app);
                  return groups;
                }, {} as Record<string, Appointment[]>)
              )
              .sort((a, b) => new Date(a[1][0].date).getTime() - new Date(b[1][0].date).getTime())
              .map(([dateLabel, apps]: [string, Appointment[]]) => (
                  <div key={dateLabel}>
                      <div className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur py-2 mb-3 flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200">{dateLabel}</h3>
                          <div className="h-px flex-1 bg-slate-200 dark:border-slate-800"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {apps.map(app => {
                              const company = companies.find(c => c.id === app.companyId);
                              const styles = getTypeStyles(app.type);
                              return (
                                  <div 
                                      key={app.id}
                                      onClick={() => { setSelectedAppointment(app); setIsDetailModalOpen(true); }}
                                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:border-blue-300 dark:hover:border-blue-600"
                                  >
                                      <div className="flex justify-between items-start mb-3">
                                          <div className={`p-2 rounded-xl ${styles.bg} ${styles.text}`}>
                                              {styles.icon}
                                          </div>
                                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                              app.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' :
                                              app.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                              'bg-slate-50 text-slate-600 border-slate-100'
                                          }`}>
                                              {app.status === 'Planned' ? 'Planlandı' : app.status === 'Completed' ? 'Tamamlandı' : 'İptal'}
                                          </div>
                                      </div>
                                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{app.title}</h4>
                                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                                          <Building2 size={14} /> {company?.name}
                                      </p>
                                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                          <div className="flex items-center gap-1">
                                              <Clock size={14} />
                                              {new Date(app.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <User size={14} />
                                              {app.staffIds.length} Personel
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
              {filteredAppointments.length === 0 && (
                  <div className="text-center py-20 text-slate-400">
                      <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Bu kriterlere uygun operasyon bulunamadı.</p>
                  </div>
              )}
          </div>
      )}

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 order-2 shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shadow-sm"><ChevronLeft size={18} /></button>
              <div className="px-4 min-w-[140px] text-center font-bold text-slate-800 dark:text-white capitalize">
                  {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shadow-sm"><ChevronRight size={18} /></button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full px-2">
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-600 pr-3 mr-1">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">Filtre:</span>
              </div>
              
              <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                      type="text"
                      placeholder="Randevu ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 lg:w-auto"
                  />
              </div>
              
              <select 
                  className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:text-blue-600"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
              >
                  <option value="All">Tüm Türler</option>
                  <option value="Screening">Mobil Tarama</option>
                  <option value="Consultation">Poliklinik</option>
              </select>

              <select 
                  className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:text-blue-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              >
                  <option value="All">Tüm Durumlar</option>
                  <option value="Planned">Planlanan</option>
                  <option value="Completed">Tamamlanan</option>
                  <option value="Cancelled">İptal</option>
              </select>

              <select 
                  className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:text-blue-600"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
              >
                  <option value="All">Tüm Firmalar</option>
                  {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
              </select>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
               <button 
                  onClick={() => setViewMode('month')} 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
               >
                  <Grid3X3 size={18} />
               </button>
               <button 
                  onClick={() => setViewMode('week')} 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
               >
                  <CalendarDays size={18} />
               </button>
               <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
               >
                  <List size={18} />
               </button>
          </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Operasyon Planla"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>Oluştur</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Operasyon Başlığı</label>
            <input 
              name="title" 
              className="input" 
              placeholder="Örn: X Firması Mobil Tarama" 
              value={newAppointment.title || ''} 
              onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Firma</label>
              <div className="relative">
                <select 
                    name="companyId" 
                    className="input appearance-none dark:bg-slate-900" 
                    value={newAppointment.companyId || ''} 
                    onChange={(e) => setNewAppointment({...newAppointment, companyId: e.target.value})} 
                >
                    <option value="">Firma Seçiniz...</option>
                    {companies.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
              </div>
            </div>
            <div>
              <label className="label">Hizmet Tipi</label>
              <div className="relative">
                <select 
                    name="type" 
                    className="input appearance-none dark:bg-slate-900" 
                    value={newAppointment.type} 
                    onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value as any})} 
                >
                    <option value="Screening">Mobil Tarama</option>
                    <option value="Consultation">Yerinde Hizmet</option>
                    <option value="Training">Eğitim</option>
                    <option value="Vehicle">Araç Bakım</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Tarih ve Saat</label>
            <input 
              name="date" 
              type="datetime-local"
              className="input dark:[color-scheme:dark]" 
              value={newAppointment.date || ''} 
              onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="border rounded-xl p-3 max-h-48 overflow-y-auto dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Personel Seçimi</label>
                 {staff.map(s => (
                     <div key={s.id} onClick={() => {
                         setSelectedStaff(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])
                     }} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedStaff.includes(s.id) ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                         <div className={`w-3 h-3 rounded-full border ${selectedStaff.includes(s.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-400'}`}></div>
                         <span className="text-xs truncate">{s.name}</span>
                     </div>
                 ))}
             </div>
             {newAppointment.type === 'Screening' && (
                 <div className="border rounded-xl p-3 max-h-48 overflow-y-auto dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Test Seçimi</label>
                     {tests.map(t => (
                         <div key={t.id} onClick={() => {
                             setSelectedTests(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])
                         }} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedTests.includes(t.id) ? 'bg-purple-100 dark:bg-purple-900/30' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                             <div className={`w-3 h-3 rounded-full border ${selectedTests.includes(t.id) ? 'bg-purple-500 border-purple-500' : 'border-slate-400'}`}></div>
                             <span className="text-xs truncate">{t.name}</span>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        </div>
      </Modal>

      {/* Quick Add Templates - At the Bottom */}
      <div className="order-4">
        <QuickAddTemplates onTemplateSelect={handleQuickAdd} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Operasyon Detayları"
        footer={
            <>
                <div className="flex-1">
                    <Button variant="danger" size="sm" onClick={handleDeleteAppointment}>Sil</Button>
                </div>
                {selectedAppointment && (
                    <Button variant="secondary" onClick={() => navigate(`/screenings/${selectedAppointment.id}`)}>Detay</Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Kapat</Button>
                {selectedAppointment && (
                    <Button icon={<Download size={16} />} onClick={() => {
                        const company = companies.find(c => c.id === selectedAppointment.companyId);
                        const assignedStaff = staff.filter(s => selectedAppointment.staffIds.includes(s.id));
                        const assignedTests = tests.filter(t => selectedAppointment.testIds?.includes(t.id));
                        if(company) generateAppointmentPDF(selectedAppointment, company, assignedStaff, assignedTests, institution);
                    }}>Görev Emri</Button>
                )}
            </>
        }
      >
        {selectedAppointment && (
            <div className="space-y-6">
                <div className="flex items-start justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{selectedAppointment.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                             <Building2 size={14} />
                             <span className="text-sm font-medium">
                                 {companies.find(c => c.id === selectedAppointment.companyId)?.name}
                             </span>
                        </div>
                    </div>
                    <div className="text-right">
                         <select
                             value={selectedAppointment.status}
                             onChange={(e) => {
                                 const newStatus = e.target.value as 'Planned' | 'Completed' | 'Cancelled';
                                 updateAppointment({ ...selectedAppointment, status: newStatus });
                                 setSelectedAppointment({ ...selectedAppointment, status: newStatus });
                                 toast.success('Durum güncellendi');
                             }}
                             className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer transition-colors ${
                                 selectedAppointment.status === 'Completed' 
                                     ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                     : selectedAppointment.status === 'Cancelled'
                                     ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                     : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                             }`}
                         >
                             <option value="Planned">Planlandı</option>
                             <option value="Completed">Tamamlandı</option>
                             <option value="Cancelled">İptal</option>
                         </select>
                         <div className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                             {new Date(selectedAppointment.date).toLocaleDateString('tr-TR')}
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Truck size={16} className="text-blue-500" /> Mobil Saha Ekibi
                        </h5>
                        <div className="space-y-2">
                             {staff.filter(s => selectedAppointment.staffIds.includes(s.id)).map(s => (
                                 <div key={s.id} className="text-sm p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm flex items-center justify-between">
                                     <span className="text-slate-700 dark:text-slate-200">{s.name}</span>
                                     <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 rounded text-slate-500 dark:text-slate-300">{s.role}</span>
                                 </div>
                             ))}
                             {staff.filter(s => selectedAppointment.staffIds.includes(s.id)).length === 0 && (
                                 <p className="text-sm text-slate-400 italic">Personel atanmamış.</p>
                             )}
                        </div>
                    </div>

                    <div>
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <FlaskConical size={16} className="text-green-500" /> Yapılacak Taramalar
                        </h5>
                        <div className="space-y-2">
                             {tests.filter(t => selectedAppointment.testIds?.includes(t.id)).map(t => (
                                 <div key={t.id} className="text-sm p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm flex items-center justify-between">
                                     <span className="text-slate-700 dark:text-slate-200 truncate mr-2">{t.name}</span>
                                 </div>
                             ))}
                             {(!selectedAppointment.testIds || selectedAppointment.testIds.length === 0) && (
                                 <p className="text-sm text-slate-400 italic">Test seçilmemiş.</p>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
      />
    </div>
  );
};

export default CalendarPage;
