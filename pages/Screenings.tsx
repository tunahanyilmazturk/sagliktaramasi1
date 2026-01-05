
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';
import { 
  ClipboardList, CheckCircle, Clock, Activity, Calendar, FileText, CheckCircle2, TrendingUp,
  Plus, Edit, Trash2, Users, FlaskConical, Search, LayoutGrid, List, Building2,
  Filter, MoreHorizontal, ChevronRight, Share2, Printer, Eye
} from 'lucide-react';
import { Appointment } from '../types';
import toast from 'react-hot-toast';

// Local Stats Card - Compact Design
const StatsCard = ({ title, value, icon: Icon, description, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
    <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0`}>
      <Icon size={18} className={colorClass.split(' ')[1].replace('bg-', 'text-')} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">{title}</p>
        {description && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 shrink-0">{description}</span>}
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-0.5">{value}</h3>
    </div>
  </div>
);

const Screenings: React.FC = () => {
  const navigate = useNavigate();
  const { appointments, companies, staff, tests, deleteAppointment, updateAppointment } = useData();
  const [filterStatus, setFilterStatus] = useState<'All' | 'Planned' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default table
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('All');
  const [selectedScreeningIds, setSelectedScreeningIds] = useState<string[]>([]);
  const [quickViewScreening, setQuickViewScreening] = useState<Appointment | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // Filter only screening type appointments
  const screenings = appointments.filter(app => app.type === 'Screening');

  const filteredScreenings = useMemo(() => {
      return screenings.filter(s => {
          const companyName = companies.find(c => c.id === s.companyId)?.name.toLowerCase() || '';
          const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              companyName.includes(searchQuery.toLowerCase());
          
          const matchStatus = filterStatus === 'All' || s.status === filterStatus;
          
          const screeningDate = new Date(s.date);
          const matchMonth = selectedMonth === -1 || screeningDate.getMonth() === selectedMonth;
          
          const matchStaff = selectedStaffId === 'All' || s.staffIds.includes(selectedStaffId);

          return matchSearch && matchStatus && matchMonth && matchStaff;
      });
  }, [screenings, filterStatus, searchQuery, companies, selectedMonth, selectedStaffId]);

  // Pagination Logic
  const paginatedScreenings = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredScreenings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredScreenings, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const total = screenings.length;
    const completed = screenings.filter(s => s.status === 'Completed').length;
    const planned = screenings.filter(s => s.status === 'Planned').length;
    const totalStaff = screenings.reduce((acc, curr) => acc + (curr.staffIds?.length || 0), 0);
    const avgStaff = total > 0 ? (totalStaff / total).toFixed(1) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, planned, avgStaff, completionRate };
  }, [screenings]);

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmModal({
        isOpen: true,
        id,
        title
      });
  };

  const toggleSelectAll = () => {
    if (selectedScreeningIds.length === paginatedScreenings.length) {
      setSelectedScreeningIds([]);
    } else {
      setSelectedScreeningIds(paginatedScreenings.map(s => s.id));
    }
  };

  const toggleSelectScreening = (id: string) => {
    setSelectedScreeningIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedScreeningIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      id: 'bulk',
      title: 'Toplu Silme'
    });
  };

  const confirmDelete = () => {
    if (confirmModal.id === 'bulk') {
      selectedScreeningIds.forEach(id => deleteAppointment(id));
      setSelectedScreeningIds([]);
    } else {
      deleteAppointment(confirmModal.id);
    }
    setConfirmModal({ isOpen: false, id: '', title: '' });
    toast.success('İşlem başarıyla tamamlandı.');
  };

  const handleQuickView = (app: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewScreening(app);
    setIsQuickViewOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Sağlık Taramaları</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Operasyonel tarama planlama ve takip listesi.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" icon={<Calendar size={18} />} onClick={() => navigate('/calendar')}>Takvim</Button>
            <Button icon={<Plus size={18} />} onClick={() => navigate('/screenings/create')}>Yeni Tarama Planla</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
             title="Toplam Plan" 
             value={stats.total} 
             icon={ClipboardList} 
             description="Tüm Operasyonlar"
             colorClass="bg-blue-500 text-blue-500"
          />
          <StatsCard 
             title="Tamamlanma Oranı" 
             value={`%${stats.completionRate}`} 
             icon={TrendingUp} 
             description="Genel Performans"
             colorClass="bg-green-500 text-green-500"
          />
          <StatsCard 
             title="Gelecek Plan" 
             value={stats.planned} 
             icon={Calendar} 
             description="Bekleyen İşler"
             colorClass="bg-amber-500 text-amber-500"
          />
          <StatsCard 
             title="Ort. Ekip Büyüklüğü" 
             value={stats.avgStaff} 
             icon={Users} 
             description="Personel / Tarama"
             colorClass="bg-violet-500 text-violet-500"
          />
      </div>

            {/* Filter & Toolbar */}
            <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                        {selectedScreeningIds.length > 0 ? (
                            <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-left-2">
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{selectedScreeningIds.length} Seçili</span>
                                <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={handleBulkDelete}>Toplu Sil</Button>
                                <button onClick={() => setSelectedScreeningIds([])} className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">İptal</button>
                            </div>
                        ) : (
                            <div className="relative w-full sm:w-80 group">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    placeholder="Firma veya tarama ara..."
                                    className="pl-10 input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm group-focus-within:ring-2 ring-blue-100 dark:ring-blue-900/50"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 px-2 border-r border-slate-200 dark:border-slate-700">
                                <Filter className="w-3 h-3" />
                                <span className="uppercase tracking-widest">Filtreler</span>
                            </div>
                            
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setCurrentPage(1); }}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 ring-blue-100 outline-none"
                            >
                                <option value={-1}>Tüm Aylar</option>
                                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>

                            <select 
                                value={selectedStaffId} 
                                onChange={(e) => { setSelectedStaffId(e.target.value); setCurrentPage(1); }}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 ring-blue-100 outline-none max-w-[150px]"
                            >
                                <option value="All">Tüm Personel</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {['All', 'Planned', 'Completed'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setFilterStatus(s as any); setCurrentPage(1); }}
                                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all ${filterStatus === s ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {s === 'All' ? 'Tümü' : s === 'Planned' ? 'Planlanan' : 'Biten'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end xl:self-auto">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}
                            >
                                <List size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="py-4 px-6 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={paginatedScreenings.length > 0 && selectedScreeningIds.length === paginatedScreenings.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Tarama Detayı</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Müşteri / Firma</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Tarih & Saat</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Durum</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Kaynaklar</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-right">İşlemler</th>
                </tr>
                </thead>
                <tbody>
                {paginatedScreenings.map(item => {
                    const company = companies.find(c => c.id === item.companyId);
                    const testCount = item.testIds?.length || 0;
                    const staffCount = item.staffIds.length;
                    const equipCount = item.equipmentIds?.length || 0;
                    
                    return (
                                    <tr 
                                        key={item.id} 
                                        onClick={() => navigate(`/screenings/${item.id}`)}
                                        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group cursor-pointer ${selectedScreeningIds.includes(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedScreeningIds.includes(item.id)}
                                                onChange={() => toggleSelectScreening(item.id)}
                                            />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</div>
                                                <button 
                                                    onClick={(e) => handleQuickView(item, e)}
                                                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Hızlı Bakış"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">ID: {item.id}</div>
                                        </td>
                        <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                    <Building2 size={14} />
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{company?.name}</span>
                            </div>
                        </td>
                        <td className="py-4 px-6">
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(item.date).toLocaleDateString('tr-TR')}</div>
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <Clock size={10} />
                                {item.startTime || new Date(item.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - {item.endTime || '-'}
                                {item.durationMinutes && (
                                    <span className="text-blue-600 dark:text-blue-400 ml-1">({Math.floor(item.durationMinutes / 60)}sa {item.durationMinutes % 60}dk)</span>
                                )}
                            </div>
                        </td>
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <select
                                value={item.status}
                                onChange={(e) => {
                                    const newStatus = e.target.value as 'Planned' | 'Completed' | 'Cancelled';
                                    updateAppointment({ ...item, status: newStatus });
                                    toast.success('Durum güncellendi');
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border-none outline-none cursor-pointer transition-colors ${
                                    item.status === 'Completed' ? 'bg-green-500 text-white' :
                                    item.status === 'Cancelled' ? 'bg-red-500 text-white' :
                                    'bg-amber-500 text-white'
                                }`}
                            >
                                <option value="Planned">Planlandı</option>
                                <option value="Completed">Tamamlandı</option>
                                <option value="Cancelled">İptal</option>
                            </select>
                        </td>
                        <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center gap-0.5" title={`${testCount} Test`}>
                                    <FlaskConical size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{testCount}</span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5" title={`${staffCount} Personel`}>
                                    <Users size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{staffCount}</span>
                                </div>
                            </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/screenings/${item.id}`);
                                    }}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                                <button onClick={(e) => handleDelete(item.id, item.title, e)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    );
                })}
                {filteredScreenings.length === 0 && (
                    <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <FileText size={32} className="mx-auto mb-2 opacity-20" />
                        <p>Görüntülenecek tarama bulunamadı.</p>
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedScreenings.map(item => {
                const company = companies.find(c => c.id === item.companyId);
                return (
                    <div 
                        key={item.id} 
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group relative cursor-pointer"
                        onClick={() => navigate(`/screenings/${item.id}`)}
                    >
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1" title={item.title}>{item.title}</h3>
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value as 'Planned' | 'Completed' | 'Cancelled';
                                                        updateAppointment({ ...item, status: newStatus });
                                                        toast.success('Durum güncellendi');
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border-none outline-none cursor-pointer transition-colors ${
                                                        item.status === 'Completed' ? 'bg-green-500 text-white' :
                                                        item.status === 'Planned' ? 'bg-amber-500 text-white' :
                                                        'bg-red-500 text-white'
                                                    }`}
                                                >
                                                    <option value="Planned">Planlandı</option>
                                                    <option value="Completed">Tamamlandı</option>
                                                    <option value="Cancelled">İptal</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3">
                                                <Building2 size={14} />
                                                {company?.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                                <Calendar size={10} /> Tarih & Saat
                                            </p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                {new Date(item.date).toLocaleDateString('tr-TR')}
                                            </p>
                                            <p className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1">
                                                {item.startTime || new Date(item.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - {item.endTime || '-'}
                                                {item.durationMinutes && (
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold">({Math.floor(item.durationMinutes / 60)}s {item.durationMinutes % 60}d)</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                                <Users size={10} /> Ekip & Kaynak
                                            </p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                {item.staffIds.length} Personel
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {item.testIds?.length || 0} Farklı Test
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            {item.staffIds.slice(0, 3).map((_, i) => (
                                                <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    P{i+1}
                                                </div>
                                            ))}
                                            {item.staffIds.length > 3 && (
                                                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                    +{item.staffIds.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/screenings/${item.id}`);
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(item.id, item.title, e)} 
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                    </div>
                );
            })}
        </div>
      )}

      <Pagination
        totalItems={filteredScreenings.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, id: '', title: '' })}
                onConfirm={confirmDelete}
                title={confirmModal.id === 'bulk' ? 'Toplu Silme' : 'Taramayı Sil'}
                message={confirmModal.id === 'bulk' ? `${selectedScreeningIds.length} adet tarama planını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : `"${confirmModal.title}" başlıklı tarama planını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                confirmText={confirmModal.id === 'bulk' ? 'Seçilenleri Sil' : 'Taramayı Sil'}
                variant="danger"
            />

            {/* Quick View Modal */}
            <Modal
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                title="Tarama Özeti"
                size="lg"
            >
                {quickViewScreening && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{quickViewScreening.title}</h3>
                                <p className="text-sm text-slate-500 font-medium">{companies.find(c => c.id === quickViewScreening.companyId)?.name}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                quickViewScreening.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                quickViewScreening.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                            }`}>
                                {quickViewScreening.status === 'Completed' ? 'Tamamlandı' : quickViewScreening.status === 'Cancelled' ? 'İptal' : 'Planlandı'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Zamanlama</p>
                                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                        <Calendar size={16} className="text-blue-500" />
                                        <span className="text-sm font-medium">{new Date(quickViewScreening.date).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 mt-2">
                                        <Clock size={16} className="text-blue-500" />
                                        <span className="text-sm font-medium">{quickViewScreening.startTime} - {quickViewScreening.endTime}</span>
                                        {quickViewScreening.durationMinutes && (
                                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded font-bold">
                                                {Math.floor(quickViewScreening.durationMinutes / 60)}s {quickViewScreening.durationMinutes % 60}d
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Görevli Ekip ({quickViewScreening.staffIds.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {quickViewScreening.staffIds.map(id => {
                                            const person = staff.find(s => s.id === id);
                                            return person ? (
                                                <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                        {person.name.charAt(0)}
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{person.name}</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kapsamdaki Testler ({quickViewScreening.testIds?.length || 0})</p>
                                    <div className="space-y-1.5">
                                        {quickViewScreening.testIds?.slice(0, 5).map(id => {
                                            const test = tests.find(t => t.id === id);
                                            return test ? (
                                                <div key={id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <FlaskConical size={12} className="text-purple-500" />
                                                    <span>{test.name}</span>
                                                </div>
                                            ) : null;
                                        })}
                                        {(quickViewScreening.testIds?.length || 0) > 5 && (
                                            <p className="text-[10px] text-slate-400 italic pl-5">ve {(quickViewScreening.testIds?.length || 0) - 5} test daha...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <Button variant="outline" onClick={() => setIsQuickViewOpen(false)}>Kapat</Button>
                            <Button variant="primary" onClick={() => {
                                setIsQuickViewOpen(false);
                                navigate(`/screenings/${quickViewScreening.id}`);
                            }}>Detaya Git</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Screenings;
