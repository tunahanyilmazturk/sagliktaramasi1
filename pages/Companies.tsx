import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';
import { AdvancedFilter } from '../components/AdvancedFilter';
import { DataExporter } from '../utils/dataExport';
import { Plus, MoreHorizontal, Building2, Phone, Mail, MapPin, ArrowRight, Trash2, Edit, Download, Search, Filter, FileText, CalendarClock, TrendingUp, ChevronDown, LayoutGrid, List, HardHat, Truck, Scissors, Utensils, Briefcase, Calendar, Zap, Users, ArrowUpRight, Globe, Shield, Activity, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Company } from '../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema, CompanyFormData } from '../utils/schemas';

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

type SortOption = 'newest' | 'alphabetical';
type ViewMode = 'grid' | 'list';

const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { companies, proposals, appointments, addCompany, deleteCompany, exportToExcel } = useData();

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[] | undefined>>({});
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = () => {
    const exportData = filteredCompanies.map(c => ({
      'Firma Adı': c.name,
      'Yetkili Kişi': c.authorizedPerson,
      'E-posta': c.email,
      'Telefon': c.phone,
      'Vergi Bilgileri': c.taxInfo,
      'Sektör': c.sector || 'Genel',
      'Risk Seviyesi': c.riskLevel === 'Low' ? 'Düşük' : c.riskLevel === 'Medium' ? 'Orta' : c.riskLevel === 'High' ? 'Yüksek' : 'Kritik',
      'Adres': c.address,
      'Durum': c.status === 'Active' ? 'Aktif' : 'Pasif'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Firma Listesi");
    XLSX.writeFile(wb, `Firma_Portfoyu_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Firma listesi Excel olarak indirildi.');
  };

  // Form State with React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema)
  });

  // Filter options
  const filterOptions = [
    {
      key: 'sector',
      label: 'Sektör',
      icon: <Building2 size={16} />,
      type: 'select' as const,
      options: [
        { value: 'İnşaat', label: 'İnşaat' },
        { value: 'Lojistik', label: 'Lojistik' },
        { value: 'Üretim', label: 'Üretim' },
        { value: 'Gıda', label: 'Gıda' },
        { value: 'Teknoloji', label: 'Teknoloji' },
        { value: 'Diğer', label: 'Diğer' }
      ]
    },
    {
      key: 'status',
      label: 'Durum',
      icon: <CalendarClock size={16} />,
      type: 'select' as const,
      options: [
        { value: 'Active', label: 'Aktif' },
        { value: 'Inactive', label: 'Pasif' },
        { value: 'Pending', label: 'Beklemede' }
      ]
    },
    {
      key: 'riskLevel',
      label: 'Risk Seviyesi',
      icon: <TrendingUp size={16} />,
      type: 'select' as const,
      options: [
        { value: 'Low', label: 'Düşük' },
        { value: 'Medium', label: 'Orta' },
        { value: 'High', label: 'Yüksek' },
        { value: 'Critical', label: 'Kritik' }
      ]
    }
  ];

  // Filter & Sort Logic
  const filteredCompanies = useMemo(() => {
    let result = companies.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authorizedPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.taxInfo.includes(searchQuery)
    );

    // Apply active filters
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values && Array.isArray(values) && values.length > 0) {
        result = result.filter(company => {
          const companyValue = company[key as keyof Company];
          return companyValue && typeof companyValue === 'string' && values.includes(companyValue);
        });
      }
    });

    if (sortOption === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.reverse(); // Assuming original order is chronological
    }
    return result;
  }, [companies, searchQuery, sortOption, activeFilters]);

  // Pagination Logic
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCompanies, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const active = companies.length;
    const totalProposals = proposals.length;
    const pendingProposals = proposals.filter(p => p.status === 'Sent').length;
    // Mock "New this month" logic
    const newThisMonth = Math.floor(active * 0.2);

    return { active, totalProposals, pendingProposals, newThisMonth };
  }, [companies, proposals]);

  const onSubmit = (data: CompanyFormData) => {
    const company: Company = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: 'Active',
      sector: 'Genel',
      riskLevel: 'Medium',
    };
    addCompany(company);
    setIsModalOpen(false);
    reset();
    toast.success('Firma başarıyla eklendi!');
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
    deleteCompany(confirmModal.id);
    setConfirmModal({ isOpen: false, id: '', name: '' });
    setMenuOpenId(null);
    toast.success('Firma ve ilişkili tüm veriler silindi.');
  };

  const handleFilterChange = (key: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: values
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handleExport = (format: 'csv' | 'excel' = 'excel') => {
    const filteredData = filteredCompanies.map(c => ({
      'Firma Adı': c.name,
      'Yetkili Kişi': c.authorizedPerson,
      'E-posta': c.email,
      'Telefon': c.phone,
      'Vergi No': c.taxInfo,
      'Adres': c.address
    }));

    if (format === 'excel') {
      DataExporter.exportCompanies(filteredCompanies);
    } else {
      DataExporter.exportToCSV(filteredData, 'firmalar');
    }

    toast.success(`${filteredCompanies.length} firma dışa aktarıldı`);
  };

  const getGradient = (name: string) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  const getSectorStyle = (name: string, sector?: string) => {
    const n = (sector || name).toLowerCase();
    if (n.includes('inşaat') || n.includes('yapı')) return { label: 'İnşaat', className: 'text-orange-700 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', icon: <HardHat size={12} /> };
    if (n.includes('lojistik') || n.includes('nakliyat') || n.includes('transport')) return { label: 'Lojistik', className: 'text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', icon: <Truck size={12} /> };
    if (n.includes('tekstil') || n.includes('giyim') || n.includes('moda')) return { label: 'Tekstil', className: 'text-purple-700 bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', icon: <Scissors size={12} /> };
    if (n.includes('gıda') || n.includes('yemek') || n.includes('restoran')) return { label: 'Gıda', className: 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: <Utensils size={12} /> };
    if (n.includes('metal') || n.includes('sanayi') || n.includes('üretim') || n.includes('fabrika')) return { label: 'Üretim', className: 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', icon: <Activity size={12} /> };
    if (n.includes('sağlık') || n.includes('hastane') || n.includes('klinik')) return { label: 'Sağlık', className: 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: <Activity size={12} /> };
    return { label: sector || 'Genel', className: 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: <Briefcase size={12} /> };
  };

  return (
    <div className="space-y-8 animate-fade-in-up" onClick={() => setMenuOpenId(null)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Müşteri Portföyü</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kurumsal müşteri yönetimi ve sektör bazlı analizler.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex items-center gap-2 px-6"
            icon={<FileSpreadsheet size={18} />}
            onClick={handleExportExcel}
          >
            Excel'e Aktar
          </Button>
          <Button
            className="px-6 shadow-lg shadow-blue-500/20"
            icon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Yeni Firma Ekle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Aktif Firma"
          value={stats.active}
          icon={Building2}
          description="Toplam"
          colorClass="bg-blue-500 text-blue-500"
        />
        <StatsCard
          title="Toplam Teklif"
          value={stats.totalProposals}
          icon={FileText}
          description="Tüm Zamanlar"
          colorClass="bg-violet-500 text-violet-500"
        />
        <StatsCard
          title="Bekleyen İşlem"
          value={stats.pendingProposals}
          icon={CalendarClock}
          description="Açık Teklifler"
          colorClass="bg-amber-500 text-amber-500"
        />
        <StatsCard
          title="Aylık Büyüme"
          value={`+${stats.newThisMonth}`}
          icon={TrendingUp}
          description="Yeni Kayıt"
          colorClass="bg-emerald-500 text-emerald-500"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="relative w-full sm:w-80 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              placeholder="Firma, yetkili veya vergi no ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-2 border-r border-slate-200 dark:border-slate-700 mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Sektör:</span>
            </div>
            {['İnşaat', 'Lojistik', 'Üretim', 'Gıda', 'Sağlık'].map(sector => (
              <button
                key={sector}
                onClick={() => { setSearchQuery(searchQuery === sector ? '' : sector); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${searchQuery === sector
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                  }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
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

          <select
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="newest">Son Eklenen</option>
            <option value="alphabetical">Alfabetik (A-Z)</option>
          </select>
        </div>
      </div>

      {/* VIEW CONTENT */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Add New Placeholder Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center min-h-[300px] h-full rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300"
          >
            <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md flex items-center justify-center mb-4 transition-all group-hover:scale-110">
              <Plus size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Yeni Firma Ekle</h3>
          </button>

          {paginatedCompanies.map(company => {
            const sector = getSectorStyle(company.name);
            const pending = proposals.filter(p => p.companyId === company.id && p.status === 'Sent').length;

            return (
              <div
                key={company.id}
                className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(`/companies/${company.id}`)}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getGradient(company.name)} flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20`}>
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{company.name}</h3>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border mt-1 ${sector.className}`}>
                        {sector.icon} {sector.label}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === company.id ? null : company.id); }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {menuOpenId === company.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 animate-scale-in overflow-hidden ring-1 ring-black/5">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/companies/${company.id}`); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <Edit size={14} /> Düzenle
                        </button>
                        <button
                          onClick={(e) => handleDelete(company.id, company.name, e)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-2 mb-4">
                  {pending > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-800">
                      <FileText size={14} /> {pending} Bekleyen Teklif
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-sm p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-slate-400"><Mail size={14} /></div>
                    <span className="text-slate-600 dark:text-slate-300 truncate text-xs">{company.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-slate-400"><Phone size={14} /></div>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">{company.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-slate-400"><MapPin size={14} /></div>
                    <span className="text-slate-600 dark:text-slate-300 truncate text-xs">{company.address}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/proposals/create', { state: { preselectedCompanyId: company.id } }) }}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Hızlı Teklif Ver"
                    >
                      <Zap size={16} fill="currentColor" className="opacity-50" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/calendar', { state: { preselectedCompanyId: company.id } }) }}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Randevu Planla"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                    Detay <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // LIST VIEW
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Firma</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Yetkili</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">İletişim</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Durum</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map(company => {
                  const sector = getSectorStyle(company.name);
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(company.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{company.name}</p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 rounded mt-0.5 ${sector.className.replace('border', '')}`}>
                              {sector.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-full"><div className="w-2 h-2 bg-slate-400 rounded-full"></div></div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{company.authorizedPerson}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1"><Mail size={10} /> {company.email}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1"><Phone size={10} /> {company.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Aktif
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDelete(company.id, company.name, e)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Pagination */}
      <Pagination
        totalItems={filteredCompanies.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Firmayı Sil"
        message={`${confirmModal.name} firmasını ve ilişkili tüm verileri (teklifler, randevular vb.) silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Firmayı Sil"
        variant="danger"
      />

      {filteredCompanies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            <Filter size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sonuç Bulunamadı</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-1">Aradığınız kriterlere uygun firma kaydı mevcut değil.</p>
          <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-600 font-medium hover:underline">Filtreleri Temizle</button>
        </div>
      )}

      {/* Add Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="Yeni Firma Kaydı"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); reset(); }}>İptal</Button>
            <Button onClick={handleSubmit(onSubmit)}>Kaydet</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
          <div>
            <label className="label">Firma Ticari Ünvanı</label>
            <input
              {...register('name')}
              className={`input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Örn: Tekno A.Ş."
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vergi Bilgileri</label>
              <input
                {...register('taxInfo')}
                className={`input ${errors.taxInfo ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="VD ve No"
              />
              {errors.taxInfo && <p className="text-xs text-red-500 mt-1">{errors.taxInfo.message}</p>}
            </div>
            <div>
              <label className="label">Yetkili Kişi</label>
              <input
                {...register('authorizedPerson')}
                className={`input ${errors.authorizedPerson ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Ad Soyad"
              />
              {errors.authorizedPerson && <p className="text-xs text-red-500 mt-1">{errors.authorizedPerson.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">E-posta</label>
              <input
                {...register('email')}
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                type="email"
                placeholder="ornek@sirket.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Telefon</label>
              <input
                {...register('phone')}
                className={`input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="0212..."
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Açık Adres</label>
            <textarea
              {...register('address')}
              className={`input min-h-[80px] py-2 ${errors.address ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Mahalle, Sokak, İlçe/İl"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Companies;
