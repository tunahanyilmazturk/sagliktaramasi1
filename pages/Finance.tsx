
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
  Wallet, Users, TrendingUp, Calendar, Search, Download, 
  ArrowUpRight, Clock, Calculator, Filter, FileText, ChevronRight,
  Eye, CheckCircle2, AlertCircle, XCircle, CreditCard, Banknote,
  DollarSign, Receipt, PiggyBank, TrendingDown, Target, Award,
  BarChart3, PieChartIcon, CalendarDays, FileDown, AlertTriangle,
  CheckSquare, Square, MoreVertical, Edit, Trash2, Plus
} from 'lucide-react';
import { Staff, Appointment } from '../types';
import toast from 'react-hot-toast';
import { generateAppointmentPDF, generateScreeningReportPDF, generateScreeningPlanPDF, generateStaffFinancePDF } from '../services/pdfService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Area, AreaChart, Legend, LineChart, Line
} from 'recharts';

const Finance: React.FC = () => {
  const navigate = useNavigate();
  const { staff, appointments, companies, exportToExcel, institution, updateStaff } = useData();
  const [searchTerm, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'invoices'>('overview');

  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, 'Paid' | 'Pending'>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'transfer' | 'cash'>('all');
  const [invoiceStatus, setInvoiceStatus] = useState<'all' | 'draft' | 'sent' | 'paid'>('all');

  const invoices = useMemo(() => [
    { id: 'INV-001', company: 'Global Lojistik A.Ş.', amount: 12500, date: '2024-01-05', status: 'paid', category: 'Periyodik Muayene' },
    { id: 'INV-002', company: 'Tekno Market Ltd.', amount: 8400, date: '2024-01-08', status: 'sent', category: 'Mobil Sağlık Tarama' },
    { id: 'INV-003', company: 'Sanayi Devleri A.Ş.', amount: 15600, date: '2024-01-12', status: 'draft', category: 'Laboratuvar Tetkikleri' },
    { id: 'INV-004', company: 'Liman İşletmeleri', amount: 9200, date: '2024-01-15', status: 'paid', category: 'İlkyardım Eğitimi' },
    { id: 'INV-005', company: 'Hızlı Kargo A.Ş.', amount: 4500, date: '2024-01-18', status: 'sent', category: 'Psikoteknik' },
  ], []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const statusMatch = invoiceStatus === 'all' || inv.status === invoiceStatus;
      const searchMatch = inv.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [invoices, invoiceStatus, searchTerm]);

  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // Theme colors for charts
  const COLORS = {
    primary: '#3B82F6',
    secondary: '#6366f1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    slate: '#64748B',
    teal: '#14b8a6'
  };

  const PIE_COLORS = [COLORS.primary, COLORS.purple, COLORS.success, COLORS.warning, COLORS.danger, COLORS.teal];

  // Calculate earnings for each staff member for the selected period
  const staffEarnings = useMemo(() => {
    return staff.map(person => {
      const personAppointments = appointments.filter(app => 
        app.staffIds.includes(person.id) && 
        app.status === 'Completed'
      ).filter(app => {
        const d = new Date(app.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      const totalWorkMinutes = personAppointments.reduce((sum, app) => sum + (app.durationMinutes || 0), 0);
      const totalWorkHours = totalWorkMinutes / 60;
      
      const hourlyRate = person.hourlyRate || 150; // Default hourly rate if not set
      const baseSalary = person.baseSalary || 0;
      
      const variableEarnings = totalWorkHours * hourlyRate;
      const totalEarnings = baseSalary + variableEarnings;

      return {
        ...person,
        workHours: totalWorkHours,
        appointmentCount: personAppointments.length,
        variableEarnings,
        totalEarnings,
        hourlyRate,
        appointments: personAppointments // Detaylar için operasyon listesini ekle
      };
    });
  }, [staff, appointments, selectedMonth, selectedYear]);

  const filteredStaff = staffEarnings.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = useMemo(() => {
    const totalPayout = staffEarnings.reduce((sum, s) => sum + s.totalEarnings, 0);
    const totalHours = staffEarnings.reduce((sum, s) => sum + s.workHours, 0);
    const totalApps = staffEarnings.reduce((sum, s) => sum + s.appointmentCount, 0);
    return { totalPayout, totalHours, totalApps };
  }, [staffEarnings]);

  // Chart data preparation
  const monthlyTrendData = useMemo(() => {
    return months.slice(0, 6).map((month, index) => {
      const monthStaffEarnings = staff.map(person => {
        const personAppointments = appointments.filter(app => 
          app.staffIds.includes(person.id) && 
          app.status === 'Completed'
        ).filter(app => {
          const d = new Date(app.date);
          return d.getMonth() === index && d.getFullYear() === selectedYear;
        });
        const totalWorkMinutes = personAppointments.reduce((sum, app) => sum + (app.durationMinutes || 0), 0);
        const totalWorkHours = totalWorkMinutes / 60;
        const hourlyRate = person.hourlyRate || 150;
        const baseSalary = person.baseSalary || 0;
        const variableEarnings = totalWorkHours * hourlyRate;
        return baseSalary + variableEarnings;
      });
      const total = monthStaffEarnings.reduce((sum, earnings) => sum + earnings, 0);
      return { month, revenue: total, target: total * 1.2 };
    });
  }, [staff, appointments, selectedYear]);

  const paymentStatusData = useMemo(() => {
    const paid = Object.values(paymentStatuses).filter(status => status === 'Paid').length;
    const pending = Object.values(paymentStatuses).filter(status => status === 'Pending').length;
    return [
      { name: 'Ödendi', value: paid || Math.floor(staff.length * 0.6), color: COLORS.success },
      { name: 'Bekleyen', value: pending || Math.floor(staff.length * 0.4), color: COLORS.warning }
    ];
  }, [paymentStatuses, staff.length]);

  const staffCategoryData = useMemo(() => {
    const categories = staff.reduce((acc, person) => {
      const category = person.title || 'Diğer';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [staff]);

  const togglePaymentStatus = (staffId: string) => {
    setPaymentStatuses(prev => ({
      ...prev,
      [`${staffId}-${selectedMonth}-${selectedYear}`]: prev[`${staffId}-${selectedMonth}-${selectedYear}`] === 'Paid' ? 'Pending' : 'Paid'
    }));
    toast.success('Ödeme durumu güncellendi.');
  };

  const getPaymentStatus = (staffId: string) => {
    return paymentStatuses[`${staffId}-${selectedMonth}-${selectedYear}`] || 'Pending';
  };

  const handleInlineUpdate = (staffId: string, field: 'hourlyRate' | 'baseSalary', value: number) => {
    const person = staff.find(s => s.id === staffId);
    if (person) {
      updateStaff({ ...person, [field]: value });
      toast.success('Hakediş değerleri güncellendi.');
    }
  };

  const handleExport = () => {
    const data = filteredStaff.map(s => ({
      'Personel': s.name,
      'Ünvan': s.title,
      'Çalışma Saati': s.workHours.toFixed(1),
      'Tarama Sayısı': s.appointmentCount,
      'Saatlik Ücret': s.hourlyRate + ' ₺',
      'Sabit Maaş': (s.baseSalary || 0) + ' ₺',
      'Hakediş (Mesai)': s.variableEarnings.toFixed(2) + ' ₺',
      'Toplam Ödeme': s.totalEarnings.toFixed(2) + ' ₺'
    }));
    exportToExcel(data, `Hakedis-Raporu-${months[selectedMonth]}-${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Modern Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-green-50 dark:bg-green-500/10 rounded-2xl">
                <Calculator className="text-green-600 dark:text-green-400" size={24} />
              </div>
              Muhasebe & Hakediş
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 ml-14">Personel çalışma süreleri, hakedişler ve ödeme yönetimi.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              icon={<Filter size={18} />} 
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

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-3xl flex shadow-lg overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-600/50'}`}
            >
              <BarChart3 size={18} />
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'payments' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-600/50'}`}
            >
              <CreditCard size={18} />
              Ödemeler
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-600/50'}`}
            >
              <Receipt size={18} />
              Faturalar
            </button>
          </div>
        </div>

        {/* Date and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full appearance-none bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer px-10 py-2.5"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto"></div>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer px-3"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              className="w-full bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2.5 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              placeholder="Personel ara..."
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2.5 pl-11 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="all">Tüm Ödemeler</option>
              <option value="transfer">Havale</option>
              <option value="cash">Nakit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 rounded-3xl p-6 shadow-xl shadow-green-500/25 text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <DollarSign size={24} className="drop-shadow-sm" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                <ArrowUpRight size={12} />
                <span>+8.2%</span>
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-1">{totalStats.totalPayout.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h3>
            <p className="text-green-100 text-sm font-medium opacity-90">Toplam Ödeme</p>
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Clock size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <ArrowUpRight size={12} />
                <span>+12.5%</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{totalStats.totalHours.toFixed(1)}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Toplam Çalışma Saati</p>
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl text-purple-600 dark:text-purple-400">
                <Users size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <ArrowUpRight size={12} />
                <span>+5.8%</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{totalStats.totalApps}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tamamlanan Operasyon</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Trend */}
          <Card title="Aylık Gelir Trendi" className="lg:col-span-2">
            <div className="h-80 w-full mt-4 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl text-xs z-50">
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} style={{ color: entry.color || entry.fill }} className="font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
                                {entry.name}: {entry.value.toLocaleString('tr-TR')} ₺
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="revenue" name="Gelir" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="target" name="Hedef" stroke={COLORS.slate} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Payment Status Pie Chart */}
          <Card title="Ödeme Durumu" className="lg:col-span-1">
            <div className="h-80 w-full mt-4 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    cornerRadius={6}
                    stroke="none"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl text-xs z-50">
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{payload[0].name}</p>
                            <p style={{ color: payload[0].payload.color }} className="font-medium">
                              {payload[0].value} Personel
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Staff Category Distribution */}
          <Card title="Personel Dağılımı" className="lg:col-span-1">
            <div className="h-80 w-full mt-4 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    cornerRadius={6}
                    stroke="none"
                  >
                    {staffCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl text-xs z-50">
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{payload[0].name}</p>
                            <p className="font-medium">
                              {payload[0].value} Personel
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card title="Hızlı İstatistikler" className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <PiggyBank className="mx-auto text-blue-600 dark:text-blue-400 mb-2" size={24} />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">₺{((totalStats.totalPayout / staff.length) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Ortalama Ödeme</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800/50">
                <TrendingUp className="mx-auto text-green-600 dark:text-green-400 mb-2" size={24} />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">₺{((totalStats.totalPayout / totalStats.totalHours) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Saat Ortalaması</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                <Award className="mx-auto text-purple-600 dark:text-purple-400 mb-2" size={24} />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">{Math.floor(filteredStaff.length * 0.8)}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Ödenmesi Gereken</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                <Target className="mx-auto text-amber-600 dark:text-amber-400 mb-2" size={24} />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">{(totalStats.totalHours / staff.length || 0).toFixed(1)}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Kişi Başına Saat</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Filter size={14} />
              <span>{months[selectedMonth]} {selectedYear} Dönemi Ödemeleri</span>
            </div>
            <Button icon={<Plus size={18} />} variant="outline" className="hidden md:flex">
              Toplu Ödeme
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Personel Bilgisi</th>
                  <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Mesai Saati</th>
                  <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Birim Ücret</th>
                  <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Sabit Maaş</th>
                  <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Ödeme Durumu</th>
                  <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-right">Toplam Hakediş</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredStaff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center font-bold text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{s.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {s.workHours.toFixed(1)} sa
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 font-bold">{s.appointmentCount} Operasyon</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="relative inline-block w-24">
                        <input 
                          type="number"
                          className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 text-sm font-bold focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all dark:text-slate-200"
                          value={s.hourlyRate}
                          onChange={(e) => handleInlineUpdate(s.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">₺</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="relative inline-block w-32">
                        <input 
                          type="number"
                          className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 text-sm font-bold focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all dark:text-slate-200"
                          value={s.baseSalary || 0}
                          onChange={(e) => handleInlineUpdate(s.id, 'baseSalary', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">₺</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => togglePaymentStatus(s.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                          getPaymentStatus(s.id) === 'Paid'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {getPaymentStatus(s.id) === 'Paid' ? (
                          <><CheckCircle2 size={12} /> Ödendi</>
                        ) : (
                          <><Clock size={12} /> Bekliyor</>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-black text-slate-900 dark:text-white">{s.totalEarnings.toLocaleString('tr-TR')} ₺</div>
                      <div className="text-[9px] text-green-600 dark:text-green-400 font-bold mt-0.5">+{s.variableEarnings.toLocaleString('tr-TR')} ₺ Mesai</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedStaff(s);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-slate-400 hover:text-green-600 transition-all opacity-0 group-hover:opacity-100"
                          title="Detaylı Hakediş Dökümü"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/staff/${s.id}`)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100"
                          title="Personel Profili"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                      Aranan kriterlere uygun personel bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <Receipt size={14} />
                  <span>Fatura Listesi</span>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                  {(['all', 'draft', 'sent', 'paid'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setInvoiceStatus(status)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        invoiceStatus === status 
                          ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {status === 'all' ? 'Tümü' : status === 'draft' ? 'Taslak' : status === 'sent' ? 'Gönderildi' : 'Ödendi'}
                    </button>
                  ))}
                </div>
              </div>
              <Button icon={<Plus size={18} />}>Yeni Fatura</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Fatura No / Firma</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Kategori</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Tarih</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Durum</th>
                    <th className="py-4 px-6 font-bold text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-right">Tutar</th>
                    <th className="py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{inv.id}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{inv.company}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{inv.category}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {new Date(inv.date).toLocaleDateString('tr-TR')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                          inv.status === 'paid' 
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                            : inv.status === 'sent'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
                        }`}>
                          {inv.status === 'paid' ? 'Ödendi' : inv.status === 'sent' ? 'Gönderildi' : 'Taslak'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-black text-slate-900 dark:text-white">{inv.amount.toLocaleString('tr-TR')} ₺</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100">
                            <FileText size={18} />
                          </button>
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`${selectedStaff?.name} - Hakediş Detayı`}
        size="lg"
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sabit Maaş</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{(selectedStaff.baseSalary || 0).toLocaleString('tr-TR')} ₺</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Mesai Kazancı</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{selectedStaff.variableEarnings.toLocaleString('tr-TR')} ₺</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Toplam Süre</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">{selectedStaff.workHours.toFixed(1)} sa</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 shadow-sm shadow-green-500/10">
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Genel Toplam</p>
                <p className="text-lg font-black text-green-600 dark:text-green-400">{selectedStaff.totalEarnings.toLocaleString('tr-TR')} ₺</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Operasyon Bazlı Döküm ({selectedStaff.appointments.length})</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedStaff.appointments.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-green-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{app.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          {new Date(app.date).toLocaleDateString('tr-TR')} • {app.startTime}-{app.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {((app.durationMinutes / 60) * selectedStaff.hourlyRate).toLocaleString('tr-TR')} ₺
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{Math.floor(app.durationMinutes / 60)}sa {app.durationMinutes % 60}dk</p>
                    </div>
                  </div>
                ))}
                {selectedStaff.appointments.length === 0 && (
                  <div className="py-12 text-center text-slate-400 italic text-sm">
                    Bu dönemde tamamlanmış operasyon bulunmuyor.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Kapat</Button>
              <Button 
                variant={getPaymentStatus(selectedStaff.id) === 'Paid' ? 'secondary' : 'primary'}
                onClick={() => {
                  togglePaymentStatus(selectedStaff.id);
                  setIsDetailModalOpen(false);
                }}
                icon={getPaymentStatus(selectedStaff.id) === 'Paid' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
              >
                {getPaymentStatus(selectedStaff.id) === 'Paid' ? 'Ödemeyi Geri Al' : 'Ödendi Olarak İşaretle'}
              </Button>
              <Button 
                variant="outline" 
                icon={<Download size={16} />}
                onClick={() => generateStaffFinancePDF(
                  selectedStaff, 
                  selectedStaff, 
                  months[selectedMonth], 
                  selectedYear, 
                  institution
                )}
              >
                Personel Raporu (PDF)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Finance;
