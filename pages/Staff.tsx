
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';
import {
  Plus, UserRound, Stethoscope, Briefcase, Pencil, Trash2, Search, Filter,
  ChevronRight, LayoutGrid, List, Mail, Phone, CheckCircle2, Users, Award, ShieldCheck,
  Microscope, Activity, Zap, Download, FileSpreadsheet, FileText, MoreHorizontal, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Staff as StaffType } from '../types';
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

type ViewMode = 'grid' | 'list';

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const { staff, appointments, addStaff, updateStaff, deleteStaff, definitions } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffType>>({ role: 'Doctor' });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const predefinedTitles = [
    "Doktor",
    "İş Yeri Hekimi",
    "Hemşire",
    "Laborant",
    "Radyoloji Teknikeri",
    "Odyometrist",
    "DSP (Diğer Sağlık Personeli)",
    "İş Güvenliği Uzmanı",
    "Saha Destek Personeli",
    "Laboratuvar Teknikeri",
    "Mobil Araç Sorumlusu"
  ];

  const handleExportExcel = () => {
    const exportData = filteredStaff.map(person => ({
      'Ad Soyad': person.name,
      'Ünvan': person.title,
      'Rol': definitions?.staffRoles?.find(r => r.code === person.role)?.label || person.role,
      'Telefon': person.phone,
      'E-posta': person.email || '-',
      'Durum': person.status === 'Active' ? 'Aktif' : person.status === 'OnLeave' ? 'İzinli' : 'Pasif',
      'Kan Grubu': person.bloodType || '-',
      'Başlangıç Tarihi': person.startDate ? new Date(person.startDate).toLocaleDateString('tr-TR') : '-',
      'Yetenekler': person.skills?.join(', ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personel Listesi");
    XLSX.writeFile(wb, `Personel_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Personel listesi Excel olarak indirildi.');
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesRole = roleFilter === 'All';
      if (!matchesRole) {
        if (roleFilter === 'Doctor') matchesRole = person.role === 'Doctor';
        else if (roleFilter === 'Nurse') matchesRole = person.role === 'Nurse';
        else if (roleFilter === 'Lab') matchesRole = person.role === 'Lab';
        else if (roleFilter === 'Safety') matchesRole = person.title.toLowerCase().includes('güvenlik') || person.title.toLowerCase().includes('uzman');
      }
      
      return matchesSearch && matchesRole;
    });
  }, [staff, searchQuery, roleFilter]);

  // Pagination Logic
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    return {
      total: staff.length,
      doctors: staff.filter(s => s.role === 'Doctor').length,
      nurses: staff.filter(s => s.role === 'Nurse').length,
      technical: staff.filter(s => ['Lab', 'Audio', 'Radiology'].includes(s.role)).length
    }
  }, [staff]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (person?: StaffType) => {
    setModalStep(1);
    if (person) {
      setEditingStaff({ ...person });
      setIsCustomTitle(!predefinedTitles.includes(person.title));
    } else {
      setEditingStaff({ 
        role: 'Staff',
        status: 'Active',
        startDate: new Date().toISOString()
      });
      setIsCustomTitle(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Basic Validation
    if (!editingStaff.name?.trim()) {
      toast.error('Lütfen isim soyisim giriniz.');
      setModalStep(1);
      return;
    }
    if (!editingStaff.phone?.trim()) {
      toast.error('Lütfen telefon numarası giriniz.');
      setModalStep(1);
      return;
    }
    if (!editingStaff.title?.trim()) {
      toast.error('Lütfen ünvan seçiniz veya giriniz.');
      setModalStep(1);
      return;
    }

    // Map title to role automatically
    const title = editingStaff.title || '';
    let autoRole: any = 'Staff';
    if (title.includes('Doktor') || title.includes('Hekim')) autoRole = 'Doctor';
    else if (title.includes('Hemşire')) autoRole = 'Nurse';
    else if (title.includes('Laborant')) autoRole = 'Lab';
    else if (title.includes('Odyometrist')) autoRole = 'Audio';
    else if (title.includes('Radyoloji')) autoRole = 'Radiology';

    if (editingStaff.id) {
      updateStaff({ ...editingStaff, role: autoRole } as StaffType);
      toast.success('Personel bilgileri güncellendi.');
    } else {
      const person: StaffType = {
        id: Math.random().toString(36).substr(2, 9),
        name: editingStaff.name || '',
        title: title,
        role: autoRole,
        phone: editingStaff.phone!,
        email: editingStaff.email,
        status: editingStaff.status || 'Active',
        bloodType: editingStaff.bloodType,
        skills: editingStaff.skills || [],
        startDate: editingStaff.startDate || new Date().toISOString()
      };
      addStaff(person);
      toast.success('Yeni personel başarıyla eklendi.');
    }
    setIsModalOpen(false);
    setEditingStaff({ role: 'Doctor' });
    setModalStep(1);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      id,
      name
    });
  };

  const confirmDelete = () => {
    deleteStaff(confirmModal.id);
    toast.success('Personel silindi.');
    setConfirmModal({ isOpen: false, id: '', name: '' });
  };

  const getRoleBadge = (role: string, title: string) => {
    // Icons and colors based on the auto-assigned role or keywords in title
    const lowerTitle = title.toLowerCase();
    
    if (role === 'Doctor' || lowerTitle.includes('doktor') || lowerTitle.includes('hekim')) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded-full dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"><Stethoscope size={12} /> {title}</span>;
    }
    if (role === 'Nurse' || lowerTitle.includes('hemşire') || lowerTitle.includes('dsp')) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-pink-50 text-pink-700 border border-pink-100 text-[10px] font-bold rounded-full dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800"><UserRound size={12} /> {title}</span>;
    }
    if (role === 'Lab' || lowerTitle.includes('laborant') || lowerTitle.includes('laboratuvar')) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold rounded-full dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"><Microscope size={12} /> {title}</span>;
    }
    if (role === 'Audio' || lowerTitle.includes('odyometrist')) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold rounded-full dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"><Activity size={12} /> {title}</span>;
    }
    if (role === 'Radiology' || lowerTitle.includes('radyoloji')) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded-full dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"><Zap size={12} /> {title}</span>;
    }
    if (lowerTitle.includes('uzman') || lowerTitle.includes('güvenlik')) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"><ShieldCheck size={12} /> {title}</span>;
    }
    
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 text-slate-700 border border-slate-100 text-[10px] font-bold rounded-full dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"><Briefcase size={12} /> {title}</span>;
  };

  const getStaffStats = (id: string) => {
    const personAppointments = appointments.filter(a => a.staffIds.includes(id));
    const total = personAppointments.length;
    const active = personAppointments.filter(a => a.status === 'Planned').length;
    const completed = personAppointments.filter(a => a.status === 'Completed').length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, active, completed, efficiency };
  };

  const getSkills = (person: StaffType) => {
    if (person.skills && person.skills.length > 0) return person.skills;
    switch (person.role) {
      case 'Doctor': return ['Muayene', 'Reçete', 'EKG Yorum'];
      case 'Nurse': return ['Kan Alma', 'Aşı', 'Pansuman'];
      case 'Lab': return ['Kan Analizi', 'Numune Alma'];
      case 'Audio': return ['Odyometri', 'SFT'];
      case 'Radiology': return ['Röntgen', 'Görüntüleme'];
      default: return ['Kayıt', 'Saha Destek', 'Sürücü'];
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Personel Yönetimi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">İnsan kaynakları ve saha ekibi planlaması.</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => handleOpenModal()}>Yeni Personel</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Personel"
          value={stats.total}
          icon={Users}
          description="Tüm Ekip"
          colorClass="bg-indigo-500 text-indigo-500"
        />
        <StatsCard
          title="Doktor"
          value={stats.doctors}
          icon={Stethoscope}
          description="Uzman Kadro"
          colorClass="bg-blue-500 text-blue-500"
        />
        <StatsCard
          title="Hemşire"
          value={stats.nurses}
          icon={UserRound}
          description="Sağlık Personeli"
          colorClass="bg-pink-500 text-pink-500"
        />
        <StatsCard
          title="Teknik Ekip"
          value={stats.technical}
          icon={ShieldCheck}
          description="Lab, Odyo, Radyo"
          colorClass="bg-emerald-500 text-emerald-500"
        />
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 p-2">
          <div className="relative w-full sm:w-80 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              placeholder="İsim veya unvan ara..."
              className="pl-10 input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm group-focus-within:ring-2 ring-blue-100 dark:ring-blue-900/50"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 px-2 border-r border-slate-200 dark:border-slate-700">
              <Filter className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Ünvan Grubu:</span>
            </div>
            <button
              key="All"
              onClick={() => { setRoleFilter('All'); setCurrentPage(1); }}
              className={`filter-pill ${roleFilter === 'All' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              Tümü
            </button>
            <button
              onClick={() => { setRoleFilter('Doctor'); setCurrentPage(1); }}
              className={`filter-pill ${roleFilter === 'Doctor' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              Hekimler
            </button>
            <button
              onClick={() => { setRoleFilter('Nurse'); setCurrentPage(1); }}
              className={`filter-pill ${roleFilter === 'Nurse' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              Sağlık Personeli
            </button>
            <button
              onClick={() => { setRoleFilter('Lab'); setCurrentPage(1); }}
              className={`filter-pill ${roleFilter === 'Lab' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              Laboratuvar
            </button>
            <button
              onClick={() => { setRoleFilter('Safety'); setCurrentPage(1); }}
              className={`filter-pill ${roleFilter === 'Safety' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              İş Güvenliği
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet size={16} />}
            onClick={handleExportExcel}
            className="hidden sm:flex"
          >
            Excel
          </Button>
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Placeholder Card */}
          <button
            onClick={() => handleOpenModal()}
            className="group flex flex-col items-center justify-center min-h-[280px] h-full rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300"
          >
            <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md flex items-center justify-center mb-4 transition-all group-hover:scale-110">
              <Plus size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500" />
            </div>
            <span className="text-lg font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Personel Ekle</span>
          </button>

          {paginatedStaff.map(person => {
            const stats = getStaffStats(person.id);
            return (
              <div
                key={person.id}
                className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-0 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
                onClick={() => navigate(`/staff/${person.id}`)}
              >
                {/* Top Accent Bar */}
                <div className={`h-1.5 w-full ${person.role === 'Doctor' ? 'bg-blue-500' :
                    person.role === 'Nurse' ? 'bg-pink-500' :
                      person.role === 'Lab' ? 'bg-purple-500' :
                        'bg-emerald-500'
                  }`}></div>

                <div className="p-5">
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 shadow-inner">
                        {person.role === 'Doctor' ? <Stethoscope size={28} /> :
                          person.role === 'Nurse' ? <UserRound size={28} /> :
                            person.role === 'Lab' ? <Microscope size={28} /> :
                              <Briefcase size={28} />}
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${stats.active > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(person) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={(e) => handleDelete(person.id, person.name, e)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verimlilik</span>
                        <p className={`text-xs font-black ${stats.efficiency > 80 ? 'text-green-500' : stats.efficiency > 50 ? 'text-blue-500' : 'text-amber-500'}`}>%{stats.efficiency}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{person.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">{person.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {getRoleBadge(person.role, person.title)}
                      {getSkills(person).slice(0, 2).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[9px] font-bold border border-slate-100 dark:border-slate-700 uppercase tracking-tighter">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact Quick View */}
                  <div className="flex items-center gap-4 mb-4 py-3 border-y border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Phone size={12} className="text-slate-400" />
                      {person.phone}
                    </div>
                    {person.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
                        <Mail size={12} className="text-slate-400" />
                        {person.email.split('@')[0]}...
                      </div>
                    )}
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Tamamlanan</span>
                        <span className="font-black text-slate-700 dark:text-slate-200">{stats.completed}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Aktif Görev</span>
                        <span className="font-black text-blue-600 dark:text-blue-400">{stats.active}</span>
                      </div>
                    </div>
                    <button className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Personel</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Rol</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">İletişim</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">İş Yükü</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStaff.map(person => {
                  const stats = getStaffStats(person.id);
                  return (
                    <tr
                      key={person.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/staff/${person.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                            {person.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{person.name}</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{person.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(person.role, person.title)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400 gap-1">
                          <span className="flex items-center gap-1"><Phone size={10} /> {person.phone}</span>
                          {person.email && <span className="flex items-center gap-1 text-slate-400"><Mail size={10} /> {person.email}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-400 font-medium">Aktif</span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.active}</span>
                          </div>
                          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-400 font-medium">Toplam</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.total}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Ara"><Phone size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(person) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><Pencil size={16} /></button>
                          <button onClick={(e) => handleDelete(person.id, person.name, e)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        totalItems={filteredStaff.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Personel Sil"
        message={`${confirmModal.name} isimli personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        variant="danger"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff.id ? "Personeli Düzenle" : "Yeni Personel Ekle"}
        footer={
          <div className="flex justify-between w-full">
            <div>
              {modalStep > 1 && (
                <Button variant="outline" onClick={() => setModalStep(prev => prev - 1)}>Geri</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
              {modalStep < 2 ? (
                <Button onClick={() => setModalStep(2)}>Devam Et</Button>
              ) : (
                <Button onClick={handleSave}>Kaydet</Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all ${modalStep === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>1</div>
            <div className="w-12 h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
              <div className={`h-full bg-blue-600 transition-all duration-500 ${modalStep >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all ${modalStep === 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>2</div>
          </div>

          {/* Staff ID Card Visual (Always visible) */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${editingStaff.role === 'Doctor' ? 'from-blue-900 to-slate-900' :
              editingStaff.role === 'Nurse' ? 'from-pink-900 to-slate-900' :
                editingStaff.role === 'Lab' ? 'from-purple-900 to-slate-900' :
                  'from-slate-800 to-slate-900'
            } rounded-3xl p-6 text-white shadow-xl border border-white/10`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex gap-6">
              <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                {editingStaff.role === 'Doctor' ? <Stethoscope size={40} className="text-blue-400" /> :
                  editingStaff.role === 'Nurse' ? <UserRound size={40} className="text-pink-400" /> :
                    editingStaff.role === 'Lab' ? <Microscope size={40} className="text-purple-400" /> :
                      <Briefcase size={40} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Personel Kartı</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold truncate leading-tight tracking-tight">
                  {editingStaff.name || 'Ad Soyad'}
                </h3>
                <p className="text-xs font-mono text-white/60 mt-1 uppercase tracking-wider">
                  {editingStaff.title || 'Ünvan Belirtilmedi'}
                </p>
                <div className="flex gap-2 mt-4">
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold border border-white/10 uppercase">
                    {editingStaff.role ? definitions?.staffRoles?.find(r => r.code === editingStaff.role)?.label : 'ROL SEÇİLMEDİ'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold border border-white/10 uppercase">
                    ID: {editingStaff.id ? editingStaff.id : 'YENİ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {modalStep === 1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                <UserRound size={18} />
                <h4 className="text-sm font-bold uppercase tracking-wider">Temel Bilgiler</h4>
              </div>
              
              <div>
                <label className="label">Ad Soyad</label>
                <input
                  name="name"
                  className="input"
                  placeholder="Dr. Ahmet Yılmaz"
                  value={editingStaff.name || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">Ünvan</label>
                  {!isCustomTitle ? (
                    <div className="relative">
                      <select
                        name="title"
                        className="input appearance-none dark:bg-slate-900"
                        value={editingStaff.title || ''}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM') {
                            setIsCustomTitle(true);
                            setEditingStaff(prev => ({ ...prev, title: '' }));
                          } else {
                            setEditingStaff(prev => ({ ...prev, title: e.target.value }));
                          }
                        }}
                      >
                        <option value="">Ünvan Seçiniz...</option>
                        {predefinedTitles.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="CUSTOM">+ Manuel Ekle...</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        name="title"
                        className="input pr-20"
                        placeholder="Örn: Tekniker"
                        value={editingStaff.title || ''}
                        onChange={handleInputChange}
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setIsCustomTitle(false);
                          setEditingStaff(prev => ({ ...prev, title: '' }));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md hover:bg-slate-200"
                      >
                        Listeye Dön
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Telefon <span className="text-red-500">*</span></label>
                  <input
                    name="phone"
                    className="input"
                    placeholder="05XX XXX XX XX"
                    value={editingStaff.phone || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="label">E-Posta (Opsiyonel)</label>
                  <input
                    name="email"
                    type="email"
                    className="input"
                    placeholder="ornek@hantech.com"
                    value={editingStaff.email || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                <Briefcase size={18} />
                <h4 className="text-sm font-bold uppercase tracking-wider">Ek Detaylar & Yetkinlikler</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Kan Grubu</label>
                  <select
                    name="bloodType"
                    className="input appearance-none dark:bg-slate-900"
                    value={editingStaff.bloodType || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz...</option>
                    <option value="A+">A Rh(+)</option>
                    <option value="A-">A Rh(-)</option>
                    <option value="B+">B Rh(+)</option>
                    <option value="B-">B Rh(-)</option>
                    <option value="AB+">AB Rh(+)</option>
                    <option value="AB-">AB Rh(-)</option>
                    <option value="0+">0 Rh(+)</option>
                    <option value="0-">0 Rh(-)</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
                <div>
                  <label className="label">Durum</label>
                  <select
                    name="status"
                    className="input appearance-none dark:bg-slate-900"
                    value={editingStaff.status || 'Active'}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Aktif</option>
                    <option value="OnLeave">İzinli</option>
                    <option value="Inactive">Pasif</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div>
                <label className="label">Yetenekler / Yetkinlikler</label>
                <div className="relative group">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    className="input pl-12"
                    placeholder="Örn: İlk Yardım, Sürücü Belgesi, EKG (Virgül ile ayırın)"
                    value={editingStaff.skills?.join(', ') || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, skills: e.target.value.split(',').map(s => s.trim()) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Başlangıç Tarihi</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    name="startDate"
                    type="date"
                    className="input pl-12"
                    value={editingStaff.startDate?.split('T')[0] || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Staff;
