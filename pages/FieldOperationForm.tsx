import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
  ArrowLeft, 
  Save, 
  Truck, 
  Users, 
  ClipboardCheck, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const FieldOperationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointments, companies, staff, tests } = useData();
  
  const screening = appointments.find(a => a.id === id);
  const company = companies.find(c => c.id === screening?.companyId);
  
  const [step, setStep] = useState(1);
  const [personnelCount, setScreenedPersonnelCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    vehicleSafety: false,
    equipmentCalibrated: false,
    staffReady: false,
    areaSecured: false
  });

  if (!screening || !company) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
        <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Operasyon Bulunamadı</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/calendar')}>Takvime Dön</Button>
      </div>
    );
  }

  const handleFinish = () => {
    toast.success('Saha operasyon formu başarıyla kaydedildi!');
    navigate(`/screenings/${id}`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24 animate-fade-in-up">
      {/* Mobile Friendly Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Saha Formu</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{company.name}</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 h-1 px-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
        ))}
      </div>

      <div className="px-2">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <Card title="Hazırlık Kontrol Listesi" className="rounded-3xl">
              <div className="space-y-4">
                {Object.entries(checklist).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {key === 'vehicleSafety' ? 'Araç Güvenliği Kontrol Edildi' :
                       key === 'equipmentCalibrated' ? 'Cihazlar Hazır ve Kalibre' :
                       key === 'staffReady' ? 'Ekip Tam ve Hazır' : 'Çalışma Alanı Güvenli'}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={value} 
                      onChange={() => setChecklist(prev => ({...prev, [key]: !value}))}
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </Card>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Taramaya başlamadan önce tüm ekipmanların araç içinde sabitlendiğinden ve sterilizasyonun tamamlandığından emin olun.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <Card title="Tarama Takibi" className="rounded-3xl">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-blue-50 dark:border-blue-900/20 relative">
                  <span className="text-4xl font-black text-blue-600">{personnelCount}</span>
                  <div className="absolute -bottom-2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase">Personel</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    onClick={() => setScreenedPersonnelCount(prev => Math.max(0, prev - 1))}
                    className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-2xl font-bold active:scale-90 transition-transform"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => setScreenedPersonnelCount(prev => prev + 1)}
                    className="p-4 bg-blue-600 text-white rounded-2xl text-2xl font-bold active:scale-90 transition-transform shadow-lg shadow-blue-500/30"
                  >
                    +
                  </button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 active:bg-slate-50 transition-colors">
                <Camera size={24} className="text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-600">Fotoğraf Ekle</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 active:bg-slate-50 transition-colors">
                <MapPin size={24} className="text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-600">Konum Bildir</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <Card title="Saha Notları & Kapanış" className="rounded-3xl">
              <textarea 
                className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500/20 placeholder:text-slate-400"
                placeholder="Operasyon sırasında yaşanan özel durumlar, ekipman arızaları veya firma talepleri..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-3xl border border-green-100 dark:border-green-800 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-green-900 dark:text-green-200">Operasyon Tamamlandı mı?</h3>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Formu onayladığınızda veriler sisteme işlenecek ve raporlama süreci başlayacaktır.</p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex gap-3 z-40">
        {step > 1 && (
          <Button variant="outline" className="flex-1 py-4 rounded-2xl" onClick={() => setStep(step - 1)}>Geri</Button>
        )}
        {step < 3 ? (
          <Button 
            className="flex-[2] py-4 rounded-2xl shadow-lg shadow-blue-500/20" 
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !Object.values(checklist).every(v => v)}
          >
            Devam Et
          </Button>
        ) : (
          <Button 
            variant="primary" 
            className="flex-[2] py-4 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 border-none" 
            onClick={handleFinish}
          >
            Formu Tamamla
          </Button>
        )}
      </div>
    </div>
  );
};

export default FieldOperationForm;
