
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import {
    ArrowLeft, ArrowRight, Building2, Calendar, CheckCircle2,
    FlaskConical, Users, Settings, Save, Search, Truck, X, Plus, User, Shield, AlertCircle, MessageCircle, Clock
} from 'lucide-react';
import { sendWhatsAppMessage, formatScreeningMessage } from '../utils/whatsapp';
import { Appointment, Equipment } from '../types'; // Added Equipment type
import toast from 'react-hot-toast';

const CreateScreening: React.FC = () => {
    const navigate = useNavigate();
    const { companies, tests, staff, equipment, addAppointment, addEquipment } = useData();

    // Wizard State
    const [step, setStep] = useState(1);

    // Form State
    const [formData, setFormData] = useState<{
        companyId: string;
        title: string;
        date: string; // date format (YYYY-MM-DD)
        startTime: string; // HH:mm format
        endTime: string; // HH:mm format
        type: 'Screening' | 'Training' | 'Consultation' | 'Vehicle';
        testIds: string[];
        staffIds: string[];
        equipmentIds: string[];
    }>({
        companyId: '',
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        type: 'Screening',
        testIds: [],
        staffIds: [],
        equipmentIds: []
    });

    const durationMinutes = useMemo(() => {
        if (!formData.startTime || !formData.endTime) return 0;
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        return end > start ? end - start : 0;
    }, [formData.startTime, formData.endTime]);

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m} dk`;
        if (m === 0) return `${h} sa`;
        return `${h} sa ${m} dk`;
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [inventoryTab, setInventoryTab] = useState<'Equipment' | 'Vehicle'>('Equipment');
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ name: '', serialNumber: '' });

    // --- Step 1 Handlers (Details) ---
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-generate title when company changes
            if (name === 'companyId') {
                const selectedCompany = companies.find(c => c.id === value);
                if (selectedCompany) {
                    newData.title = `${selectedCompany.name} - Sağlık Taraması`;
                }
            }

            return newData;
        });
    };

    // --- Step 2 Handlers (Tests) ---
    const toggleTest = (id: string) => {
        setFormData(prev => ({
            ...prev,
            testIds: prev.testIds.includes(id)
                ? prev.testIds.filter(t => t !== id)
                : [...prev.testIds, id]
        }));
    };

    // --- Step 3 Handlers (Staff) ---
    const toggleStaff = (id: string) => {
        setFormData(prev => ({
            ...prev,
            staffIds: prev.staffIds.includes(id)
                ? prev.staffIds.filter(s => s !== id)
                : [...prev.staffIds, id]
        }));
    };

    // --- Step 4 Handlers (Equipment) ---
    const toggleEquipment = (id: string) => {
        setFormData(prev => ({
            ...prev,
            equipmentIds: prev.equipmentIds.includes(id)
                ? prev.equipmentIds.filter(e => e !== id)
                : [...prev.equipmentIds, id]
        }));
    };

    // --- Final Save ---
    const handleSave = () => {
        if (!formData.companyId || !formData.title || !formData.date) {
            toast.error("Lütfen temel bilgileri eksiksiz doldurun.");
            return;
        }

        const newAppointment: Appointment = {
            id: Math.random().toString(36).substr(2, 9),
            companyId: formData.companyId,
            title: formData.title,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            durationMinutes: durationMinutes,
            type: formData.type,
            status: 'Planned',
            staffIds: formData.staffIds,
            testIds: formData.testIds,
            equipmentIds: formData.equipmentIds
        };

        addAppointment(newAppointment);
        toast.success("Tarama planı başarıyla oluşturuldu!");
        navigate('/screenings');
    };

    // Helper: Filter logic for lists
    const filterList = (list: any[], keys: string[]) => {
        if (!searchTerm) return list;
        return list.filter(item =>
            keys.some(key => item[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const activeEquipment = equipment.filter(e => e.status === 'Active' && e.type !== 'Vehicle');
    const activeVehicles = equipment.filter(e => e.status === 'Active' && e.type === 'Vehicle');

    const steps = [
        { id: 1, label: 'Detaylar', icon: <Calendar size={18} /> },
        { id: 2, label: 'Kapsam', icon: <FlaskConical size={18} /> },
        { id: 3, label: 'Ekip', icon: <Users size={18} /> },
        { id: 4, label: 'Envanter', icon: <Truck size={18} /> },
        { id: 5, label: 'Onay', icon: <CheckCircle2 size={18} /> }
    ];

    const StepsIndicator = () => (
        <div className="flex items-center justify-between mb-12 max-w-4xl mx-auto px-4">
            {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center gap-2 relative">
                        <button
                            onClick={() => s.id < step && setStep(s.id)}
                            disabled={s.id > step}
                            className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold transition-all duration-500 relative z-10 ${step === s.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 ring-4 ring-blue-500/5'
                                : step > s.id
                                    ? 'bg-green-500 text-white shadow-sm cursor-pointer hover:scale-105'
                                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700'
                                }`}>
                            {step > s.id ? <CheckCircle2 size={24} strokeWidth={2.5} /> : s.icon}
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${step === s.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                            {s.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className="flex-1 h-0.5 mx-4 -mt-6 relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-full">
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-700 ease-in-out"
                                style={{ transform: `translateX(${step > s.id ? '0%' : '-100%'})` }}
                            />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="w-full space-y-6 animate-fade-in-up pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/screenings')}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 shadow-sm transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Yeni Tarama Planla</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">{steps[step - 1].label} adımındasınız</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none pt-0.5">Otomatik Kayıt</span>
                </div>
            </div>

            <StepsIndicator />

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {/* STEP 1: DETAILS */}
                {step === 1 && (
                    <div className="p-10 space-y-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Operasyon Yapılacak Firma</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <select
                                        name="companyId"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-10 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold appearance-none"
                                        value={formData.companyId}
                                        onChange={handleDetailChange}
                                    >
                                        <option value="">Firma Seçiniz...</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ArrowRight size={14} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Operasyon Kategorisi</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <select
                                        name="type"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-10 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold appearance-none"
                                        value={formData.type}
                                        onChange={handleDetailChange}
                                    >
                                        <option value="Screening">Mobil Tarama (Araçlı)</option>
                                        <option value="Consultation">Yerinde Hizmet</option>
                                        <option value="Training">Eğitim</option>
                                        <option value="Vehicle">Araç Bakım</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ArrowRight size={14} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Operasyon Başlığı</label>
                            <div className="relative">
                                <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    name="title"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                                    placeholder="Örn: HanTech Sağlık Taraması - 2024"
                                    value={formData.title}
                                    onChange={handleDetailChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Planlanan Tarih</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        name="date"
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold [color-scheme:light] dark:[color-scheme:dark]"
                                        value={formData.date}
                                        onChange={handleDetailChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Başlangıç Saati</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input
                                            name="startTime"
                                            type="time"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold [color-scheme:light] dark:[color-scheme:dark]"
                                            value={formData.startTime}
                                            onChange={handleDetailChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Bitiş Saati</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input
                                            name="endTime"
                                            type="time"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold [color-scheme:light] dark:[color-scheme:dark]"
                                            value={formData.endTime}
                                            onChange={handleDetailChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {durationMinutes > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tahmini Süre</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{formatDuration(durationMinutes)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mesai</p>
                                        <p className="text-xs font-bold text-slate-500">{durationMinutes > 480 ? 'Fazla Mesai' : 'Normal Mesai'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: TESTS */}
                {step === 2 && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Kapsamdaki Testler</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{formData.testIds.length} Test Seçildi</p>
                                </div>
                                <div className="relative w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                                    <input
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                        placeholder="Hızlı arama..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 min-h-[40px]">
                                {formData.testIds.map(id => {
                                    const t = tests.find(test => test.id === id);
                                    if (!t) return null;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => toggleTest(id)}
                                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-tight hover:bg-red-500 transition-all hover:scale-105"
                                        >
                                            {t.name}
                                            <X size={12} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[480px]">
                            {filterList(tests, ['name', 'category'])
                                .filter((test: any) => !formData.testIds.includes(test.id))
                                .map((test: any) => (
                                    <button
                                        key={test.id}
                                        onClick={() => toggleTest(test.id)}
                                        className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm transition-all text-left flex flex-col justify-between h-full group"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <FlaskConical size={16} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{test.category}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{test.name}</h4>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all">
                                            <span>Planlamaya Ekle</span>
                                            <Plus size={12} strokeWidth={3} />
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: STAFF */}
                {step === 3 && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="relative w-full max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
                                <input
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium"
                                    placeholder="İsim veya uzmanlık ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex -space-x-3 overflow-hidden">
                                    {formData.staffIds.map((id, idx) => (
                                        <div key={id} className="inline-block h-10 w-10 rounded-2xl ring-4 ring-white dark:ring-slate-800 bg-green-500 flex items-center justify-center text-white font-bold text-xs border border-white dark:border-slate-700 shadow-lg" style={{ zIndex: 10 - idx }}>
                                            {staff.find(s => s.id === id)?.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-100 dark:border-green-900/30 uppercase tracking-widest leading-none pt-2.5">
                                    {formData.staffIds.length} Görevli
                                </span>
                            </div>
                        </div>
                        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[500px]">
                            {filterList(staff, ['name', 'role']).map((person: any) => (
                                <button
                                    key={person.id}
                                    onClick={() => toggleStaff(person.id)}
                                    className={`group p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative overflow-hidden ${formData.staffIds.includes(person.id)
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-md shadow-green-500/5'
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-900 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 h-full">
                                        <div className={`p-4 rounded-2xl transition-colors duration-300 ${formData.staffIds.includes(person.id)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 group-hover:text-green-600'
                                            }`}>
                                            <User size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate pr-6 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{person.name}</h4>
                                                {formData.staffIds.includes(person.id) && <CheckCircle2 size={16} className="text-green-600 absolute top-5 right-5" strokeWidth={3} />}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">{person.title}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter border border-slate-200/60 dark:border-slate-700">
                                                    <Shield size={10} strokeWidth={3} />
                                                    {person.role === 'Doctor' ? 'Doktor' : person.role === 'Nurse' ? 'Hemşire' : 'Sağlık Personeli'}
                                                </div>
                                                {durationMinutes > 0 && formData.staffIds.includes(person.id) && (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter border border-blue-100 dark:border-blue-800">
                                                        <Clock size={10} strokeWidth={3} />
                                                        {formatDuration(durationMinutes)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: EQUIPMENT & VEHICLES */}
                {step === 4 && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <button
                                        onClick={() => { setInventoryTab('Equipment'); setSearchTerm(''); }}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${inventoryTab === 'Equipment' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Tıbbi Cihazlar
                                    </button>
                                    <button
                                        onClick={() => { setInventoryTab('Vehicle'); setSearchTerm(''); }}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${inventoryTab === 'Vehicle' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Araç Filosu
                                    </button>
                                </div>
                                {inventoryTab === 'Vehicle' && (
                                    <button
                                        onClick={() => setShowAddVehicle(!showAddVehicle)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-900/30 text-xs font-bold uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={14} /> Yeni Araç Kaydet
                                    </button>
                                )}
                            </div>

                            {showAddVehicle && inventoryTab === 'Vehicle' && (
                                <div className="mb-6 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Araç Adı / Marka</label>
                                        <input
                                            className="bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                                            placeholder="Örn: Mobil Ünite 1"
                                            value={newVehicle.name}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Plaka / Seri No</label>
                                        <input
                                            className="w-36 bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                                            placeholder="34 ABC 123"
                                            value={newVehicle.serialNumber}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, serialNumber: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (newVehicle.name && newVehicle.serialNumber) {
                                                const v: Equipment = {
                                                    id: Math.random().toString(36).substr(2, 9),
                                                    name: newVehicle.name,
                                                    serialNumber: newVehicle.serialNumber,
                                                    type: 'Vehicle',
                                                    status: 'Active'
                                                };
                                                addEquipment(v);
                                                setNewVehicle({ name: '', serialNumber: '' });
                                                setShowAddVehicle(false);
                                                toast.success('Yeni araç filoya eklendi');
                                            } else {
                                                toast.error('Lütfen araç adı ve plaka/seri no girin.');
                                            }
                                        }}
                                        className="bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-colors"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="relative w-full max-w-md group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                    <input
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-400/10 focus:border-slate-400 transition-all font-medium"
                                        placeholder={inventoryTab === 'Equipment' ? "Cihaz ara..." : "Araç/Plaka ara..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-2 rounded-xl border uppercase tracking-widest leading-none pt-2.5 transition-colors ${inventoryTab === 'Equipment' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100'}`}>
                                    {formData.equipmentIds.filter(id => (inventoryTab === 'Equipment' ? activeEquipment : activeVehicles).some(e => e.id === id)).length} Seçili
                                </span>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[500px]">
                            {filterList(inventoryTab === 'Equipment' ? activeEquipment : activeVehicles, ['name', 'serialNumber']).map((item: Equipment) => (
                                <button
                                    key={item.id}
                                    onClick={() => toggleEquipment(item.id)}
                                    className={`group p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative overflow-hidden ${formData.equipmentIds.includes(item.id)
                                        ? inventoryTab === 'Equipment' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md shadow-blue-500/5' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 shadow-md shadow-purple-500/5'
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl transition-colors duration-300 ${formData.equipmentIds.includes(item.id)
                                            ? inventoryTab === 'Equipment' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                                            }`}>
                                            {item.type === 'Vehicle' ? <Truck size={24} strokeWidth={2} /> : <Settings size={24} strokeWidth={2} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className={`font-bold text-slate-900 dark:text-white truncate ${formData.equipmentIds.includes(item.id) ? (inventoryTab === 'Equipment' ? 'text-blue-700' : 'text-purple-700') : ''}`}>{item.name}</h4>
                                                {formData.equipmentIds.includes(item.id) && <CheckCircle2 size={16} className={inventoryTab === 'Equipment' ? 'text-blue-600' : 'text-purple-600'} strokeWidth={3} />}
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{item.type === 'Vehicle' ? 'Plaka:' : 'Seri No:'} {item.serialNumber}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 5: REVIEW (Minimalist) */}
                {step === 5 && (
                    <div className="p-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Operasyon Onayı</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Lütfen planlanan tarama detaylarını kontrol edin.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-900">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kurum / Operasyon</p>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{companies.find(c => c.id === formData.companyId)?.name || '-'}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planlanan Zaman</p>
                                            <h4 className="font-bold text-slate-900 dark:text-white">
                                                {formData.date ? new Date(formData.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                                <span className="text-blue-500 ml-2 font-bold">{formData.date ? new Date(formData.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                        <p className="text-3xl font-bold text-blue-600 mb-1">{formData.testIds.length}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sağlık Testi</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                        <p className="text-3xl font-bold text-green-600 mb-1">{formData.staffIds.length}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personel</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center col-span-2">
                                        <div className="flex items-center justify-center gap-3">
                                            <p className="text-3xl font-bold text-purple-600">{formData.equipmentIds.length}</p>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Toplam Kaynak</p>
                                                <p className="text-xs text-slate-500 font-medium">Cihaz ve Araç</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 text-center">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">"{formData.title}" başlığı ile operasyon planı oluşturulacaktır.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 max-w-4xl mx-auto w-full px-4">
                <button
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${step === 1
                        ? 'opacity-0 pointer-events-none'
                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95'
                        }`}
                >
                    <ArrowLeft size={18} strokeWidth={2} /> Geri Dön
                </button>

                {step < 5 ? (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStep(s => Math.min(5, s + 1));
                        }}
                        className="flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                    >
                        Sonraki Adım <ArrowRight size={18} strokeWidth={2} />
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-bold bg-green-600 text-white shadow-md shadow-green-500/20 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                    >
                        <Save size={18} strokeWidth={2} /> Operasyonu Onayla
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreateScreening;
