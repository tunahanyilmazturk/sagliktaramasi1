
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ArrowLeft, UserRound, Stethoscope, Briefcase, Calendar, CheckCircle2, Clock, Building2, Phone, Mail, Award, Pencil, Microscope, Activity, Zap, MessageCircle, FileText, Shield, FileCheck, AlertCircle, Plus } from 'lucide-react';
import { Staff as StaffType, Appointment } from '../types';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import toast from 'react-hot-toast';

const StaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { staff, appointments, companies, updateStaff } = useData();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffType>>({});

  const person = staff.find(s => s.id === id);

  if (!person) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Personel Bulunamadı</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/staff')}>Geri Dön</Button>
      </div>
    );
  }

  // Calculate Stats
  const personAppointments = appointments.filter(a => a.staffIds.includes(person.id));
  const completedAppointments = personAppointments.filter(a => a.status === 'Completed');
  const completedCount = completedAppointments.length;
  
  const totalWorkMinutes = completedAppointments.reduce((sum, app) => sum + (app.durationMinutes || 0), 0);
  const totalWorkHours = Math.floor(totalWorkMinutes / 60);
  const totalWorkMins = totalWorkMinutes % 60;

  const upcomingCount = personAppointments.filter(a => a.status === 'Planned' && new Date(a.date) > new Date()).length;
  const monthlyCount = personAppointments.filter(a => {
      const d = new Date(a.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'Doctor': return <Stethoscope size={24} />;
      case 'Nurse': return <UserRound size={24} />;
      case 'Lab': return <Microscope size={24} />;
      case 'Audio': return <Activity size={24} />;
      case 'Radiology': return <Zap size={24} />;
      default: return <Briefcase size={24} />;
    }
  };

  const getSkills = (person: StaffType) => {
      if (person.skills && person.skills.length > 0) return person.skills;
      switch(person.role) {
          case 'Doctor': return ['Muayene', 'Reçete', 'EKG Yorum'];
          case 'Nurse': return ['Kan Alma', 'Aşı', 'Pansuman'];
          case 'Lab': return ['Kan Analizi', 'Numune Alma'];
          case 'Audio': return ['Odyometri', 'SFT'];
          case 'Radiology': return ['Röntgen', 'Görüntüleme'];
          default: return ['Kayıt', 'Saha Destek', 'Sürücü'];
      }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Doctor': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded-full dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"><Stethoscope size={12} /> Doktor</span>;
      case 'Nurse': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-pink-50 text-pink-700 border border-pink-100 text-[10px] font-bold rounded-full dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800"><UserRound size={12} /> Hemşire</span>;
      case 'Lab': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold rounded-full dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"><Microscope size={12} /> Laborant</span>;
      case 'Audio': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold rounded-full dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"><Activity size={12} /> Odyometrist</span>;
      case 'Radiology': return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded-full dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"><Zap size={12} /> Radyoloji Tek.</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 text-slate-700 border border-slate-100 text-[10px] font-bold rounded-full dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"><Briefcase size={12} /> Personel</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-[10px] font-bold border border-green-100 dark:border-green-900"><CheckCircle2 size={12} /> Aktif</span>;
      case 'OnLeave': return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-[10px] font-bold border border-amber-100 dark:border-amber-900"><Clock size={12} /> İzinli</span>;
      case 'Inactive': return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 text-[10px] font-bold border border-slate-100 dark:border-slate-900"><Activity size={12} /> Pasif</span>;
      default: return null;
    }
  };

  const handleEditOpen = () => {
      setEditingStaff({ ...person });
      setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (editingStaff.name && editingStaff.title && editingStaff.phone) {
        updateStaff(editingStaff as StaffType);
        toast.success('Bilgiler güncellendi.');
        setIsEditModalOpen(false);
    } else {
        toast.error('Zorunlu alanları doldurun.');
    }
  };

  const [activeTab, setActiveTab] = useState<'schedule' | 'documents' | 'activity'>('schedule');

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <FileCheck size={16} className="text-green-500" />;
      case 'Cancelled': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/staff')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Personel Listesine Dön
          </button>
          <Button variant="outline" size="sm" icon={<Pencil size={16} />} onClick={handleEditOpen}>Düzenle</Button>
      </div>

      {/* Header Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-700 shadow-sm relative group overflow-hidden">
           {getRoleIcon(person.role)}
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Pencil size={20} className="text-white" />
           </div>
        </div>
        <div className="flex-1 text-center md:text-left">
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{person.name}</h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium">{person.title}</p>
           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
              {getRoleBadge(person.role)}
              {getStatusBadge(person.status)}
              {person.bloodType && (
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900">
                  {person.bloodType}
                </span>
              )}
           </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<MessageCircle size={16} className="text-green-500" />} onClick={() => sendWhatsAppMessage(person.phone, `Merhaba ${person.name},`)}>WhatsApp</Button>
            <Button variant="outline" size="sm" icon={<Mail size={16} />} onClick={() => window.location.href = `mailto:${person.email}`}>E-posta</Button>
            <Button variant="outline" size="sm" icon={<Phone size={16} />} onClick={() => window.location.href = `tel:${person.phone}`}>Ara</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stats & Info */}
          <div className="space-y-6">
             <Card title="Performans Özeti">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Toplam Görev</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{personAppointments.length}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold">Tamamlanan</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{completedCount}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">Toplam Mesai</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{totalWorkHours}sa {totalWorkMins}dk</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                        <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-semibold">Yaklaşan</p>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{upcomingCount}</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <Award size={18} className="text-purple-500" /> Yetkinlikler
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {getSkills(person).map(skill => (
                            <span key={skill} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md">{skill}</span>
                        ))}
                    </div>
                </div>
             </Card>

             <Card title="Personel Bilgileri">
                 <div className="space-y-4">
                     <div className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-3 text-slate-500">
                            <Mail size={16} />
                            <span>E-Posta</span>
                         </div>
                         <span className="text-slate-900 dark:text-white font-medium">{person.email || '-'}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-3 text-slate-500">
                            <Phone size={16} />
                            <span>Telefon</span>
                         </div>
                         <span className="text-slate-900 dark:text-white font-medium">{person.phone}</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-3 text-slate-500">
                            <Calendar size={16} />
                            <span>Başlangıç</span>
                         </div>
                         <span className="text-slate-900 dark:text-white font-medium">
                            {person.startDate ? new Date(person.startDate).toLocaleDateString('tr-TR') : '-'}
                         </span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-3 text-slate-500">
                            <Building2 size={16} />
                            <span>Lokasyon</span>
                         </div>
                         <span className="text-slate-900 dark:text-white font-medium">Merkez Ofis</span>
                     </div>
                 </div>
             </Card>

             <Card title="Sertifikalar & Belgeler">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Mesleki Yeterlilik</p>
                        <p className="text-[10px] text-slate-500">Geçerlilik: 12.12.2026</p>
                      </div>
                    </div>
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-lg">
                        <Award size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">İlk Yardım Eğitimi</p>
                        <p className="text-[10px] text-slate-500">Tamamlandı: 01.05.2025</p>
                      </div>
                    </div>
                    <FileText size={16} className="text-slate-400" />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 text-[10px] uppercase font-bold tracking-wider">Tüm Belgeleri Gör</Button>
             </Card>
          </div>

          {/* Right: Tabs Content */}
          <div className="lg:col-span-2 space-y-6">
              <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                >
                  <Calendar size={16} /> Görev Takvimi
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                >
                  <Activity size={16} /> Aktivite Akışı
                </button>
                <button 
                  onClick={() => setActiveTab('documents')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                >
                  <FileText size={16} /> Özlük Dosyası
                </button>
              </div>

              <Card className="min-h-[500px]">
                  {activeTab === 'schedule' && (
                    <div className="space-y-4">
                      {personAppointments.length > 0 ? (
                          <div className="space-y-4">
                              {personAppointments
                                 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                 .map(app => {
                                     const company = companies.find(c => c.id === app.companyId);
                                     const isPast = new Date(app.date) < new Date();
                                     
                                     return (
                                         <div key={app.id} className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                                             isPast 
                                                ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-75' 
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-sm'
                                         }`}>
                                             <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-slate-100 dark:border-slate-700 pr-4">
                                                 <span className="text-xs font-bold text-slate-400 uppercase">{new Date(app.date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                 <span className={`text-xl font-bold ${isPast ? 'text-slate-600' : 'text-blue-600 dark:text-blue-400'}`}>{new Date(app.date).getDate()}</span>
                                                 <span className="text-xs text-slate-400">{new Date(app.date).toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                                             </div>
                                             <div className="flex-1">
                                                 <div className="flex justify-between items-start">
                                                     <h4 className={`font-semibold ${isPast ? 'text-slate-700 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{app.title}</h4>
                                                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                         app.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                         app.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                         'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                     }`}>
                                                         {app.status === 'Completed' ? 'Tamamlandı' : app.status === 'Cancelled' ? 'İptal' : 'Planlandı'}
                                                     </span>
                                                 </div>
                                                 <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                     <Clock size={14} />
                                                     <span>{app.startTime || new Date(app.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {app.endTime || '-'}</span>
                                                     {app.durationMinutes && (
                                                         <>
                                                            <span>•</span>
                                                            <span className="font-medium text-blue-600 dark:text-blue-400">{Math.floor(app.durationMinutes / 60)}sa {app.durationMinutes % 60}dk</span>
                                                         </>
                                                     )}
                                                     <span>•</span>
                                                     <Building2 size={14} />
                                                     <span>{company?.name}</span>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 })}
                          </div>
                      ) : (
                          <div className="text-center py-12 text-slate-500">
                              <Calendar size={40} className="mx-auto text-slate-300 mb-4" />
                              <p>Bu personelin henüz bir görev kaydı bulunmuyor.</p>
                          </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                      {personAppointments.slice(0, 5).map((app, idx) => (
                        <div key={idx} className="relative pl-10">
                          <div className="absolute left-0 top-1 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center z-10 shadow-sm">
                            {getTimelineIcon(app.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {app.status === 'Completed' ? 'Görev Tamamlandı' : 'Görev Atandı'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">{new Date(app.date).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {app.title} kapsamında {companies.find(c => c.id === app.companyId)?.name} firmasında saha çalışması gerçekleştirildi.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['Nüfus Cüzdanı', 'Diploma', 'Sertifika 1', 'Sağlık Raporu'].map((doc, i) => (
                        <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/10 transition-all group">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl group-hover:text-blue-500 transition-colors">
                              <FileText size={20} />
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">İndir</Button>
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{doc}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">PDF • 2.4 MB</p>
                        </div>
                      ))}
                      <button className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/10 transition-all text-slate-400 hover:text-blue-500 min-h-[120px]">
                        <Plus size={24} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Dosya Yükle</span>
                      </button>
                    </div>
                  )}
              </Card>
          </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Personeli Düzenle"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Ad Soyad</label>
            <input 
              name="name" 
              className="input" 
              value={editingStaff.name || ''} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ünvan</label>
              <input 
                name="title" 
                className="input" 
                value={editingStaff.title || ''} 
                onChange={handleInputChange} 
              />
            </div>
            <div>
              <label className="label">Rol / Yetki</label>
              <div className="relative">
                <select 
                    name="role" 
                    className="input appearance-none dark:bg-slate-900" 
                    value={editingStaff.role} 
                    onChange={handleInputChange}
                >
                    <option value="Doctor">Doktor</option>
                    <option value="Nurse">Hemşire</option>
                    <option value="Lab">Laborant</option>
                    <option value="Audio">Odyometrist</option>
                    <option value="Radiology">Radyoloji Teknikeri</option>
                    <option value="Staff">Sağlık Personeli</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
              </div>
            </div>
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
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="label">Telefon <span className="text-red-500">*</span></label>
                <input 
                    name="phone" 
                    className="input" 
                    value={editingStaff.phone || ''} 
                    onChange={handleInputChange} 
                />
             </div>
             <div>
                <label className="label">E-Posta</label>
                <input 
                    name="email" 
                    type="email"
                    className="input" 
                    value={editingStaff.email || ''} 
                    onChange={handleInputChange}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
             <div>
                <label className="label text-blue-600 dark:text-blue-400">Sabit Maaş (TL)</label>
                <input 
                    name="baseSalary" 
                    type="number"
                    className="input border-blue-100 dark:border-blue-900/30" 
                    value={editingStaff.baseSalary || ''} 
                    onChange={(e) => setEditingStaff({...editingStaff, baseSalary: parseFloat(e.target.value) || 0})}
                />
             </div>
             <div>
                <label className="label text-blue-600 dark:text-blue-400">Saatlik Ücret (TL)</label>
                <input 
                    name="hourlyRate" 
                    type="number"
                    className="input border-blue-100 dark:border-blue-900/30" 
                    value={editingStaff.hourlyRate || ''} 
                    onChange={(e) => setEditingStaff({...editingStaff, hourlyRate: parseFloat(e.target.value) || 0})}
                />
             </div>
          </div>

          <div>
            <label className="label">Yetenekler (Virgül ile ayırın)</label>
            <input 
                className="input" 
                placeholder="Örn: İlk Yardım, Sürücü Belgesi" 
                value={editingStaff.skills?.join(', ') || ''} 
                onChange={(e) => setEditingStaff({...editingStaff, skills: e.target.value.split(',').map(s => s.trim())})} 
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffDetail;
