
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { QuickActions } from '../components/QuickActions';
import {
    Building2, FileText, Activity, DollarSign,
    ArrowUpRight, ArrowDownRight, MoreHorizontal,
    Calendar as CalendarIcon, CheckCircle2, Clock,
    Target, TrendingUp, Bell, Sparkles, Loader2, BrainCircuit
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const {
        companies, proposals, appointments, tasks,
        notifications, activityLogs
    } = useData();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Stats Calculations - Memoized for performance
    const statsData = useMemo(() => {
        const activeCompanies = companies.filter(c => c.status === 'Active').length;
        const pendingProposals = proposals.filter(p => p.status === 'Sent' || p.status === 'Draft').length;
        const activeOperations = appointments.filter(a => a.status === 'Planned').length;
        
        const monthlyRevenue = proposals
            .filter(p => p.status === 'Approved')
            .reduce((sum, p) => sum + p.totalAmount, 0);

        const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
        const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled').length;
        const totalAppointments = appointments.length;
        const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

        return {
            activeCompanies,
            pendingProposals,
            activeOperations,
            monthlyRevenue,
            completedAppointments,
            cancelledAppointments,
            totalAppointments,
            completionRate
        };
    }, [companies, proposals, appointments]);

    const runAiAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        // Maliyetsiz akıllı analiz simülasyonu (Kural tabanlı)
        setTimeout(() => {
            const insights = [];
            
            // Finansal Öngörü
            if (statsData.monthlyRevenue > 50000) {
                insights.push("Finansal performansınız bu ay hedeflerin üzerinde seyrediyor. Yeni yatırımlar için uygun bir dönem.");
            } else {
                insights.push("Ciro hedeflerinin gerisinde kalındı. Bekleyen tekliflerin takibini hızlandırmak kritik önemde.");
            }

            // Operasyonel Öngörü
            if (statsData.completionRate > 80) {
                insights.push("Operasyonel verimliliğiniz oldukça yüksek. Ekip kapasitesini yeni projeler için planlayabilirsiniz.");
            } else if (statsData.completionRate < 50) {
                insights.push("Operasyon tamamlama oranı düşük. Sahadaki aksaklıkları ve ekip dağılımını gözden geçirin.");
            }

            // Stratejik Öngörü
            if (statsData.pendingProposals > 10) {
                insights.push("Onay bekleyen teklif yoğunluğu var. Satış ekibinin bu firmalara öncelik vermesi ciroyu %20 artırabilir.");
            }

            // Gelişim Önerisi
            if (statsData.activeCompanies < 5) {
                insights.push("Müşteri portföyü daralma eğiliminde. Sektörel bazda yeni pazar araştırmaları önerilir.");
            } else {
                insights.push("Aktif firma sayınız stabil. Mevcut firmalardaki hizmet çeşitliliğini artırarak derinleşme sağlanabilir.");
            }

            setAiInsights(insights);
            setIsAnalyzing(false);
        }, 1200);
    }, [statsData]);

    useEffect(() => {
        runAiAnalysis();
    }, []);

    const sectorData = useMemo(() => {
        const counts: Record<string, number> = {};
        companies.forEach(c => {
            const sector = c.sector || 'Genel';
            counts[sector] = (counts[sector] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [companies]);

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

    // Chart data - Memoized
    const chartData = useMemo(() => [
        { name: 'Tem', ciro: 40000, hacim: 2400 },
        { name: 'Ağu', ciro: 55000, hacim: 1398 },
        { name: 'Eyl', ciro: 35000, hacim: 9800 },
        { name: 'Eki', ciro: 50000, hacim: 3908 },
        { name: 'Kas', ciro: 25000, hacim: 4800 },
        { name: 'Ara', ciro: statsData.monthlyRevenue || 65000, hacim: 3800 },
    ], [statsData.monthlyRevenue]);

    // Memoized StatCard component to prevent re-renders
    const StatCard = React.memo(({ title, value, icon, trend, trendValue, color, subText }: any) => (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                {icon}
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 text-current`}>
                        {icon}
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
                        {subText && <p className="text-xs text-slate-400">{subText}</p>}
                    </div>
                    {trend && (
                        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                            {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                            {trendValue}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ));
    StatCard.displayName = 'StatCard';

    return (
        <div className="min-h-screen pb-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Merhaba, {user?.name?.split(' ')[0] || 'Kullanıcı'} <span className="text-3xl animate-bounce">👋</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Bugün için <span className="font-semibold text-blue-600 dark:text-blue-400">{statsData.activeOperations} aktif operasyon</span> ve <span className="font-semibold text-amber-600 dark:text-amber-400">{statsData.pendingProposals} bekleyen teklifiniz</span> var.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-full">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-slate-500">
                                {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={runAiAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100"
                    >
                        {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        <span className="font-bold">AI Analiz</span>
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        <Activity size={18} />
                        <span className="hidden sm:inline font-medium">Verileri Güncelle</span>
                    </button>
                </div>
            </div>

            {/* AI Insights Panel - Moved to Top */}
            <div className="mb-8 bg-white dark:bg-slate-800 rounded-3xl p-1 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden group">
                <div className="bg-gradient-to-r from-violet-600/5 via-transparent to-indigo-600/5 dark:from-violet-500/10 dark:to-indigo-500/10 p-6 rounded-[22px] relative">
                    <div className="absolute top-0 right-0 p-6 text-violet-500/10 group-hover:text-violet-500/20 transition-colors pointer-events-none">
                        <BrainCircuit size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-2xl text-violet-600 dark:text-violet-400">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                        Stratejik Analiz Öngörüleri
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Sistem verileri gerçek zamanlı analiz edildi.</p>
                                </div>
                            </div>
                            <button 
                                onClick={runAiAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-slate-600 hover:border-violet-500 dark:hover:border-violet-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} className="text-violet-500" />}
                                <span className="text-sm font-bold">Yeniden Analiz Et</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {isAnalyzing && aiInsights.length === 0 ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
                                ))
                            ) : aiInsights.length > 0 ? (
                                aiInsights.map((insight, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-all shadow-sm group/item">
                                        <div className="mt-0.5 p-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-lg group-hover/item:scale-110 transition-transform shrink-0">
                                            <Sparkles size={12} />
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{insight}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 opacity-50">
                                    <BrainCircuit size={48} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm text-slate-400">Analiz başlatmak için butona tıklayın.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="TAMAMLANAN"
                    value={statsData.completedAppointments}
                    icon={<CheckCircle2 size={24} />}
                    color="text-emerald-600 dark:text-emerald-400"
                    trend="up"
                    trendValue={`%${statsData.completionRate}`}
                    subText="Başarı Oranı"
                />
                <StatCard
                    title="BEKLEYEN TEKLİF"
                    value={statsData.pendingProposals}
                    icon={<FileText size={24} />}
                    color="text-amber-600 dark:text-amber-400"
                    trend={statsData.pendingProposals > 5 ? "up" : "down"}
                    trendValue={`${statsData.pendingProposals} Adet`}
                    subText="Onay Bekleyen"
                />
                <StatCard
                    title="AKTİF OPERASYON"
                    value={statsData.activeOperations || '0'}
                    icon={<Activity size={24} />}
                    color="text-blue-600 dark:text-blue-400"
                    trend="up"
                    trendValue="Sahada"
                    subText="Devam Eden"
                />
                <StatCard
                    title="AYLIK CİRO"
                    value={`₺${(statsData.monthlyRevenue / 1000).toFixed(1)}K`}
                    icon={<DollarSign size={24} />}
                    color="text-violet-600 dark:text-violet-400"
                    trend="up"
                    trendValue="%24 büyüme"
                    subText="Bu ay toplam"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performans Analizi</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Son 6 aylık ciro ve operasyonel hacim</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">Ciro</button>
                                <button className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50 rounded-lg">Hacim</button>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ciro"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCiro)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-500" />
                                Sektör Dağılımı
                            </h3>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sectorData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {sectorData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {sectorData.slice(0, 4).map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-xs text-slate-500 truncate">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-blue-500" />
                                Operasyonel Verimlilik
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-500">Tamamlanma Oranı</span>
                                        <span className="font-bold text-slate-900 dark:text-white">%{statsData.completionRate}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-1000" 
                                            style={{ width: `${statsData.completionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tamamlanan</p>
                                        <p className="text-lg font-black text-emerald-600">{statsData.completedAppointments}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">İptal Edilen</p>
                                        <p className="text-lg font-black text-red-500">{statsData.cancelledAppointments}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity size={20} className="text-blue-500" />
                                Son Aktiviteler
                            </h3>
                            <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Tümünü Gör</button>
                        </div>
                        <div className="space-y-6">
                            {activityLogs?.slice(0, 4).map((log: any, i: number) => (
                                <div key={i} className="flex gap-4">
                                    <div className="relative">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20"></div>
                                        {i !== activityLogs.slice(0, 4).length - 1 && <div className="absolute top-4 left-1 w-px h-full bg-slate-100 dark:bg-slate-800"></div>}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{log.action || 'İşlem'}</h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{log.details || 'Detay bulunamadı'}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                            {new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {!activityLogs?.length && (
                                <div className="text-center py-8 text-slate-500 text-sm">Henüz aktivite kaydı yok.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <QuickActions />

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Target size={20} className="text-violet-500" />
                                Hedef Takibi
                            </h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-500">Aylık Ciro Hedefi</span>
                                    <span className="font-bold text-slate-900 dark:text-white">₺{(statsData.monthlyRevenue / 1000).toFixed(1)}K / ₺100K</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000" 
                                        style={{ width: `${Math.min((statsData.monthlyRevenue / 100000) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-500">Müşteri Kazanımı</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{statsData.activeCompanies} / 20</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000" 
                                        style={{ width: `${Math.min((statsData.activeCompanies / 20) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl mt-4">
                                <p className="text-sm text-violet-700 dark:text-violet-300 font-bold flex items-center gap-2">
                                    <TrendingUp size={16} /> 
                                    {statsData.completionRate > 70 ? 'Mükemmel Performans!' : 'Gelişim Alanı Mevcut'}
                                </p>
                                <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 leading-relaxed">
                                    Bu ayki operasyon tamamlama oranınız <span className="font-bold">%{statsData.completionRate}</span> seviyesinde.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yaklaşan Görevler</h3>
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                                <CalendarIcon size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {tasks?.filter(t => t.status !== 'Done').slice(0, 3).map((task, i) => (
                                <div key={i} className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-1.5 rounded-full border-2 ${task.priority === 'High' ? 'border-red-500' : 'border-blue-500'}`}></div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {task.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>

                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Tarih Yok'}
                                                </span>
                                                {task.priority === 'High' && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                                                        Acil
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!tasks?.filter(t => t.status !== 'Done').length && (
                                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                    <CalendarIcon size={32} className="mb-2 text-slate-300" />
                                    <p className="text-sm text-slate-400">Bugün için görev yok</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]">
                            + Yeni Görev Ekle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
