import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { generateProposalPDF, generateScreeningReportPDF } from '../services/pdfService';
import { 
  Building2, MapPin, Phone, Mail, FileText, ClipboardList, ArrowLeft, CalendarDays, Download, User, Briefcase, Pencil,
  Folder, File, Upload, Trash2, Zap, Calendar, Activity, ChevronRight, LayoutGrid, List, FileCheck, AlertCircle, Plus, Clock
} from 'lucide-react';
import { Company, CompanyDocument } from '../types';
import toast from 'react-hot-toast';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, proposals, appointments, tests, documents, updateCompany, addDocument, deleteDocument, institution } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'screenings' | 'documents'>('overview');
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company>>({});

  // Document Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<CompanyDocument>>({ type: 'Contract' });
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'stats'>('timeline');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const company = companies.find(c => c.id === id);
  const companyProposals = proposals.filter(p => p.companyId === id);
  const companyScreenings = appointments.filter(a => a.companyId === id);
  const companyDocuments = documents.filter(d => d.companyId === id);

  if (!company) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-slate-800">Firma Bulunamadı</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/companies')}>Geri Dön</Button>
      </div>
    );
  }

  const handleEditClick = () => {
    setEditingCompany({ ...company });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (editingCompany.id && editingCompany.name) {
        updateCompany(editingCompany as Company);
        setIsEditModalOpen(false);
    }
  };

  const handleDownloadProposal = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) generateProposalPDF(proposal, company, tests, institution);
  };

  const handleDownloadReport = (appointmentId: string) => {
    const app = appointments.find(a => a.id === appointmentId);
    if (app) {
        const appointmentTests = tests.filter(t => app.testIds?.includes(t.id));
        generateScreeningReportPDF(app, company, appointmentTests, institution);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Aktif Müşteri</span>;
      case 'Inactive': return <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">Pasif</span>;
      default: return <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-800 flex items-center gap-1.5">Beklemede</span>;
    }
  };

  const getEventIcon = (type: string) => {
    if (type === 'Proposal') return <FileText size={16} className="text-amber-500" />;
    return <ClipboardList size={16} className="text-blue-500" />;
  };

  const handleUploadDocument = () => {
    if(newDoc.title) {
        const doc: CompanyDocument = {
            id: Math.random().toString(36).substr(2, 9),
            companyId: company.id,
            title: newDoc.title,
            type: newDoc.type as any,
            uploadDate: new Date().toISOString(),
            size: (Math.random() * 5 + 0.5).toFixed(1) + ' MB' // Mock size
        };
        addDocument(doc);
        setIsUploadModalOpen(false);
        setNewDoc({ type: 'Contract' });
        toast.success('Dosya eklendi.');
    }
  };

  const handleDeleteDocument = (docId: string, docTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Dosyayı Sil',
      message: `"${docTitle}" isimli dosyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      onConfirm: () => {
        deleteDocument(docId);
        toast.success('Dosya silindi.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/companies')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Firmalara Dön
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-20 w-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-500/20 border border-white/10">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{company.name}</h1>
                {getStatusBadge(company.status)}
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-slate-400" />
                  <span className="font-medium">{company.sector || 'Genel Sektör'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="font-medium">{company.address.split(',').slice(-1)[0]}</span>
                </div>
                <span>•</span>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded uppercase tracking-wider">ID: {company.id}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
             <Button variant="outline" icon={<Zap size={18} />} onClick={() => navigate('/proposals/create', { state: { preselectedCompanyId: company.id } })}>Teklif Ver</Button>
             <Button icon={<Calendar size={18} />} onClick={() => navigate('/calendar', { state: { preselectedCompanyId: company.id } })}>Randevu Planla</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card 
            title="Firma Bilgileri" 
            action={<button onClick={handleEditClick} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-lg"><Pencil size={18} /></button>}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Yetkili Kişi</p>
                  <p className="text-slate-800 dark:text-white font-medium">{company.authorizedPerson}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Vergi Bilgileri</p>
                  <p className="text-slate-800 dark:text-white">{company.taxInfo}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">E-Posta</p>
                  <a href={`mailto:${company.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{company.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Telefon</p>
                  <p className="text-slate-800 dark:text-white">{company.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Adres</p>
                  <p className="text-slate-800 dark:text-white text-sm leading-relaxed">{company.address}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 text-white border-none">
            <h3 className="font-semibold text-lg mb-4">Hızlı İstatistikler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-3 rounded-xl">
                <p className="text-slate-400 text-xs">Toplam Teklif</p>
                <p className="text-2xl font-bold">{companyProposals.length}</p>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl">
                <p className="text-slate-400 text-xs">Randevular</p>
                <p className="text-2xl font-bold">{companyScreenings.length}</p>
              </div>
            </div>
          </Card>
        </div>

          <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl mb-6 w-full sm:w-fit border border-slate-200 dark:border-slate-700 shadow-sm">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              Genel Bakış
            </button>
            <button 
              onClick={() => setActiveTab('proposals')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'proposals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              Teklifler
            </button>
            <button 
              onClick={() => setActiveTab('screenings')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'screenings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              Taramalar
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              Dokümanlar
            </button>
          </div>

          <Card className="min-h-[500px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-blue-500" /> Aktivite Akışı
                  </h3>
                  
                  <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-4 space-y-8 pl-8 pb-2">
                    {[...companyProposals, ...companyScreenings]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((item: any) => (
                        <div key={item.id} className="relative">
                          <div className={`absolute -left-[41px] top-0 h-10 w-10 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-sm z-10 ${item.totalAmount ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {getEventIcon(item.totalAmount ? 'Proposal' : 'Appointment')}
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-2 inline-block ${item.totalAmount ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}`}>
                                  {item.totalAmount ? 'Teklif Oluşturuldu' : 'Randevu Gerçekleşti'}
                                </span>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{item.totalAmount ? `Teklif #${item.id}` : item.title}</h4>
                              </div>
                              {item.totalAmount && (
                                <span className="font-black text-slate-900 dark:text-white">{item.totalAmount.toLocaleString('tr-TR')} TL</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays size={14} />
                                {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FileCheck size={14} className="text-green-500" />
                                {item.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    {companyProposals.length === 0 && companyScreenings.length === 0 && (
                      <div className="text-center py-12">
                        <Activity className="mx-auto text-slate-300 mb-4" size={40} />
                        <p className="text-slate-500 font-medium">Henüz bir aktivite kaydı bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="space-y-4">
                 {companyProposals.map(proposal => (
                   <div key={proposal.id} className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 bg-white dark:bg-slate-900 transition-all group shadow-sm">
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                       <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800">
                         <FileText size={24} />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">#{proposal.id}</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(proposal.date).toLocaleDateString('tr-TR')} • {proposal.items.length} Hizmet Kalemi</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                       <div className="text-right">
                         <span className="text-[10px] text-slate-400 font-bold uppercase block">Toplam Tutar</span>
                         <span className="font-black text-slate-900 dark:text-white">{proposal.totalAmount.toLocaleString('tr-TR')} TL</span>
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                          proposal.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                          proposal.status === 'Sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800'
                       }`}>
                         {proposal.status}
                       </span>
                       <Button 
                          size="sm" 
                          variant="outline" 
                          icon={<Download size={14} />} 
                          onClick={() => handleDownloadProposal(proposal.id)} 
                       />
                     </div>
                   </div>
                 ))}
                 {companyProposals.length === 0 && (
                   <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Teklif Bulunmuyor</h4>
                      <p className="text-slate-500 mb-6">Bu firmaya ait oluşturulmuş bir teklif henüz yok.</p>
                      <Button variant="outline" icon={<Plus size={18} />} onClick={() => navigate('/proposals/create')}>Hemen Teklif Oluştur</Button>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'screenings' && (
              <div className="space-y-4">
                {companyScreenings.map(app => (
                  <div key={app.id} className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 bg-white dark:bg-slate-900 transition-all group shadow-sm">
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${app.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800'}`}>
                         <ClipboardList size={24} />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{app.title}</h4>
                         <div className="flex items-center gap-3 mt-1">
                           <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Calendar size={12} /> {new Date(app.date).toLocaleDateString('tr-TR')}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={12} /> {new Date(app.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</p>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                       <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                          app.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                          app.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                       }`}>
                         {app.status === 'Completed' ? 'Tamamlandı' : app.status === 'Planned' ? 'Planlandı' : 'İptal'}
                       </span>
                       {app.status === 'Completed' && (
                          <Button 
                              size="sm" 
                              variant="outline" 
                              icon={<FileCheck size={14} />} 
                              onClick={() => handleDownloadReport(app.id)}
                          >
                              Sonuç Raporu
                          </Button>
                       )}
                     </div>
                  </div>
                ))}
                {companyScreenings.length === 0 && (
                   <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Randevu Kaydı Yok</h4>
                      <p className="text-slate-500 mb-6">Firma için planlanmış veya gerçekleşmiş bir tarama bulunmuyor.</p>
                      <Button variant="outline" icon={<Calendar size={18} />} onClick={() => navigate('/calendar')}>Takvimden Planla</Button>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Özlük Dosyası & Belgeler</h3>
                      <p className="text-xs text-slate-500 mt-1">Firmaya ait sözleşme, protokol ve diğer resmi evraklar.</p>
                    </div>
                    <Button size="sm" icon={<Upload size={14} />} onClick={() => setIsUploadModalOpen(true)}>Yeni Belge</Button>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {companyDocuments.map(doc => (
                     <div key={doc.id} className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center border border-red-100 dark:border-red-800">
                                <FileText size={24} />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => toast.success('Dosya indiriliyor...')} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600"><Download size={16} /></button>
                              <button onClick={() => handleDeleteDocument(doc.id, doc.title)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">{doc.title}</h4>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{doc.type}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{doc.size}</span>
                            </div>
                        </div>
                     </div>
                   ))}
                   
                   <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex flex-col items-center justify-center p-5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/10 transition-all text-slate-400 hover:text-blue-500 h-40 group"
                   >
                      <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">Hızlı Belge Yükle</span>
                   </button>
                 </div>

                 {companyDocuments.length === 0 && (
                    <div className="text-center py-12">
                        <Folder className="mx-auto text-slate-200 mb-4" size={64} />
                        <p className="text-slate-500 font-medium">Bu firmaya ait henüz bir belge yüklenmemiş.</p>
                    </div>
                 )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Firma Bilgilerini Düzenle"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
            <Button onClick={handleSaveEdit}>Değişiklikleri Kaydet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Firma Adı</label>
            <input 
              name="name" 
              className="input" 
              value={editingCompany.name || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vergi Bilgileri</label>
              <input 
                name="taxInfo" 
                className="input" 
                value={editingCompany.taxInfo || ''} 
                onChange={handleInputChange} 
              />
            </div>
            <div>
              <label className="label">Yetkili Kişi</label>
              <input 
                name="authorizedPerson" 
                className="input" 
                value={editingCompany.authorizedPerson || ''} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">E-posta</label>
              <input 
                name="email" 
                className="input" 
                type="email" 
                value={editingCompany.email || ''} 
                onChange={handleInputChange} 
              />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input 
                name="phone" 
                className="input" 
                value={editingCompany.phone || ''} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          <div>
            <label className="label">Adres</label>
            <input 
              name="address" 
              className="input" 
              value={editingCompany.address || ''} 
              onChange={handleInputChange} 
            />
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Yeni Doküman Yükle"
        footer={
           <>
             <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>İptal</Button>
             <Button onClick={handleUploadDocument}>Yükle</Button>
           </>
        }
      >
          <div className="space-y-4">
             <div>
                <label className="label">Doküman Adı</label>
                <input className="input" placeholder="Örn: 2024 Sözleşme" value={newDoc.title || ''} onChange={(e) => setNewDoc({...newDoc, title: e.target.value})} />
             </div>
             <div>
                <label className="label">Tür</label>
                <select className="input appearance-none" value={newDoc.type} onChange={(e) => setNewDoc({...newDoc, type: e.target.value as any})}>
                   <option value="Contract">Sözleşme</option>
                   <option value="Report">Rapor</option>
                   <option value="Invoice">Fatura</option>
                   <option value="Other">Diğer</option>
                </select>
             </div>
             <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
                 <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                 <p className="text-sm text-slate-500 dark:text-slate-400">Dosyayı sürükleyin veya tıklayın</p>
             </div>
          </div>
      </Modal>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default CompanyDetail;