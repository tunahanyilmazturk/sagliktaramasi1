
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { generateAppointmentPDF, generateScreeningReportPDF, generateScreeningPlanPDF } from '../services/pdfService';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Building2, Users, FlaskConical, 
  Settings, Download, Trash2, Edit, CheckCircle, AlertCircle, XCircle, Phone,
  MessageSquare, Share2, FileText, ClipboardCheck, MessageCircle, User, Check
} from 'lucide-react';
import { Appointment, Staff } from '../types';
import { sendWhatsAppMessage, formatScreeningMessage } from '../utils/whatsapp';
import toast from 'react-hot-toast';

const ScreeningDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointments, companies, staff, tests, equipment, deleteAppointment, updateAppointment, institution } = useData();
  
  const [screening, setScreening] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [editData, setEditData] = useState<Partial<Appointment>>({});
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

  useEffect(() => {
    const found = appointments.find(a => a.id === id);
    if (found) {
      setScreening(found);
      setEditData(found);
      setSelectedStaffIds(found.staffIds || []);
      
      const company = companies.find(c => c.id === found.companyId);
      setCustomMessage(formatScreeningMessage(
        company?.name || 'Firma',
        found.date,
        found.title
      ));
    }
  }, [id, appointments, companies]);

  const handleBulkWhatsApp = () => {
    if (selectedStaffIds.length === 0) {
      toast.error("Lütfen en az bir personel seçin.");
      return;
    }

    selectedStaffIds.forEach(staffId => {
      const person = staff.find(s => s.id === staffId);
      if (person?.phone) {
        sendWhatsAppMessage(person.phone, customMessage);
      }
    });

    toast.success(`${selectedStaffIds.length} kişiye WhatsApp mesajı başlatıldı.`);
    setIsWhatsAppModalOpen(false);
  };

  if (!screening) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kayıt Bulunamadı</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/screenings')}>Geri Dön</Button>
      </div>
    );
  }

  const company = companies.find(c => c.id === screening.companyId);
  const assignedStaff = staff.filter(s => screening.staffIds.includes(s.id));
  const assignedTests = tests.filter(t => screening.testIds?.includes(t.id));
  const assignedEquipment = equipment.filter(e => screening.equipmentIds?.includes(e.id));

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Taramayı Sil',
      message: `"${screening.title}" isimli tarama kaydını ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      onConfirm: () => {
        deleteAppointment(screening.id);
        toast.success('Tarama silindi.');
        navigate('/screenings');
      }
    });
  };

  const handleDownloadTaskOrder = () => {
    if (company) {
      generateAppointmentPDF(screening, company, assignedStaff, assignedTests, institution);
    }
  };

  const handleDownloadPlan = () => {
    if (company) {
      generateScreeningPlanPDF(screening, company, assignedStaff, assignedTests, institution);
      toast.success("Plan PDF'i oluşturuldu.");
    }
  };

  const handleDownloadReport = () => {
    if (company) {
      generateScreeningReportPDF(screening, company, assignedTests, institution);
    }
  };

  const handleSendSMS = () => {
      if (assignedStaff.length === 0) {
          toast.error("Atanmış personel bulunmuyor.");
          return;
      }
      
      setConfirmModal({
        isOpen: true,
        title: 'SMS Gönder',
        message: `${assignedStaff.length} personele görev bilgilendirme SMS'i gönderilsin mi?`,
        onConfirm: () => {
          toast.success(`Mesajlar ${assignedStaff.length} personele iletildi.`);
          // In a real app, this would trigger an API call.
        }
      });
  };

  const handleSaveEdit = () => {
    if (editData.title && editData.date && editData.companyId) {
        // Calculate duration if times are present
        let durationMinutes = editData.durationMinutes;
        if (editData.startTime && editData.endTime) {
            const [startH, startM] = editData.startTime.split(':').map(Number);
            const [endH, endM] = editData.endTime.split(':').map(Number);
            const start = startH * 60 + startM;
            const end = endH * 60 + endM;
            if (end > start) {
                durationMinutes = end - start;
            }
        }

        updateAppointment({
            ...editData,
            durationMinutes
        } as Appointment);
        setIsEditModalOpen(false);
        toast.success("Tarama bilgileri güncellendi.");
    } else {
        toast.error("Zorunlu alanları doldurunuz.");
    }
  };

  // Edit Handlers
  const toggleItem = (list: string[], item: string) => {
      return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const statusColors = {
      'Planned': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      'Completed': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
  };

  const statusIcons = {
      'Planned': <Clock size={16} />,
      'Completed': <CheckCircle size={16} />,
      'Cancelled': <XCircle size={16} />
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/screenings')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-500" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    {screening.title}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[screening.status]}`}>
                        {statusIcons[screening.status]}
                        {screening.status === 'Planned' ? 'Planlandı' : screening.status === 'Completed' ? 'Tamamlandı' : 'İptal Edildi'}
                    </span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Operasyon ID: #{screening.id}</p>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/screenings/${id}/field-form`)} icon={<ClipboardCheck size={16} />}>Saha Formu</Button>
            <Button variant="outline" onClick={handleDownloadPlan} icon={<FileText size={16} />}>Plan PDF</Button>
            <Button variant="outline" onClick={handleSendSMS} icon={<MessageSquare size={16} />}>Ekibe SMS</Button>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            
            <Button variant="outline" onClick={handleDownloadTaskOrder} icon={<Download size={16} />}>Görev Emri</Button>
            {screening.status === 'Completed' && (
                <Button variant="secondary" onClick={handleDownloadReport} icon={<Download size={16} />}>Sonuç Raporu</Button>
            )}
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)} icon={<Edit size={16} />}>Düzenle</Button>
            <Button variant="danger" onClick={handleDelete} icon={<Trash2 size={16} />}>Sil</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
              {/* Company & Location Card */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Building2 className="text-blue-500" size={20} /> Firma & Lokasyon
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Firma Adı</p>
                          <p className="text-base font-medium text-slate-800 dark:text-slate-200">{company?.name}</p>
                      </div>
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Yetkili Kişi</p>
                          <p className="text-base font-medium text-slate-800 dark:text-slate-200">{company?.authorizedPerson}</p>
                      </div>
                      <div className="sm:col-span-2">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Adres</p>
                          <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                              <MapPin size={18} className="shrink-0 mt-0.5 text-slate-400" />
                              <span>{company?.address}</span>
                          </div>
                      </div>
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">İletişim</p>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Phone size={16} className="text-slate-400" />
                              <span>{company?.phone}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Timing */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Calendar size={32} />
                  </div>
                  <div className="flex-1">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Planlanan Zaman</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {new Date(screening.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                          <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <Clock size={16} />
                              {screening.startTime} - {screening.endTime}
                          </p>
                          {screening.durationMinutes && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter border border-blue-100 dark:border-blue-800">
                                  Süre: {Math.floor(screening.durationMinutes / 60)} sa {screening.durationMinutes % 60} dk
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Tests Grid */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <FlaskConical className="text-purple-500" size={20} /> Kapsam ({assignedTests.length} Test)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignedTests.map(test => (
                          <div key={test.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                              <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{test.name}</span>
                              <span className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{test.category}</span>
                          </div>
                      ))}
                      {assignedTests.length === 0 && <p className="text-slate-400 text-sm italic">Test seçilmemiş.</p>}
                  </div>
              </div>
          </div>

          {/* Sidebar Resources */}
          <div className="space-y-6">
              {/* Staff List */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="text-green-500" size={20} /> Ekip ({assignedStaff.length})
                  </h3>
                  <div className="space-y-3">
                      {assignedStaff.map(s => (
                          <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                  {s.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.title}</p>
                              </div>
                          </div>
                      ))}
                      {assignedStaff.length === 0 && <p className="text-slate-400 text-sm italic">Personel atanmamış.</p>}
                  </div>
              </div>

              {/* Equipment List */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="text-orange-500" size={20} /> Ekipman ({assignedEquipment.length})
                  </h3>
                  <div className="space-y-3">
                      {assignedEquipment.map(e => (
                          <div key={e.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                              <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                                  <Settings size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{e.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{e.serialNumber}</p>
                              </div>
                          </div>
                      ))}
                      {assignedEquipment.length === 0 && <p className="text-slate-400 text-sm italic">Ekipman seçilmemiş.</p>}
                  </div>
              </div>
          </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Taramayı Düzenle"
        footer={
            <>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                <Button onClick={handleSaveEdit}>Kaydet</Button>
            </>
        }
      >
          <div className="space-y-6">
              <div>
                  <label className="label">Başlık</label>
                  <input 
                      className="input" 
                      value={editData.title || ''} 
                      onChange={(e) => setEditData({...editData, title: e.target.value})} 
                  />
              </div>
              <div className="flex flex-col gap-4">
                  <div>
                      <label className="label">Tarih</label>
                      <input 
                          type="date" 
                          className="input dark:[color-scheme:dark]"
                          value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditData({...editData, date: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="label">Başlangıç</label>
                          <input 
                              type="time" 
                              className="input dark:[color-scheme:dark]"
                              value={editData.startTime || ''}
                              onChange={(e) => setEditData({...editData, startTime: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="label">Bitiş</label>
                          <input 
                              type="time" 
                              className="input dark:[color-scheme:dark]"
                              value={editData.endTime || ''}
                              onChange={(e) => setEditData({...editData, endTime: e.target.value})}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="label">Durum</label>
                      <select 
                          className="input appearance-none dark:bg-slate-900"
                          value={editData.status}
                          onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                      >
                          <option value="Planned">Planlandı</option>
                          <option value="Completed">Tamamlandı</option>
                          <option value="Cancelled">İptal Edildi</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="label mb-2">Personel</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar border rounded-xl p-2 dark:border-slate-700">
                      {staff.map(s => (
                          <div 
                              key={s.id} 
                              onClick={() => setEditData(prev => ({ ...prev, staffIds: toggleItem(prev.staffIds || [], s.id) }))}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${editData.staffIds?.includes(s.id) ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                          >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${editData.staffIds?.includes(s.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                                  {editData.staffIds?.includes(s.id) && <CheckCircle size={10} />}
                              </div>
                              <span className="text-sm truncate">{s.name}</span>
                          </div>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="label mb-2">Testler</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar border rounded-xl p-2 dark:border-slate-700">
                      {tests.map(t => (
                          <div 
                              key={t.id} 
                              onClick={() => setEditData(prev => ({ ...prev, testIds: toggleItem(prev.testIds || [], t.id) }))}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${editData.testIds?.includes(t.id) ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                          >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${editData.testIds?.includes(t.id) ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-300'}`}>
                                  {editData.testIds?.includes(t.id) && <CheckCircle size={10} />}
                              </div>
                              <span className="text-sm truncate">{t.name}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </Modal>

      {/* WHATSAPP MODAL */}
      <Modal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        title="Ekibe WhatsApp Mesajı Gönder"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsWhatsAppModalOpen(false)}>İptal</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleBulkWhatsApp}
              icon={<MessageCircle size={18} />}
            >
              WhatsApp ile Gönder
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-xl text-green-600 dark:text-green-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">WhatsApp Bilgilendirme</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Seçili personellere operasyon detaylarını içeren WhatsApp mesajı gönderilecektir. Her personel için ayrı bir pencere açılabilir.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Mesaj İçeriği</label>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 p-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium min-h-[120px] resize-none"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Gönderilecek Kişiler ({selectedStaffIds.length})</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {assignedStaff.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelectedStaffIds(prev => 
                    prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                  )}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedStaffIds.includes(s.id)
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-green-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      selectedStaffIds.includes(s.id) 
                        ? 'bg-green-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${selectedStaffIds.includes(s.id) ? 'text-green-800 dark:text-green-300' : 'text-slate-700 dark:text-slate-200'}`}>{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {s.phone}
                      </p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    selectedStaffIds.includes(s.id)
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}>
                    {selectedStaffIds.includes(s.id) && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              ))}
              {assignedStaff.length === 0 && (
                <div className="text-center py-6 text-slate-400 italic text-sm">
                  Atanmış personel bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

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

export default ScreeningDetail;
