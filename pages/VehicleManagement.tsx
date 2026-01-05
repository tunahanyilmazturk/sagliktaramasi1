import React, { useState, useMemo } from 'react';
import { Equipment, FuelLog } from '../types';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, Building2, Check, 
  Download, FileText, X, FlaskConical, User, List, Grid3X3, Truck, Filter, 
  Stethoscope, MoreHorizontal, Plus, ClipboardList, ArrowRight,
  CalendarDays, Users, MapPin, AlertCircle, Video, MessageSquare, Bell,
  Edit3, Trash2, Copy, ExternalLink, RefreshCw, Search, ChevronDown, Zap, Gauge,
  Pencil, Fuel, BarChart3, PieChart as PieChartIcon, Activity, Navigation, ShieldCheck,
  History as HistoryIcon
} from 'lucide-react';

const VehicleManagement: React.FC = () => {
  const { equipment, appointments, addEquipment, updateEquipment, deleteEquipment, staff } = useData();
  const [activeTab, setActiveTab] = useState<'fleet' | 'analysis' | 'fuel'>('fleet');
  const [fuelReportFilter, setFuelReportFilter] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  // Filter for vehicles only
  const vehicles = equipment.filter(e => e.type === 'Vehicle');
  
  // Analytics Data
  const vehicleStats = useMemo(() => {
    const active = vehicles.filter(v => v.status === 'Active').length;
    const maintenance = vehicles.filter(v => v.status === 'Maintenance').length;
    const broken = vehicles.filter(v => v.status === 'Broken').length;
    return [
      { name: 'Aktif', value: active, color: '#10b981' },
      { name: 'Bakımda', value: maintenance, color: '#f59e0b' },
      { name: 'Arızalı', value: broken, color: '#ef4444' }
    ];
  }, [vehicles]);

  const fuelData = [
    { name: 'Pzt', lt: 45 },
    { name: 'Sal', lt: 52 },
    { name: 'Çar', lt: 38 },
    { name: 'Per', lt: 65 },
    { name: 'Cum', lt: 48 },
    { name: 'Cmt', lt: 20 },
    { name: 'Paz', lt: 15 },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Equipment>>({ type: 'Vehicle', status: 'Active', equipmentIds: [] });
  const [newFuelLog, setNewFuelLog] = useState<Partial<FuelLog>>({ date: new Date().toISOString().split('T')[0] });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const fuelLogs = useMemo(() => {
    // Demo verisi
    return [
      { id: '1', vehicleId: 'v1', date: '2023-12-01', amount: 2500, liters: 65, odometer: 45200 },
      { id: '2', vehicleId: 'v1', date: '2023-12-15', amount: 2800, liters: 70, odometer: 45950 },
    ] as FuelLog[];
  }, []);

  const fuelStats = useMemo(() => {
    const totalCost = fuelLogs.reduce((sum, log) => sum + log.amount, 0);
    const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    
    // Period-based Analysis
    const now = new Date();
    const startOfPeriod = new Date();
    if (fuelReportFilter === 'daily') startOfPeriod.setHours(0, 0, 0, 0);
    else if (fuelReportFilter === 'weekly') startOfPeriod.setDate(now.getDate() - 7);
    else if (fuelReportFilter === 'monthly') startOfPeriod.setMonth(now.getMonth() - 1);

    const periodLogs = fuelLogs.filter(log => new Date(log.date) >= startOfPeriod);
    const periodCost = periodLogs.reduce((sum, log) => sum + log.amount, 0);
    const periodLiters = periodLogs.reduce((sum, log) => sum + log.liters, 0);

    // Tüketim hesabı (Lt/100km)
    let totalConsumption = 0;
    let calculationCount = 0;
    
    vehicles.forEach(vehicle => {
      const logs = fuelLogs
        .filter(l => l.vehicleId === vehicle.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (logs.length >= 2) {
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const totalDistance = sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer;
        const totalLitersUsed = sortedLogs.slice(1).reduce((sum, l) => sum + l.liters, 0);
        
        if (totalDistance > 0) {
          totalConsumption += (totalLitersUsed / totalDistance) * 100;
          calculationCount++;
        }
      }
    });

    const avgConsumption = calculationCount > 0 ? totalConsumption / calculationCount : 0;

    return {
      totalCost,
      totalLiters,
      periodCost,
      periodLiters,
      avgConsumption,
      totalKm: vehicles.reduce((sum, v) => sum + (v.currentKm || 0), 0)
    };
  }, [fuelLogs, vehicles, fuelReportFilter]);

  const generatePDFReport = () => {
    toast.loading('PDF raporu hazırlanıyor...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Maliyet raporu indirildi.');
    }, 1500);
  };

  const handleOpenFuelModal = (vehicleId: string) => {
    setNewFuelLog({ vehicleId, date: new Date().toISOString().split('T')[0] });
    setIsFuelModalOpen(true);
  };

  const handleSaveFuelLog = () => {
    if (newFuelLog.amount && newFuelLog.liters && newFuelLog.odometer) {
      toast.success('Yakıt kaydı başarıyla eklendi.');
      setIsFuelModalOpen(false);
    } else {
      toast.error('Lütfen tüm alanları doldurun.');
    }
  };

  const medicalEquipment = useMemo(() => equipment.filter(e => e.type === 'Medical' && e.isVehicleEquipment), [equipment]);

  const handleOpenModal = (vehicle?: Equipment) => {
    if (vehicle) {
      setEditingVehicle({ ...vehicle, equipmentIds: vehicle.equipmentIds || [] });
    } else {
      setEditingVehicle({ type: 'Vehicle', status: 'Active', equipmentIds: [] });
    }
    setIsModalOpen(true);
  };

  const toggleEquipment = (id: string) => {
    setEditingVehicle(prev => {
      const currentIds = prev.equipmentIds || [];
      const newIds = currentIds.includes(id) 
        ? currentIds.filter(item => item !== id)
        : [...currentIds, id];
      return { ...prev, equipmentIds: newIds };
    });
  };

  const handleSave = () => {
    if (editingVehicle.name && editingVehicle.serialNumber) {
      if (editingVehicle.id) {
        updateEquipment(editingVehicle as Equipment);
        toast.success('Araç bilgileri güncellendi.');
      } else {
        const newVehicle: Equipment = {
          id: Math.random().toString(36).substr(2, 9),
          name: editingVehicle.name!,
          serialNumber: editingVehicle.serialNumber!,
          type: 'Vehicle',
          status: editingVehicle.status as any || 'Active',
          calibrationDate: editingVehicle.calibrationDate,
          nextInspectionDate: editingVehicle.nextInspectionDate,
          currentKm: editingVehicle.currentKm,
          assignedStaffId: editingVehicle.assignedStaffId,
          equipmentIds: editingVehicle.equipmentIds || []
        };
        addEquipment(newVehicle);
        toast.success('Yeni araç filoya eklendi.');
      }
      setIsModalOpen(false);
    } else {
      toast.error('Lütfen araç adı ve plaka bilgilerini doldurun.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      id,
      name
    });
  };

  const confirmDelete = () => {
    deleteEquipment(confirmModal.id);
    setConfirmModal({ isOpen: false, id: '', name: '' });
    toast.success('Araç filodan kaldırıldı.');
  };
  
  const getVehicleStatusStyles = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Maintenance':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Filo Yönetimi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Mobil sağlık araçları ve teknik donanım takip merkezi.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => handleOpenModal()} icon={<Plus size={18} />} className="shadow-lg shadow-blue-500/20">
            Yeni Araç Ekle
          </Button>
          <div className="px-5 py-2.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aktif Filo</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{vehicles.length} Araç</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher - Modern Pill Design */}
      <div className="flex p-1.5 bg-slate-100/80 dark:bg-slate-800/50 rounded-[2rem] w-fit border border-slate-200/60 dark:border-slate-700/60 shadow-inner backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('fleet')}
          className={`px-8 py-3 text-sm font-black rounded-[1.75rem] transition-all flex items-center gap-2.5 ${activeTab === 'fleet' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <Truck size={20} />
          Araç Parkı
        </button>
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`px-8 py-3 rounded-[1.75rem] text-sm font-black transition-all flex items-center gap-2.5 ${activeTab === 'analysis' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <BarChart3 size={20} />
          Performans Analizi
        </button>
        <button 
          onClick={() => setActiveTab('fuel')}
          className={`px-8 py-3 rounded-[1.75rem] text-sm font-black transition-all flex items-center gap-2.5 ${activeTab === 'fuel' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Fuel size={20} />
          Yakıt & Gider
        </button>
      </div>

      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const isMaintenanceSoon = vehicle.calibrationDate ? new Date(vehicle.calibrationDate).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 15 : false;
              const isOverdue = vehicle.calibrationDate ? new Date(vehicle.calibrationDate).getTime() < Date.now() : false;

              return (
                <div key={vehicle.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group relative">
                  {/* Status Gradient Bar */}
                  <div className={`h-2 w-full ${vehicle.status === 'Active' ? 'bg-emerald-500' : vehicle.status === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500 shadow-inner">
                          <Truck size={32} className={`${vehicle.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{vehicle.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500">{vehicle.serialNumber}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${getVehicleStatusStyles(vehicle.status)}`}>
                              {vehicle.status === 'Active' ? 'Aktif' : vehicle.status === 'Maintenance' ? 'Bakımda' : 'Arızalı'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => handleOpenModal(vehicle)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-blue-600 transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(vehicle.id, vehicle.name)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometre</p>
                        <div className="flex items-end gap-1">
                          <span className="text-xl font-black text-slate-900 dark:text-white">{(vehicle.currentKm || 0).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-1">KM</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Donanım</p>
                        <div className="flex items-end gap-1">
                          <span className="text-xl font-black text-slate-900 dark:text-white">{vehicle.equipmentIds?.length || 0}</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-1">Cihaz</span>
                        </div>
                      </div>
                    </div>

                    {/* Maintenance Section */}
                    <div className={`p-4 rounded-3xl border transition-colors mb-6 ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : isMaintenanceSoon ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-800/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className={isOverdue ? 'text-red-500' : isMaintenanceSoon ? 'text-amber-500' : 'text-emerald-500'} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teknik Bakım</span>
                        </div>
                        {isOverdue && <span className="text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">Süresi Geçti</span>}
                      </div>
                      <p className={`text-sm font-black ${isOverdue ? 'text-red-600' : isMaintenanceSoon ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {vehicle.calibrationDate ? new Date(vehicle.calibrationDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Planlanmadı'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-2xl h-11 text-xs font-black uppercase tracking-wider" onClick={() => handleOpenFuelModal(vehicle.id)}>
                        <Fuel size={14} className="mr-2" /> Yakıt Ekle
                      </Button>
                      <Button variant="primary" className="flex-1 rounded-2xl h-11 text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10">
                        Detaylı İncele
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="rounded-[2.5rem] p-8 border-none shadow-xl shadow-blue-500/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Filo Dağılımı</h3>
                <PieChartIcon size={20} className="text-blue-500" />
              </div>
              <div className="h-[240px] w-full min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <PieChart>
                    <Pie
                      data={vehicleStats}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {vehicleStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {vehicleStats.map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mb-1">{stat.name}</p>
                    <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[2.5rem] p-8 border-none shadow-xl shadow-indigo-500/5 xl:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Günlük Yakıt Tüketimi (Lt)</h3>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button className="px-4 py-1.5 text-[10px] font-black uppercase bg-white dark:bg-slate-700 text-indigo-600 rounded-lg shadow-sm">Haftalık</button>
                  <button className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-400">Aylık</button>
                </div>
              </div>
              <div className="h-[240px] w-full min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart data={fuelData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="lt" fill="url(#barGradient)" radius={[10, 10, 10, 10]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Tüketim Analizi</p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Bu haftaki toplam yakıt tüketimi geçen haftaya göre <strong className="text-indigo-900 dark:text-indigo-100">%12 daha düşük</strong> seyrediyor.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Filo Verimliliği', value: '%94', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Aktif Rotalar', value: '8', icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Kritik Bakımlar', value: '2', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Yedek Parça Stok', value: 'Normal', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'fuel' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                  <BarChart3 size={24} />
                </div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Toplam Maliyet</p>
              </div>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white relative z-10">₺{fuelStats.totalCost.toLocaleString('tr-TR')}</h3>
              <div className="mt-6 flex items-center justify-between relative z-10">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  {['daily', 'weekly', 'monthly'].map((p) => (
                    <button 
                      key={p}
                      onClick={() => setFuelReportFilter(p as any)}
                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${fuelReportFilter === p ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {p === 'daily' ? 'Gün' : p === 'weekly' ? 'Hafta' : 'Ay'}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800">
                  ₺{fuelStats.periodCost.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600">
                  <Zap size={24} />
                </div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Verimlilik</p>
              </div>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white relative z-10">{fuelStats.avgConsumption > 0 ? fuelStats.avgConsumption.toFixed(1) : '-'} <span className="text-lg font-bold text-slate-400">Lt</span></h3>
              <div className="mt-6 flex items-center justify-between relative z-10">
                <span className="text-xs text-slate-400 font-medium">Filo Ortalaması (100km)</span>
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-800">
                  <Activity size={14} />
                  A+ Sınıfı
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                  <HistoryIcon size={24} />
                </div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Toplam Yol</p>
              </div>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white relative z-10">{fuelStats.totalKm.toLocaleString('tr-TR')} <span className="text-lg font-bold text-slate-400">KM</span></h3>
              <div className="mt-6 flex items-center justify-between relative z-10">
                <span className="text-xs text-slate-400 font-medium">Aktif Operasyon</span>
                <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800">
                  {vehicles.length} Aktif Araç
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Fuel size={24} className="text-blue-500" /> Yakıt & Sarfiyat Geçmişi
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Araç bazlı otomatik tüketim ve maliyet analizi.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={generatePDFReport} className="rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-wider">
                  <Download size={16} className="mr-2" /> PDF Rapor
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleOpenFuelModal(vehicles[0]?.id)} className="rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-wider">
                  <Plus size={16} className="mr-2" /> Yeni Kayıt
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Araç & Plaka</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">İşlem Tarihi</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Miktar</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Birim Fiyat</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Tutar</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Kilometre</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tüketim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {vehicles.length > 0 ? vehicles.map(vehicle => {
                    const vehicleLogs = fuelLogs
                      .filter(l => l.vehicleId === vehicle.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    return vehicleLogs.map((log, index) => {
                      const prevLog = vehicleLogs[index + 1];
                      const consumption = prevLog ? ((log.liters / (log.odometer - prevLog.odometer)) * 100).toFixed(1) : null;
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{vehicle.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{vehicle.serialNumber}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{new Date(log.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.liters} Lt</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500 font-medium">₺{(log.amount / log.liters).toFixed(2)}/Lt</td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-black text-blue-600">₺{log.amount.toLocaleString('tr-TR')}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Gauge size={14} className="text-slate-300" />
                              {log.odometer.toLocaleString('tr-TR')} km
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {consumption ? (
                              <div className="inline-flex flex-col items-end">
                                <span className={`text-sm font-black ${parseFloat(consumption) > 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {consumption} Lt
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">/ 100 KM</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 italic">İlk kayıt</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  }) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Fuel size={40} className="opacity-20" />
                          <p className="text-sm">Henüz yakıt kaydı bulunmuyor.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Log Modal */}
      <Modal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        title="Yakıt İkmali Kaydı"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFuelModalOpen(false)} className="rounded-2xl px-6">Vazgeç</Button>
            <Button onClick={handleSaveFuelLog} className="rounded-2xl px-8 shadow-lg shadow-blue-500/20">Kaydı İşle</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800/50">
            <div className="h-14 w-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Fuel size={28} />
            </div>
            <div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em]">Operasyonel Gider</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Yeni Yakıt Girişi</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">İşlem Tarihi</label>
              <input 
                type="date"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:[color-scheme:dark] font-bold" 
                value={newFuelLog.date} 
                onChange={(e) => setNewFuelLog({...newFuelLog, date: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Miktar (Litre)</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-black" 
                  placeholder="0.00"
                  value={newFuelLog.liters || ''} 
                  onChange={(e) => setNewFuelLog({...newFuelLog, liters: parseFloat(e.target.value)})} 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">LT</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Toplam Tutar</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" 
                  placeholder="0.00"
                  value={newFuelLog.amount || ''} 
                  onChange={(e) => setNewFuelLog({...newFuelLog, amount: parseFloat(e.target.value)})} 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500">₺</span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Güncel Kilometre (KM)</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-black" 
                  placeholder="Örn: 45200"
                  value={newFuelLog.odometer || ''} 
                  onChange={(e) => setNewFuelLog({...newFuelLog, odometer: parseInt(e.target.value)})} 
                />
                <Gauge size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle.id ? "Araç Profilini Güncelle" : "Filoya Yeni Araç Kat"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-2xl px-6">İptal</Button>
            <Button onClick={handleSave} className="rounded-2xl px-10 shadow-lg shadow-blue-500/20">Kaydet ve Yayınla</Button>
          </>
        }
      >
        <div className="space-y-8">
          {/* Vehicle ID Card Visual - Ultra Modern */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="h-28 w-28 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                <Truck size={48} className="text-blue-400 drop-shadow-glow" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/80">Filo Envanter Kartı</span>
                  <div className={`h-2 w-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] ${editingVehicle.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                </div>
                
                <h3 className="text-3xl font-black truncate leading-none tracking-tight mb-3">
                  {editingVehicle.name || 'Yeni Araç Ünitesi'}
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PLAKA</span>
                    <span className="text-xs font-black font-mono text-blue-300">{editingVehicle.serialNumber || '-------'}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DURUM</span>
                    <span className={`text-[10px] font-black ${editingVehicle.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {editingVehicle.status === 'Active' ? 'AKTİF' : 'SERVİSTE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Tanımlayıcı İsim</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                value={editingVehicle.name || ''} 
                onChange={(e) => setEditingVehicle({...editingVehicle, name: e.target.value})} 
                placeholder="Örn: Mobil Tarama Ünitesi - 04" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Resmi Plaka / Seri No</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-black font-mono uppercase" 
                value={editingVehicle.serialNumber || ''} 
                onChange={(e) => setEditingVehicle({...editingVehicle, serialNumber: e.target.value})} 
                placeholder="Örn: 34 ABC 123" 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Operasyonel Durum</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none" 
                value={editingVehicle.status} 
                onChange={(e) => setEditingVehicle({...editingVehicle, status: e.target.value as any})}
              >
                <option value="Active">🟢 Aktif Kullanımda</option>
                <option value="Maintenance">🟡 Periyodik Bakımda</option>
                <option value="Broken">🔴 Arızalı / Pasif</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Mevcut Kilometre</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-black" 
                  value={editingVehicle.currentKm || ''} 
                  onChange={(e) => setEditingVehicle({...editingVehicle, currentKm: parseInt(e.target.value)})} 
                  placeholder="0" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">KM</span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Bakım & Muayene</label>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Son Teknik Bakım</label>
                  <input 
                    type="date"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none dark:[color-scheme:dark] font-bold" 
                    value={editingVehicle.calibrationDate ? editingVehicle.calibrationDate.split('T')[0] : ''} 
                    onChange={(e) => setEditingVehicle({...editingVehicle, calibrationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})} 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Gelecek Muayene</label>
                  <input 
                    type="date"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none dark:[color-scheme:dark] font-bold" 
                    value={editingVehicle.nextInspectionDate ? editingVehicle.nextInspectionDate.split('T')[0] : ''} 
                    onChange={(e) => setEditingVehicle({...editingVehicle, nextInspectionDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})} 
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Atama & Zimmet</label>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Sorumlu Personel</label>
                <select 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                  value={editingVehicle.assignedStaffId || ''} 
                  onChange={(e) => setEditingVehicle({...editingVehicle, assignedStaffId: e.target.value})}
                >
                  <option value="">Personel Seçin...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yerleşik Tıbbi Donanımlar</label>
                <span className="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                  {editingVehicle.equipmentIds?.length || 0} Seçili
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-4 border border-slate-200 dark:border-slate-700 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 custom-scrollbar">
                {medicalEquipment.map(equip => (
                  <div 
                    key={equip.id}
                    onClick={() => toggleEquipment(equip.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border duration-300 ${
                      editingVehicle.equipmentIds?.includes(equip.id)
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                      editingVehicle.equipmentIds?.includes(equip.id)
                        ? 'bg-white/20'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {editingVehicle.equipmentIds?.includes(equip.id) ? (
                        <Check size={12} strokeWidth={4} />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <span className={`text-[11px] font-black truncate ${editingVehicle.equipmentIds?.includes(equip.id) ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {equip.name}
                    </span>
                  </div>
                ))}
                {medicalEquipment.length === 0 && (
                  <div className="col-span-full py-8 text-center">
                    <AlertCircle size={32} className="mx-auto text-slate-300 mb-2 opacity-20" />
                    <p className="text-xs text-slate-400 font-medium italic">Sistemde araç içi kullanıma uygun tıbbi cihaz tanımlanmamış.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Aracı Sil"
        message={`"${confirmModal.name}" plaka/isimli aracı filodan kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Aracı Sil"
        variant="danger"
      />
    </div>
  );
};

export default VehicleManagement;
