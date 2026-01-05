
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';
import {
  Plus, Search, Tag, Pencil, Trash2, FlaskConical, Download, Stethoscope,
  Truck, Monitor, Box, Calendar, AlertTriangle, PenTool, UploadCloud, Gauge,
  Settings, Thermometer, Filter, Microscope, Building2
} from 'lucide-react';
import { HealthTest, Equipment } from '../types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

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

const TestPool: React.FC = () => {
  const { tests, addTest, addTests, updateTest, deleteTest, exportToExcel, equipment, staff, addEquipment, updateEquipment, deleteEquipment, definitions } = useData();
  const [activeTab, setActiveTab] = useState<'tests' | 'equipment'>('tests');

  // Test State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [editingTest, setEditingTest] = useState<Partial<HealthTest>>({});
  const [testPage, setTestPage] = useState(1);
  const [testItemsPerPage, setTestItemsPerPage] = useState(10);

  // Equipment State
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [equipStep, setEquipStep] = useState<'selection' | 'form'>('selection');
  const [equipSearchQuery, setEquipSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<Partial<Equipment>>({ type: 'Medical', status: 'Active', isVehicleEquipment: false });
  const [equipPage, setEquipPage] = useState(1);
  const [equipItemsPerPage, setEquipItemsPerPage] = useState(10);
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

  // --- STATS LOGIC ---
  const stats = useMemo(() => {
    const totalTests = tests.length;
    const totalEquipment = equipment.length;
    const medicalEquip = equipment.filter(e => e.type === 'Medical').length;
    const consumables = equipment.filter(e => e.type === 'Consumable').length;
    
    const totalPotentialRevenue = tests.reduce((sum, t) => sum + t.price, 0);
    const avgProfitMargin = tests.length > 0 
      ? Math.round((tests.reduce((sum, t) => sum + (t.price - (t.cost || 0)), 0) / totalPotentialRevenue) * 100) 
      : 0;

    return { totalTests, totalEquipment, medicalEquip, consumables, avgProfitMargin };
  }, [tests, equipment]);

  // --- TEST LOGIC ---
  const filteredTests = useMemo(() => tests.filter(test =>
    test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
    test.category.toLowerCase().includes(testSearchQuery.toLowerCase())
  ), [tests, testSearchQuery]);

  const paginatedTests = useMemo(() => {
    const startIndex = (testPage - 1) * testItemsPerPage;
    return filteredTests.slice(startIndex, startIndex + testItemsPerPage);
  }, [filteredTests, testPage, testItemsPerPage]);

  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingTest(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };

  const handleOpenTestModal = (test?: HealthTest) => {
    if (test) {
      setEditingTest(test);
    } else {
      const defaultCategory = (definitions?.testCategories && definitions.testCategories.length > 0) 
        ? definitions.testCategories[0] 
        : 'Laboratuvar';
      setEditingTest({ 
        category: defaultCategory,
        name: '',
        price: 0,
        cost: 0,
        description: ''
      });
    }
    setIsTestModalOpen(true);
  };

  const handleDeleteTest = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Testi Sil',
      message: `"${name}" isimli testi silmek istediğinize emin misiniz?`,
      onConfirm: () => {
        deleteTest(id);
        toast.success('Test silindi.');
      }
    });
  };

  const handleSaveTest = () => {
    if (!editingTest.name) {
      toast.error('Lütfen test adını giriniz.');
      return;
    }
    if (editingTest.price === undefined || editingTest.price === null || editingTest.price <= 0) {
      toast.error('Lütfen geçerli bir birim fiyat giriniz.');
      return;
    }

    if (editingTest.id) {
      updateTest(editingTest as HealthTest);
      toast.success('Test başarıyla güncellendi.');
    } else {
      const test: HealthTest = {
        id: Math.random().toString(36).substr(2, 9),
        name: editingTest.name,
        category: editingTest.category || 'Genel',
        price: editingTest.price,
        cost: editingTest.cost || 0,
        description: editingTest.description || ''
      };
      addTest(test);
      toast.success('Yeni test başarıyla eklendi.');
    }
    setIsTestModalOpen(false);
    setEditingTest({});
  };

  const handleExportTests = () => {
    const data = tests.map(t => ({
      'Test Adı': t.name,
      'Kategori': t.category,
      'Fiyat (TL)': t.price,
      'Maliyet (TL)': t.cost || 0,
      'Tahmini Kâr (TL)': t.price - (t.cost || 0),
      'Açıklama': t.description || '-'
    }));
    exportToExcel(data, `HanTech_Test_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Bulk Upload Logic
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const newTests: HealthTest[] = [];
      let skippedCount = 0;

      data.forEach((row: any) => {
        const testName = row['Test Adı'];
        if (!testName) return;

        const exists = tests.some(t => t.name.toLowerCase() === testName.toLowerCase());
        if (exists) {
          skippedCount++;
          return;
        }

        newTests.push({
          id: Math.random().toString(36).substr(2, 9),
          name: testName,
          category: row['Kategori'] || 'Genel',
          price: parseFloat(row['Fiyat (TL)']) || 0,
          cost: parseFloat(row['Maliyet (TL)']) || 0,
          description: row['Açıklama'] || ''
        });
      });

      if (newTests.length > 0) {
        addTests(newTests);
      }

      if (skippedCount > 0) {
        toast.success(`${newTests.length} test eklendi, ${skippedCount} mevcut test pas geçildi.`);
      } else if (newTests.length === 0) {
        toast('Eklenecek yeni test bulunamadı.', { icon: 'ℹ️' });
      } else {
        toast.success('Tüm testler başarıyla yüklendi.');
      }

      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- EQUIPMENT LOGIC ---
  const filteredEquipment = useMemo(() => equipment.filter(item =>
    item.type !== 'Vehicle' && (
      item.name.toLowerCase().includes(equipSearchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(equipSearchQuery.toLowerCase())
    )
  ), [equipment, equipSearchQuery]);

  const consumables = useMemo(() => equipment.filter(e => e.type === 'Consumable'), [equipment]);
  const medicalEquipmentPool = useMemo(() => equipment.filter(e => e.type === 'Medical'), [equipment]);

  const paginatedEquipment = useMemo(() => {
    const startIndex = (equipPage - 1) * equipItemsPerPage;
    return filteredEquipment.slice(startIndex, startIndex + equipItemsPerPage);
  }, [filteredEquipment, equipPage, equipItemsPerPage]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Medical': return <Stethoscope size={20} />;
      case 'IT': return <Monitor size={20} />;
      case 'Consumable': return <Box size={20} />;
      case 'Other': return <Settings size={20} />;
      default: return <Box size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-800">Aktif</span>;
      case 'Maintenance': return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">Bakımda</span>;
      case 'Broken': return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800">Arızalı</span>;
      default: return null;
    }
  };

  const handleOpenEquipModal = (item?: Equipment) => {
    if (item) {
      setEditingItem(item);
      setEquipStep('form');
    } else {
      setEditingItem({ type: 'Medical', status: 'Active', isVehicleEquipment: false });
      setEquipStep('selection');
    }
    setIsEquipModalOpen(true);
  };

  const handleSaveEquipment = () => {
    if (editingItem.name) {
      if (editingItem.id) {
        updateEquipment(editingItem as Equipment);
        toast.success('Ekipman güncellendi.');
      } else {
        const newItem: Equipment = {
          id: Math.random().toString(36).substr(2, 9),
          name: editingItem.name,
          serialNumber: editingItem.serialNumber || '',
          type: editingItem.type as any,
          status: editingItem.status as any,
          calibrationDate: editingItem.calibrationDate,
          nextInspectionDate: editingItem.nextInspectionDate,
          currentKm: editingItem.currentKm,
          assignedStaffId: editingItem.assignedStaffId,
          quantity: editingItem.type === 'Consumable' ? editingItem.quantity : undefined,
          unit: editingItem.type === 'Consumable' ? editingItem.unit : undefined,
          isVehicleEquipment: editingItem.isVehicleEquipment
        };
        addEquipment(newItem);
        toast.success('Ekipman eklendi.');
      }
      setIsEquipModalOpen(false);
      setEditingItem({ type: 'Medical', status: 'Active', isVehicleEquipment: false });
    } else {
      toast.error('Lütfen ekipman adını doldurun.');
    }
  };

  const handleDeleteEquipment = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Ekipmanı Sil',
      message: `"${name}" isimli ekipmanı silmek istediğinize emin misiniz?`,
      onConfirm: () => {
        deleteEquipment(id);
        toast.success('Ekipman silindi.');
      }
    });
  };

  const isCalibrationExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Laboratuvar': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Diğer İşlemler': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Hizmetler & Envanter</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Fiyat listeleri, tıbbi cihaz ve araç yönetimi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Nav Tabs moved to header */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm mr-2">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'tests' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              <FlaskConical size={14} />
              Testler
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'equipment' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              <Settings size={14} />
              Cihazlar
            </button>
          </div>

          <div className="flex gap-2">
            {activeTab === 'tests' ? (
              <>
                <input type="file" id="bulk-upload" className="hidden" accept=".xlsx,.xls" onChange={handleBulkUpload} />
                <Button variant="outline" size="sm" icon={<UploadCloud size={16} />} onClick={() => document.getElementById('bulk-upload')?.click()}>Yükle</Button>
                <Button variant="outline" size="sm" icon={<Download size={16} />} onClick={handleExportTests}>Excel</Button>
                <Button size="sm" icon={<Plus size={16} />} onClick={() => handleOpenTestModal()}>Yeni Test</Button>
              </>
            ) : (
              <Button size="sm" icon={<Plus size={16} />} onClick={() => handleOpenEquipModal()}>Yeni Cihaz</Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tıbbi Hizmet"
          value={stats.totalTests}
          icon={Microscope}
          description="Test Kalemi"
          colorClass="bg-purple-500 text-purple-500"
        />
        <StatsCard
          title="Ort. Kâr Marjı"
          value={`%${stats.avgProfitMargin}`}
          icon={Gauge}
          description="Verimlilik"
          colorClass="bg-blue-500 text-blue-500"
        />
        <StatsCard
          title="Sarf Malzeme"
          value={stats.consumables}
          icon={Box}
          description="Stok Kalemi"
          colorClass="bg-emerald-500 text-emerald-500"
        />
        <StatsCard
          title="Kritik Stok"
          value={equipment.filter(e => e.type === 'Consumable' && (e.quantity || 0) < 10).length}
          icon={AlertTriangle}
          description="Düşük Seviye"
          colorClass="bg-amber-500 text-amber-500"
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-6">
        {activeTab === 'tests' && (
          <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm rounded-3xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-4">
              <div className="relative w-full max-w-md group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  className="pl-11 input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm group-focus-within:ring-2 ring-blue-100 dark:ring-blue-900/50"
                  placeholder="Test adı veya kategori ara..."
                  value={testSearchQuery}
                  onChange={(e) => { setTestSearchQuery(e.target.value); setTestPage(1); }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Hizmet Adı</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Kategori</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Birim Fiyat</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Maliyet / Kâr</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTests.map(test => {
                    const profit = test.price - (test.cost || 0);
                    const profitMargin = test.price > 0 ? Math.round((profit / test.price) * 100) : 0;
                    
                    return (
                      <tr key={test.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <FlaskConical size={18} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{test.name}</span>
                              {test.description && (
                                <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px] font-medium">{test.description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryColor(test.category)}`}>
                            <Tag size={12} />
                            {test.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-sm">{test.price.toFixed(2)} ₺</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">M: {(test.cost || 0).toFixed(2)} ₺</span>
                            <span className={`text-xs font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              K: {profit.toFixed(2)} ₺ (%{profitMargin})
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenTestModal(test)}
                              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-sm transition-all"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(test.id, test.name)}
                              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-600 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-sm transition-all"
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
            <div className="px-5">
              <Pagination
                totalItems={filteredTests.length}
                itemsPerPage={testItemsPerPage}
                currentPage={testPage}
                onPageChange={setTestPage}
                onItemsPerPageChange={setTestItemsPerPage}
              />
            </div>
          </Card>
        )}

        {activeTab === 'equipment' && (
          <div className="space-y-6">
            {/* Toolbar for Equipment */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md group w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  className="input pl-10 group-focus-within:ring-2 ring-blue-100 dark:ring-blue-900/50 shadow-sm"
                  placeholder="Cihaz adı veya seri no ara..."
                  value={equipSearchQuery}
                  onChange={(e) => { setEquipSearchQuery(e.target.value); setEquipPage(1); }}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Box size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{medicalEquipmentPool.length} Cihaz</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Tag size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{consumables.length} Sarf</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEquipment.map(item => {
                const expired = isCalibrationExpired(item.calibrationDate);
                const assignee = staff.find(s => s.id === item.assignedStaffId);

                return (
                  <div key={item.id} className={`group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${expired ? 'border-red-200 dark:border-red-900/50 shadow-red-100 dark:shadow-none' : 'border-slate-200/60 dark:border-slate-700/60 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${item.type === 'Medical' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                            item.type === 'Consumable' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                              item.type === 'IT' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                'bg-gradient-to-br from-slate-500 to-slate-600'
                          }`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md inline-block">{item.serialNumber}</p>
                            {item.type === 'Consumable' && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                                {item.quantity} {item.unit || 'Adet'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="space-y-3 mb-6 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl">
                      {/* Maintenance / Calibration Field */}
                      {item.type !== 'Consumable' && item.calibrationDate && (
                        <div className={`flex items-center justify-between text-sm ${expired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                          <div className="flex items-center gap-2">
                            <Thermometer size={16} />
                            <span>Kalibrasyon</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{new Date(item.calibrationDate).toLocaleDateString('tr-TR')}</span>
                            {expired && <AlertTriangle size={16} className="animate-pulse" />}
                          </div>
                        </div>
                      )}

                      {item.type === 'Consumable' && (
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Box size={16} />
                            <span>Stok Durumu</span>
                          </div>
                          <span className={item.quantity! < 10 ? 'text-red-500 font-bold' : 'font-medium'}>
                            {item.quantity! < 10 ? 'Kritik Seviye' : 'Yeterli'}
                          </span>
                        </div>
                      )}

                      {assignee ? (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700/50">
                          <div className="flex items-center gap-2 text-slate-500">
                            <PenTool size={16} />
                            <span>Zimmet</span>
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{assignee.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/50 italic">
                          <PenTool size={16} />
                          <span>Depoda / Zimmet Yok</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEquipModal(item)}>Düzenle</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteEquipment(item.id, item.name)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              totalItems={filteredEquipment.length}
              itemsPerPage={equipItemsPerPage}
              currentPage={equipPage}
              onPageChange={setEquipPage}
              onItemsPerPageChange={setEquipItemsPerPage}
            />

            {filteredEquipment.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Box size={48} className="mx-auto mb-4 opacity-20" />
                <p>Kayıtlı ekipman bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={editingTest.id ? "Testi Düzenle" : "Yeni Test Tanımla"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>İptal</Button>
            <Button onClick={handleSaveTest}>Kaydet</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-3 mb-2">
            <FlaskConical size={20} className="text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Tanımladığınız hizmetler teklif formlarında ve saha operasyonlarında seçilebilir olacaktır. Fiyatları sonradan güncelleyebilirsiniz.
            </p>
          </div>

          <div>
            <label className="label">Hizmet / Test Adı</label>
            <div className="relative">
              <input
                name="name"
                className="input pl-10"
                placeholder="Örn: Akciğer Grafisi"
                value={editingTest.name || ''}
                onChange={handleTestInputChange}
              />
              <FlaskConical size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Kategori</label>
              <div className="relative">
                <select
                  name="category"
                  className="input appearance-none dark:bg-slate-900 pl-10"
                  value={editingTest.category || ''}
                  onChange={handleTestInputChange}
                >
                  {(definitions?.testCategories || ['Laboratuvar', 'Diğer İşlemler']).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Tag size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>
            <div>
              <label className="label">Birim Satış Fiyatı (TL)</label>
              <div className="relative">
                <input
                  name="price"
                  type="number"
                  className="input pl-10"
                  placeholder="0.00"
                  value={editingTest.price || ''}
                  onChange={handleTestInputChange}
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tahmini Maliyet (TL)</label>
              <div className="relative">
                <input
                  name="cost"
                  type="number"
                  className="input pl-10"
                  placeholder="0.00"
                  value={editingTest.cost || ''}
                  onChange={(e) => setEditingTest(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Kâr analizi için kullanılır.</p>
            </div>
            <div className="flex items-end pb-2">
              {editingTest.price !== undefined && editingTest.cost !== undefined && editingTest.price > 0 && (
                <div className="w-full p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tahmini Kâr</span>
                  <span className={`text-sm font-bold ${editingTest.price - editingTest.cost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(editingTest.price - editingTest.cost).toLocaleString('tr-TR')} ₺ 
                    <span className="text-[10px] ml-1 font-normal">
                      (%{Math.round(((editingTest.price - editingTest.cost) / editingTest.price) * 100)})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Hizmet Açıklaması</label>
            <textarea
              name="description"
              className="input min-h-[100px] py-2 leading-relaxed"
              placeholder="Test içeriği, hazırlık süreci veya raporlama hakkında kısa notlar..."
              value={editingTest.description || ''}
              onChange={(e) => setEditingTest(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <Modal
        isOpen={isEquipModalOpen}
        onClose={() => setIsEquipModalOpen(false)}
        title={editingItem.id ? "Ekipmanı Düzenle" : "Yeni Ekipman Ekle"}
        footer={
          equipStep === 'form' ? (
            <>
              {!editingItem.id && (
                <Button variant="outline" onClick={() => setEquipStep('selection')}>Geri</Button>
              )}
              <Button variant="outline" onClick={() => setIsEquipModalOpen(false)}>İptal</Button>
              <Button onClick={handleSaveEquipment}>Kaydet</Button>
            </>
          ) : null
        }
      >
        {equipStep === 'selection' ? (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ekipman Lokasyonu</h3>
              <p className="text-sm text-slate-500">Lütfen ekipmanın nerede kullanılacağını seçin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setEditingItem(prev => ({ ...prev, isVehicleEquipment: true, type: 'Medical' }));
                  setEquipStep('form');
                }}
                className="group p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl hover:border-blue-500 transition-all text-left flex flex-col gap-4"
              >
                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Truck size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Araç İçi Ekipman</h4>
                  <p className="text-xs text-slate-500 mt-1">Mobil araçların içine monte edilen cihazlar.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setEditingItem(prev => ({ ...prev, isVehicleEquipment: false }));
                  setEquipStep('form');
                }}
                className="group p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl hover:border-emerald-500 transition-all text-left flex flex-col gap-4"
              >
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Genel Ekipman</h4>
                  <p className="text-xs text-slate-500 mt-1">Merkez ofis veya poliklinik içi envanter.</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Equipment ID Card Visual */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${editingItem.isVehicleEquipment ? 'from-blue-900 to-slate-900' : 'from-slate-800 to-slate-900'} rounded-3xl p-6 text-white shadow-xl border border-slate-700`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10 flex gap-6">
                <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  {editingItem.type === 'Medical' ? <Stethoscope size={40} className="text-emerald-400" /> :
                    editingItem.type === 'Consumable' ? <Box size={40} className="text-amber-400" /> :
                      editingItem.type === 'IT' ? <Monitor size={40} className="text-blue-400" /> :
                        <Settings size={40} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {editingItem.isVehicleEquipment ? 'Araç İçi Envanter' : 'Genel Envanter'}
                    </span>
                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${editingItem.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  </div>
                  <h3 className="text-xl font-bold truncate leading-tight tracking-tight">
                    {editingItem.name || 'Ekipman Adı'}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
                    S/N: {editingItem.serialNumber || '--------'}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold border border-white/10">
                      {editingItem.type === 'Medical' ? 'TIBBİ CİHAZ' :
                        editingItem.type === 'Consumable' ? 'SARF MALZEME' :
                          editingItem.type === 'IT' ? 'BİLİŞİM' : 'DİĞER'}
                    </span>
                    {editingItem.type === 'Consumable' && editingItem.quantity !== undefined && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/20 uppercase">
                        STOK: {editingItem.quantity} {editingItem.unit || 'ADET'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Ekipman Adı</label>
                <input
                  className="input"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Örn: Odyometre 2024"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Seri Numarası</label>
                <input
                  className="input"
                  value={editingItem.serialNumber || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, serialNumber: e.target.value })}
                  placeholder="Varsa S/N yazınız"
                />
              </div>

              <div>
                <label className="label">Tür</label>
                <div className="relative">
                  <select className="input appearance-none dark:bg-slate-900" value={editingItem.type} onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}>
                    <option value="Medical">Tıbbi Cihaz</option>
                    <option value="IT">Bilişim</option>
                    <option value="Consumable">Sarf Malzeme</option>
                    <option value="Other">Diğer</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div>
                <label className="label">Durum</label>
                <div className="relative">
                  <select className="input appearance-none dark:bg-slate-900" value={editingItem.status} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}>
                    <option value="Active">Aktif</option>
                    <option value="Maintenance">Bakımda</option>
                    <option value="Broken">Arızalı</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              {editingItem.type !== 'Consumable' && (
                <div className="md:col-span-2">
                  <label className="label">Kalibrasyon Tarihi</label>
                  <input
                    type="date"
                    className="input dark:[color-scheme:dark]"
                    value={editingItem.calibrationDate ? editingItem.calibrationDate.split('T')[0] : ''}
                    onChange={(e) => setEditingItem({ ...editingItem, calibrationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  />
                </div>
              )}

              {editingItem.type === 'Consumable' && (
                <>
                  <div>
                    <label className="label">Adet / Miktar</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={editingItem.quantity || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">Birim</label>
                    <input
                      className="input"
                      placeholder="Adet, Kutu vb."
                      value={editingItem.unit || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="label">Zimmetli Personel</label>
                <div className="relative">
                  <select className="input appearance-none dark:bg-slate-900" value={editingItem.assignedStaffId || ''} onChange={(e) => setEditingItem({ ...editingItem, assignedStaffId: e.target.value })}>
                    <option value="">Seçiniz...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestPool;
