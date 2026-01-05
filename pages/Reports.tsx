import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Area, AreaChart, Legend, RadialBarChart, RadialBar,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line,
    Treemap, ScatterChart, Scatter, FunnelChart, Funnel
} from 'recharts';
import { Download, TrendingUp, Users, Activity, HeartPulse, Calendar, ArrowUpRight, Filter, ShieldAlert, Building2, Coins, Briefcase, Zap, AlertCircle, RefreshCw, Search, FileDown, Eye, CalendarDays, BarChart3, PieChartIcon, TrendingDown, Target, Award, Clock, UserCheck, DollarSign, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
    const { proposals, appointments, tests, companies, staff, exportToExcel } = useData();
    const [activeTab, setActiveTab] = useState<'financial' | 'operational' | 'analytics'>('financial');
    const [dateRange, setDateRange] = useState('Bu Yıl');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [reportType, setReportType] = useState<'all' | 'financial' | 'operational' | 'clinical'>('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // --- Theme Colors ---
    const COLORS = {
        primary: '#3B82F6',
        secondary: '#6366f1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        purple: '#8B5CF6',
        slate: '#64748B',
        teal: '#14b8a6',
        indigo: '#6366f1'
    };

    const PIE_COLORS = [COLORS.primary, COLORS.purple, COLORS.success, COLORS.warning, COLORS.danger, COLORS.teal, COLORS.indigo, COLORS.slate];

    // Advanced filtering
    const filteredData = useMemo(() => {
        let filtered = {
            proposals: proposals,
            appointments: appointments,
            companies: companies,
            staff: staff
        };

        // Filter by company
        if (selectedCompanyId !== 'All') {
            filtered.proposals = proposals.filter(p => p.companyId === selectedCompanyId);
            filtered.appointments = appointments.filter(a => a.companyId === selectedCompanyId);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered.companies = companies.filter(c => 
                c.name.toLowerCase().includes(term) || 
                c.email?.toLowerCase().includes(term)
            );
            filtered.proposals = filtered.proposals.filter(p => 
                p.title.toLowerCase().includes(term) || 
                filtered.companies.some(c => c.id === p.companyId)
            );
        }

        // Filter by report type
        if (reportType !== 'all') {
            // Apply specific filters based on report type
            if (reportType === 'financial') {
                filtered.proposals = filtered.proposals.filter(p => p.status === 'Approved');
            } else if (reportType === 'clinical') {
                filtered.appointments = filtered.appointments.filter(a => a.type === 'Screening');
            }
        }

        return filtered;
    }, [proposals, appointments, companies, staff, selectedCompanyId, searchTerm, reportType]);

    // --- REPORTING LOGIC ---
    const filteredProposals = useMemo(() => {
        return selectedCompanyId === 'All'
            ? proposals
            : proposals.filter(p => p.companyId === selectedCompanyId);
    }, [proposals, selectedCompanyId]);

    const filteredAppointments = useMemo(() => {
        return selectedCompanyId === 'All'
            ? appointments
            : appointments.filter(a => a.companyId === selectedCompanyId);
    }, [appointments, selectedCompanyId]);

    const companyStats = useMemo(() => {
        if (selectedCompanyId === 'All') return null;

        const companyProposals = filteredProposals;
        const companyApps = filteredAppointments;

        const totalSpent = companyProposals.filter(p => p.status === 'Approved').reduce((acc, p) => acc + p.totalAmount, 0);
        const screeningCount = companyApps.filter(a => a.type === 'Screening').length;
        const completedScreeningCount = companyApps.filter(a => a.type === 'Screening' && a.status === 'Completed').length;

        return {
            totalSpent,
            screeningCount,
            completedScreeningCount,
            completionRate: screeningCount > 0 ? Math.round((completedScreeningCount / screeningCount) * 100) : 0
        };
    }, [filteredProposals, filteredAppointments, selectedCompanyId]);

    // --- FINANCIAL DATA PREP ---

    // 1. Revenue Trends (Mocked but reactive to filter)
    const revenueData = useMemo(() => {
        const base = selectedCompanyId === 'All' ? 10000 : 2000;
        return [
            { name: 'Oca', revenue: base * 4.2, target: base * 4.5, profit: base * 1.2 },
            { name: 'Şub', revenue: base * 3.8, target: base * 4.5, profit: base * 1.0 },
            { name: 'Mar', revenue: base * 5.5, target: base * 4.8, profit: base * 1.8 },
            { name: 'Nis', revenue: base * 4.8, target: base * 5.0, profit: base * 1.5 },
            { name: 'May', revenue: base * 6.2, target: base * 5.5, profit: base * 2.1 },
            { name: 'Haz', revenue: filteredProposals.filter(p => p.status === 'Approved').reduce((acc, p) => acc + p.totalAmount, 0) || base * 6.0, target: base * 6.0, profit: base * 2.0 },
        ];
    }, [filteredProposals, selectedCompanyId]);

    // 2. Revenue by Service Category
    const categoryRevenueData = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        filteredProposals.forEach(p => {
            if (p.status === 'Approved') {
                p.items.forEach(item => {
                    const test = tests.find(t => t.id === item.testId);
                    const cat = test?.category || 'Diğer';
                    categoryMap[cat] = (categoryMap[cat] || 0) + (item.totalPrice || (item.unitPrice * item.quantity));
                });
            }
        });

        let data = Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] }));
        if (data.length === 0) { // Fallback mock data if empty
            data = [
                { name: 'Laboratuvar', value: 45000 },
                { name: 'Radyoloji', value: 32000 },
                { name: 'Fiziksel', value: 18000 },
                { name: 'Klinik', value: 12000 }
            ];
        }
        return data.sort((a, b) => b.value - a.value);
    }, [filteredProposals, tests]);

    // --- OPERATIONAL DATA PREP ---

    // 1. Staff Workload
    const staffWorkloadData = useMemo(() => {
        const workload: Record<string, { planned: number, completed: number }> = {};

        // Initialize top 5 staff
        staff.slice(0, 5).forEach(s => workload[s.id] = { planned: 0, completed: 0 });

        filteredAppointments.forEach(app => {
            app.staffIds.forEach(staffId => {
                if (workload[staffId]) {
                    if (app.status === 'Completed') workload[staffId].completed += 1;
                    else workload[staffId].planned += 1;
                }
            });
        });

        return Object.keys(workload).map(sid => {
            const person = staff.find(s => s.id === sid);
            return {
                name: person?.name.split(' ')[0] || 'Bilinmeyen',
                planned: workload[sid].planned,
                completed: workload[sid].completed
            };
        });
    }, [filteredAppointments, staff]);

    // 2. Top Companies by Revenue
    const topCompaniesData = useMemo(() => {
        const revenueMap: Record<string, number> = {};
        filteredProposals.forEach(p => {
            if (p.status === 'Approved') {
                revenueMap[p.companyId] = (revenueMap[p.companyId] || 0) + p.totalAmount;
            }
        });

        return Object.entries(revenueMap)
            .map(([id, revenue]) => ({
                name: companies.find(c => c.id === id)?.name || 'Bilinmeyen',
                revenue
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [filteredProposals, companies]);

    // 3. Service Growth Trend
    const growthTrendData = useMemo(() => {
        // Mocking growth data for demonstration
        return [
            { name: 'Oca', Lab: 4000, Radio: 2400, Clinical: 2400 },
            { name: 'Şub', Lab: 3000, Radio: 1398, Clinical: 2210 },
            { name: 'Mar', Lab: 2000, Radio: 9800, Clinical: 2290 },
            { name: 'Nis', Lab: 2780, Radio: 3908, Clinical: 2000 },
            { name: 'May', Lab: 1890, Radio: 4800, Clinical: 2181 },
            { name: 'Haz', Lab: 2390, Radio: 3800, Clinical: 2500 },
        ];
    }, []);

    // 4. Hourly Intensity (Mocked)
    const hourlyIntensityData = useMemo(() => {
        return [
            { hour: '08:00', load: 10 },
            { hour: '09:00', load: 25 },
            { hour: '10:00', load: 45 },
            { hour: '11:00', load: 38 },
            { hour: '12:00', load: 15 },
            { hour: '13:00', load: 28 },
            { hour: '14:00', load: 52 },
            { hour: '15:00', load: 48 },
            { hour: '16:00', load: 30 },
            { hour: '17:00', load: 12 },
        ];
    }, []);

    const totalRevenue = filteredProposals.filter(p => p.status === 'Approved').reduce((acc, p) => acc + p.totalAmount, 0);
    const totalPotential = filteredProposals.reduce((acc, p) => acc + p.totalAmount, 0);
    const avgProposalValue = totalRevenue / (filteredProposals.filter(p => p.status === 'Approved').length || 1);
    const totalScreenings = filteredAppointments.filter(a => a.type === 'Screening').length;
    const completedScreenings = filteredAppointments.filter(a => a.type === 'Screening' && a.status === 'Completed').length;
    const completionRate = totalScreenings > 0 ? Math.round((completedScreenings / totalScreenings) * 100) : 0;

    const totalStaffCount = filteredAppointments.reduce((acc, curr) => acc + (curr.staffIds?.length || 0), 0);
    const avgStaff = totalScreenings > 0 ? (totalStaffCount / totalScreenings).toFixed(1) : 0;

    const conversionRate = proposals.length > 0
        ? Math.round((proposals.filter(p => p.status === 'Approved').length / proposals.length) * 100)
        : 0;

    // Comparative Metrics (Simulated previous periods)
    const kpiComparisons = {
        revenue: 12.5,
        conversion: -2.1,
        screenings: 8.4,
        efficiency: 5.2
    };

    const handleExport = () => {
        try {
            if (!companies || !proposals || !appointments || !staff) {
                toast.error('Gerekli veriler yüklenemedi. Lütfen sayfayı yenileyin.');
                return;
            }

            // 1. DASHBOARD OVERVIEW (SUMMARY)
            const dashboardSummary = [
                { 'Metrik': 'Toplam Ciro', 'Değer': `${totalRevenue.toLocaleString('tr-TR')} ₺`, 'Değişim': `${kpiComparisons.revenue >= 0 ? '+' : ''}${kpiComparisons.revenue}%` },
                { 'Metrik': 'Teklif Dönüşüm', 'Değer': `%${conversionRate}`, 'Değişim': `${kpiComparisons.conversion >= 0 ? '+' : ''}${kpiComparisons.conversion}%` },
                { 'Metrik': 'Tamamlanan Tarama', 'Değer': completedScreenings, 'Değişim': `${kpiComparisons.screenings >= 0 ? '+' : ''}${kpiComparisons.screenings}%` },
                { 'Metrik': 'Ortalama Ekip Büyüklüğü', 'Değer': avgStaff, 'Değişim': `${kpiComparisons.efficiency >= 0 ? '+' : ''}${kpiComparisons.efficiency}%` },
                { 'Metrik': 'Aktif Firma Sayısı', 'Değer': companies.length, 'Değişim': '-' },
                { 'Metrik': 'Toplam Personel', 'Değer': staff.length, 'Değişim': '-' }
            ];

            // 2. TOP COMPANIES
            const topCompaniesReport = topCompaniesData.map(c => ({
                'Firma Adı': c.name,
                'Toplam Ciro (₺)': c.revenue,
                'Genel Ciro Payı (%)': totalRevenue > 0 ? ((c.revenue / totalRevenue) * 100).toFixed(1) : 0
            }));

            // 3. SERVICE GROWTH TRENDS
            const trendsReport = growthTrendData.map(d => ({
                'Dönem': d.name,
                'Laboratuvar (₺)': d.Lab,
                'Radyoloji (₺)': d.Radio,
                'Klinik (₺)': d.Clinical,
                'Toplam (₺)': d.Lab + d.Radio + d.Clinical
            }));

            // 4. FINANCIAL SUMMARY (MONTHLY)
            const financialSummary = (revenueData || []).map(d => ({
                'Ay': d.name,
                'Ciro (₺)': d.revenue || 0,
                'Hedef (₺)': d.target || 0,
                'Net Kâr (₺)': d.profit || 0,
                'Performans (%)': d.target ? Math.round((d.revenue / d.target) * 100) : 0
            }));

            // 5. COMPANY REPORT
            const companyReport = companies.map(c => {
                const cProposals = proposals.filter(p => p.companyId === c.id) || [];
                const cApproved = cProposals.filter(p => p.status === 'Approved') || [];
                const cSpent = cApproved.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
                const cAppointments = appointments.filter(a => a.companyId === c.id) || [];

                return {
                    'Firma Adı': c.name,
                    'Sektör': c.taxInfo || 'Genel',
                    'Ciro (₺)': cSpent,
                    'Onaylı Teklif': cApproved.length,
                    'Toplam Teklif': cProposals.length,
                    'Tamamlanan Tarama': cAppointments.filter(a => a.status === 'Completed').length,
                    'Telefon': c.phone || '-',
                    'E-Posta': c.email || '-'
                };
            });

            // 6. STAFF PRODUCTIVITY
            const staffReport = staff.map(s => {
                const sApps = appointments.filter(a => a.staffIds?.includes(s.id)) || [];
                const completed = sApps.filter(a => a.status === 'Completed').length;
                return {
                    'Personel': s.name,
                    'Ünvan': s.title || '-',
                    'Toplam Görev': sApps.length,
                    'Tamamlanan': completed,
                    'Verimlilik (%)': sApps.length > 0 ? Math.round((completed / sApps.length) * 100) : 0
                };
            });

            const wb = XLSX.utils.book_new();

            // Sayfaları Oluştur ve Ekle
            const sheets = [
                { name: "Dashboard Ozet", data: dashboardSummary },
                { name: "En Degerli Firmalar", data: topCompaniesReport },
                { name: "Buyume Trendleri", data: trendsReport },
                { name: "Finansal Analiz", data: financialSummary },
                { name: "Firma Detay", data: companyReport },
                { name: "Personel Verimi", data: staffReport }
            ];

            sheets.forEach(sheet => {
                if (sheet.data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(sheet.data);

                    // Otomatik kolon genişliği ayarla
                    const keys = Object.keys(sheet.data[0]);
                    const wscols = keys.map(key => ({
                        wch: Math.max(key.length, ...sheet.data.map(row => (row[key] ? row[key].toString().length : 0))) + 2
                    }));
                    ws['!cols'] = wscols;

                    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
                }
            });

            const fileName = `HanTech_Gelismiş_Rapor_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success('Gelişmiş rapor başarıyla hazırlandı.');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Rapor oluşturulurken bir hata oluştu.');
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl text-xs z-50">
                    <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color || entry.fill }} className="font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
                            {entry.name}: {entry.value.toLocaleString('tr-TR')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
      {/* Modern Header with Enhanced Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              Raporlar & Analizler
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 ml-14">İş zekası, finansal veriler ve sağlık trendleri.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              icon={<Eye size={18} />} 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="hidden md:flex"
            >
              Gelişmiş Filtreler
            </Button>
            <Button icon={<FileDown size={18} />} onClick={handleExport}>
              Excel İndir
            </Button>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Firma, teklif ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Company Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 pl-11 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="All">Tüm Firmalar</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          {/* Report Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 pl-11 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">Tüm Raporlar</option>
              <option value="financial">Finansal</option>
              <option value="operational">Operasyonel</option>
              <option value="clinical">Klinik</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 pl-11 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option>Son 30 Gün</option>
              <option>Bu Ay</option>
              <option>Bu Çeyrek</option>
              <option>Bu Yıl</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/20 rounded-2xl border border-slate-200 dark:border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Min. Tutar</label>
                <input type="number" placeholder="0 ₺" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Max. Tutar</label>
                <input type="number" placeholder="∞ ₺" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Durum</label>
                <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option>Tümü</option>
                  <option>Onaylı</option>
                  <option>Bekleyen</option>
                  <option>Reddedildi</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

            {/* Modern KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl p-6 shadow-xl shadow-blue-500/25 text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <DollarSign size={24} className="drop-shadow-sm" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md ${kpiComparisons.revenue >= 0 ? 'text-white' : 'text-red-200'}`}>
                                {kpiComparisons.revenue >= 0 ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
                                {kpiComparisons.revenue >= 0 ? '+' : ''}{kpiComparisons.revenue}%
                            </div>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mb-1">{totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h3>
                        <p className="text-blue-100 text-sm font-medium opacity-90">Toplam Ciro</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                                <Target size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpiComparisons.conversion >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {kpiComparisons.conversion >= 0 ? '+' : ''}{kpiComparisons.conversion}%
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">%{conversionRate}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Teklif Dönüşümü</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl text-green-600 dark:text-green-400">
                                <HeartPulse size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpiComparisons.screenings >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {kpiComparisons.screenings >= 0 ? '+' : ''}{kpiComparisons.screenings}%
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{completedScreenings}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tamamlanan Tarama <span className="text-xs opacity-60">/ {totalScreenings}</span></p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl text-purple-600 dark:text-purple-400">
                                <Users size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpiComparisons.efficiency >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {kpiComparisons.efficiency >= 0 ? '+' : ''}{kpiComparisons.efficiency}%
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{avgStaff}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ort. Ekip Büyüklüğü</p>
                    </div>
                </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="flex justify-center">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 flex shadow-lg overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'financial' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                        <DollarSign size={18} />
                        Finansal Raporlar
                    </button>
                    <button
                        onClick={() => setActiveTab('operational')}
                        className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'operational' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                        <Activity size={18} />
                        Operasyonel Verim
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                        <PieChartIcon size={18} />
                        Analizler
                    </button>
                </div>
            </div>

            {/* CONTENT TABS */}

            {/* 1. FINANCIAL DASHBOARD */}
            {activeTab === 'financial' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
                    <Card title="Aylık Gelir ve Kârlılık Trendi" className="lg:col-span-2">
                        <div className="h-80 w-full mt-4 min-h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={revenueData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="revenue" name="Ciro" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} barSize={30} />
                                    <Line type="monotone" dataKey="target" name="Hedef" stroke={COLORS.slate} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                    <Area type="monotone" dataKey="profit" name="Net Kâr" fill={COLORS.success} stroke={COLORS.success} fillOpacity={0.1} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Hizmet Kategorisi Büyüme Trendi" className="lg:col-span-1">
                        <div className="h-80 w-full mt-4 min-h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="Lab" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="Radio" stackId="1" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="Clinical" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Ciro Bazlı En Büyük 5 Müşteri" className="lg:col-span-1">
                        <div className="h-80 w-full mt-4 min-h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topCompaniesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} width={100} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="revenue" fill={COLORS.indigo} radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Gelir Kaynağı Dağılımı" className="lg:col-span-1">
                        <div className="h-64 w-full mt-4 flex items-center justify-center relative min-h-[256px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryRevenueData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        cornerRadius={6}
                                        stroke="none"
                                    >
                                        {categoryRevenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -mt-6 pointer-events-none">
                                <span className="text-2xl font-bold text-slate-800 dark:text-white block">Ciro</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kategori</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">En yüksek gelir kalemi <strong>{categoryRevenueData[0]?.name}</strong> kategorisidir.</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* 3. ANALYTICS DASHBOARD */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
                    {/* Performance Trends */}
                    <Card title="Performans Trendleri" className="lg:col-span-2">
                        <div className="h-96 w-full mt-4 min-h-[384px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={[
                                    { subject: 'Hız', A: 120, B: 110, fullMark: 150 },
                                    { subject: 'Kalite', A: 98, B: 130, fullMark: 150 },
                                    { subject: 'Verimlilik', A: 86, B: 130, fullMark: 150 },
                                    { subject: 'Müşteri Memnuniyeti', A: 99, B: 100, fullMark: 150 },
                                    { subject: 'Gelir', A: 85, B: 90, fullMark: 150 },
                                    { subject: 'Büyüme', A: 65, B: 85, fullMark: 150 },
                                ]}>
                                    <PolarGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 150]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                    <Radar name="Bu Dönem" dataKey="A" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} strokeWidth={2} />
                                    <Radar name="Önceki Dönem" dataKey="B" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} strokeWidth={2} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Success Metrics */}
                    <Card title="Başarı Metrikleri" className="lg:col-span-1">
                        <div className="space-y-6 mt-4">
                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                <Award className="mx-auto text-blue-600 dark:text-blue-400 mb-3" size={32} />
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">94%</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Genel Başarı Oranı</p>
                                <div className="mt-3 flex items-center justify-center gap-1 text-green-600 text-xs font-medium">
                                    <ArrowUpRight size={14} />
                                    <span>%12 artış</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-center">
                                    <Clock className="mx-auto text-amber-500 mb-2" size={20} />
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">24s</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ort. Yanıt Süresi</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-center">
                                    <Target className="mx-auto text-green-500 mb-2" size={20} />
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">186</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Hedef Tamamlama</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Category Distribution Treemap */}
                    <Card title="Kategori Dağılımı" className="lg:col-span-1">
                        <div className="h-80 w-full mt-4 min-h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={[
                                        { name: 'Laboratuvar', size: 45000, color: COLORS.primary },
                                        { name: 'Radyoloji', size: 32000, color: COLORS.purple },
                                        { name: 'Klinik', size: 18000, color: COLORS.success },
                                        { name: 'Fiziksel', size: 12000, color: COLORS.warning },
                                        { name: 'Diğer', size: 8000, color: COLORS.slate },
                                    ]}
                                    dataKey="size"
                                    aspectRatio={4/3}
                                    stroke="#fff"
                                    content={({ x, y, width, height, name, size, color }: any) => (
                                        <g>
                                            <rect
                                                x={x}
                                                y={y}
                                                width={width}
                                                height={height}
                                                style={{
                                                    fill: color,
                                                    stroke: '#fff',
                                                    strokeWidth: 2,
                                                    rx: 8,
                                                    ry: 8
                                                }}
                                            />
                                            {width > 50 && height > 30 && (
                                                <>
                                                    <text
                                                        x={x + width / 2}
                                                        y={y + height / 2 - 8}
                                                        textAnchor="middle"
                                                        fill="#fff"
                                                        fontSize={14}
                                                        fontWeight="bold"
                                                    >
                                                        {name}
                                                    </text>
                                                    <text
                                                        x={x + width / 2}
                                                        y={y + height / 2 + 8}
                                                        textAnchor="middle"
                                                        fill="#fff"
                                                        fontSize={12}
                                                        opacity={0.9}
                                                    >
                                                        ₺{(size/1000).toFixed(0)}K
                                                    </text>
                                                </>
                                            )}
                                        </g>
                                    )}
                                />
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Scatter Plot Analysis */}
                    <Card title="Değer-Zaman Analizi" className="lg:col-span-2">
                        <div className="h-80 w-full mt-4 min-h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} />
                                    <XAxis 
                                        type="number" 
                                        dataKey="time" 
                                        name="Süre (Gün)" 
                                        unit=" gün"
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="value" 
                                        name="Değer (₺)" 
                                        unit=" ₺"
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94A3B8', fontSize: 12 }} 
                                    />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                    <Scatter 
                                        name="Projeler" 
                                        data={[
                                            { time: 1, value: 5000, size: 200 },
                                            { time: 2, value: 8000, size: 300 },
                                            { time: 3, value: 12000, size: 400 },
                                            { time: 4, value: 15000, size: 500 },
                                            { time: 5, value: 18000, size: 600 },
                                            { time: 6, value: 22000, size: 700 },
                                            { time: 7, value: 25000, size: 800 },
                                            { time: 8, value: 28000, size: 900 },
                                        ]} 
                                        fill={COLORS.primary}
                                        fillOpacity={0.6}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Proje süresi ve değeri arasındaki ilişkiyi gösteren dağılım grafiği
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* 2. OPERATIONAL DASHBOARD */}
            {activeTab === 'operational' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
                    <Card title="Personel İş Yükü (Planlanan vs Tamamlanan)" className="lg:col-span-2">
                        <div className="h-80 w-full mt-4 min-h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={staffWorkloadData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="completed" stackId="a" name="Tamamlanan" fill={COLORS.success} radius={[0, 0, 4, 4]} barSize={40} />
                                    <Bar dataKey="planned" stackId="a" name="Bekleyen" fill={COLORS.warning} radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Verimlilik Özeti" className="lg:col-span-1 min-h-[400px]">
                        <div className="space-y-6 mt-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Ekipman Kullanımı</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">%85</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Raporlama Hızı</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">1.2 Gün</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Müşteri Memnuniyeti</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">4.8/5</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '96%' }}></div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Günlük Operasyonel Yoğunluk</h4>
                                <div className="h-32 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={hourlyIntensityData}>
                                            <Area type="monotone" dataKey="load" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.1} strokeWidth={2} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 italic">* En yoğun çalışma saatleri 10:00 ve 14:00 olarak gözlemlenmiştir.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Reports;
