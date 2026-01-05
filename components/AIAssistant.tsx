
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Bot, X, Send, Sparkles, Lock, ArrowRight, Loader2, BrainCircuit } from 'lucide-react';
import { Button } from './Button';
import { smartBrain } from '../utils/smartBrain';

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { institution, companies, proposals, appointments, staff } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: `Merhaba! Ben HanTech akıllı asistanıyım. ${institution.name} için rapor analizi, operasyonel özetleme veya sistem sorgulama konularında yardımcı olabilirim.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickSuggestions = [
    { label: 'Ciro Tahmini', query: 'Önümüzdeki ay için ciro tahmini nedir?' },
    { label: 'Operasyonel Verimlilik', query: 'Operasyonel verimlilik durumumuz nasıl?' },
    { label: 'İSG Mevzuatı', query: 'İSG mevzuatına göre yasal zorunluluklar neler?' },
    { label: 'Firma Analizi', query: 'Portföyümüzdeki en aktif firma hangisi?' }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const stats = useMemo(() => {
    const approvedProposals = proposals.filter(p => p.status === 'Approved');
    const totalRevenue = approvedProposals.reduce((acc, p) => acc + p.totalAmount, 0);
    const pendingProposalsCount = proposals.filter(p => p.status === 'Sent').length;
    const completedScreenings = appointments.filter(a => a.status === 'Completed').length;
    const upcomingAppointments = appointments.filter(a => new Date(a.date) > new Date()).length;
    
    return {
      totalRevenue,
      pendingProposalsCount,
      completedScreenings,
      upcomingAppointments,
      proposalsCount: proposals.length,
      appointmentsCount: appointments.length,
      companiesCount: companies.length,
      staffCount: staff.length,
      topCompany: companies[0]?.name || 'bulunmamaktadır'
    };
  }, [proposals, appointments, companies, staff]);

  const handleSend = async (customQuery?: string) => {
    const queryText = customQuery || input.trim();
    if (!queryText || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: queryText }]);
    if (!customQuery) setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Smart Brain processing with dynamic context
    setTimeout(() => {
      const response = smartBrain.processInput(queryText, stats);
      setMessages(prev => [...prev, { role: 'ai', text: response.text }]);
      setIsLoading(false);

      // Handle system actions
      if (response.action) {
        setTimeout(() => {
          switch (response.action) {
            case 'NAVIGATE_CREATE_COMPANY':
              navigate('/companies/create');
              break;
            case 'NAVIGATE_CREATE_PROPOSAL':
              navigate('/proposals/create');
              break;
            case 'NAVIGATE_STAFF':
              navigate('/staff');
              break;
            default:
              console.log('Unknown action:', response.action);
          }
        }, 1000);
      }
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/30 flex items-center justify-center text-white hover:scale-105 transition-transform z-50 group"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-50 animate-fade-in-up">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-violet-600 to-indigo-600 shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-3 text-white">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">HanTech AI</h3>
            <p className="text-[10px] text-violet-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Çevrimiçi
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 rounded-bl-none'
              }`}>
              {msg.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line.startsWith('- ') || line.match(/^\d\./) ? (
                    <div className="pl-2 my-1 flex gap-2">
                      <span className="text-violet-500">•</span>
                      <span>{line.replace(/^[- \d.]*/, '')}</span>
                    </div>
                  ) : (
                    line
                  )}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        
        {showSuggestions && messages.length === 1 && (
          <div className="grid grid-cols-1 gap-2 pt-2 animate-fade-in">
            <p className="text-[10px] font-bold text-slate-400 uppercase px-1">Önerilen Sorular</p>
            {quickSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.query)}
                className="text-left p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-500 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span>{s.label}</span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
              <Loader2 size={18} className="animate-spin text-violet-600" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative">
          <input
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 ring-violet-500/50 dark:text-white placeholder:text-slate-400"
            placeholder="Bir soru sorun..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};