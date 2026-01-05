import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, Bell, Search, Building2, UserRound, FlaskConical, LogOut, Settings, 
  User as UserIcon, Command, Sun, Moon, Plus, Zap, Calendar, FileText, 
  Activity, TrendingUp, ChevronDown, Wifi, WifiOff, Database, Cloud,
  Mic, MicOff, Layers, Command as CommandIcon, Sparkles, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ onMenuClick }) => {
  const navigate = useNavigate();
  const { notifications, companies, staff, tests, markNotificationRead } = useData();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    api: 'online' as 'online' | 'offline' | 'slow',
    database: 'online' as 'online' | 'offline' | 'slow',
    lastCheck: new Date()
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  // Memoize filtered data for performance
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { companies: [], staff: [], tests: [], hasResults: false };
    
    const query = searchQuery.toLowerCase();
    return {
      companies: companies.filter(c => c.name.toLowerCase().includes(query)).slice(0, 3),
      staff: staff.filter(s => s.name.toLowerCase().includes(query)).slice(0, 3),
      tests: tests.filter(t => t.name.toLowerCase().includes(query)).slice(0, 3),
      hasResults: false
    };
  }, [searchQuery, companies, staff, tests]);

  // Update hasResults after filtering
  searchResults.hasResults = searchResults.companies.length > 0 || searchResults.staff.length > 0 || searchResults.tests.length > 0;

  // Memoize notification data
  const notificationData = useMemo(() => ({
    unreadCount: notifications.filter(n => !n.read).length,
    recentNotifications: notifications.slice(0, 5)
  }), [notifications]);

  // Initialize Theme and Search History - Memoized
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    
    // Load search history from localStorage
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }

    // System status checker
    const checkSystemStatus = async () => {
      try {
        const apiResponse = await fetch('/api/health');
        const dbResponse = await fetch('/api/health/db');
        
        setSystemStatus({
          api: apiResponse.ok ? 'online' : 'offline',
          database: dbResponse.ok ? 'online' : 'offline',
          lastCheck: new Date()
        });
      } catch (error) {
        setSystemStatus(prev => ({
          ...prev,
          api: 'offline',
          database: 'offline',
          lastCheck: new Date()
        }));
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = searchRef.current?.querySelector('input');
        searchInput?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowResults(false);
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowQuickActions(false);
        setShowCommandPalette(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Search Logic - Removed (moved to useMemo)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsSearchFocused(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(event.target as Node)) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Memoize event handlers
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    if (searchQuery.length > 0) setShowResults(true);
  }, [searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.length > 0);
    setAiSuggestion(null);
  }, []);

  const handleAiSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Lütfen bir arama terimi girin.');
      return;
    }
    setIsAiSearching(true);
    
    // Akıllı öneri simülasyonu (Kural tabanlı)
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      let suggestion = "";

      if (query.includes('firma') || query.includes('şirket')) {
        suggestion = "Firmalar menüsünde aktif portföyünüzü ve müşteri detaylarını inceleyebilirsiniz.";
      } else if (query.includes('personel') || query.includes('ekip')) {
        suggestion = "Personel sayfasından sağlık ekibinizin çalışma programını ve yetkinliklerini görebilirsiniz.";
      } else if (query.includes('test') || query.includes('hizmet')) {
        suggestion = "Hizmetler (Testler) bölümünde sunduğunuz sağlık taramalarının detaylı listesi yer almaktadır.";
      } else if (query.includes('teklif') || query.includes('satış')) {
        suggestion = "Teklifler ekranında onay bekleyen süreçleri takip edip yeni teklifler oluşturabilirsiniz.";
      } else {
        suggestion = `"${searchQuery}" ile ilgili sonuçları aşağıda listeledim. Detaylı analiz için ilgili öğeye tıklayabilirsiniz.`;
      }

      setAiSuggestion(suggestion);
      setShowResults(true);
      setIsAiSearching(false);
    }, 600);
  }, [searchQuery]);

  const handleResultClick = useCallback((path: string) => {
    // Add to search history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
      const newHistory = [searchQuery.trim(), ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
    
    navigate(path);
    setShowResults(false);
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [navigate, searchQuery, searchHistory]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleNotificationClick = useCallback((id: string) => {
    markNotificationRead(id);
  }, [markNotificationRead]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Voice search handler
  const toggleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız sesli aramayı desteklemiyor.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setShowResults(true);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening]);

  // Quick actions data
  const quickActions = useMemo(() => [
    { icon: <Plus size={18} />, label: 'Yeni Firma', action: () => navigate('/companies/create'), color: 'text-blue-600' },
    { icon: <FileText size={18} />, label: 'Teklif Oluştur', action: () => navigate('/proposals/create'), color: 'text-violet-600' },
    { icon: <Calendar size={18} />, label: 'Randevu Planla', action: () => navigate('/calendar'), color: 'text-emerald-600' },
    { icon: <Activity size={18} />, label: 'Tarama Ekle', action: () => navigate('/screenings/create'), color: 'text-orange-600' },
    { icon: <TrendingUp size={18} />, label: 'Raporlar', action: () => navigate('/reports'), color: 'text-cyan-600' },
    { icon: <Settings size={18} />, label: 'Ayarlar', action: () => navigate('/settings'), color: 'text-slate-600' },
  ], [navigate]);
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} sa önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return notificationDate.toLocaleDateString('tr-TR');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between px-6 lg:px-8 transition-all duration-300 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Global Search */}
        <div className={`relative transition-all duration-300 ${isSearchFocused ? 'flex-1' : 'flex-1 md:max-w-sm'}`} ref={searchRef}>
          <div className={`flex items-center rounded-2xl px-4 py-2.5 border transition-all duration-300 ${isSearchFocused
              ? 'bg-white dark:bg-slate-800 border-blue-500 ring-4 ring-blue-500/10 shadow-lg'
              : 'bg-slate-100/50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <Search size={18} className={`transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Ara (Firma, Personel, Test...)"
              className="ml-3 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            />
            <button
              onClick={handleAiSearch}
              disabled={isAiSearching}
              className={`ml-2 p-1.5 rounded-lg transition-all duration-200 ${
                isAiSearching 
                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 animate-pulse' 
                  : 'text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20'
              }`}
              title="AI Akıllı Arama"
            >
              {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
            <button
              onClick={toggleVoiceSearch}
              className={`ml-2 p-1.5 rounded-lg transition-all duration-200 ${
                isListening 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-pulse' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Dinleniyor...' : 'Sesli arama'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            {!isSearchFocused && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300/50 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50">
                <Command size={10} className="text-slate-400" />
                <span className="text-[10px] font-medium text-slate-400">K</span>
              </div>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-scale-in ring-1 ring-black/5 origin-top">
              {aiSuggestion && (
                <div className="p-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-b border-violet-100 dark:border-violet-800/50">
                  <div className="flex items-start gap-3">
                    <Sparkles size={16} className="text-violet-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      {aiSuggestion}
                    </p>
                  </div>
                </div>
              )}
              {searchQuery ? (
                searchResults.hasResults ? (
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    {searchResults.companies.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Firmalar</p>
                        {searchResults.companies.map(c => (
                          <button key={c.id} onClick={() => handleResultClick(`/companies/${c.id}`)} className="w-full flex items-center gap-3 p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors"><Building2 size={18} /></div>
                            <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p></div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.staff.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Personel</p>
                        {searchResults.staff.map(s => (
                          <button key={s.id} onClick={() => handleResultClick('/staff')} className="w-full flex items-center gap-3 p-2.5 hover:bg-green-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors"><UserRound size={18} /></div>
                            <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p><p className="text-xs text-slate-400">{s.title}</p></div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.tests.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Testler</p>
                        {searchResults.tests.map(t => (
                          <button key={t.id} onClick={() => handleResultClick('/tests')} className="w-full flex items-center gap-3 p-2.5 hover:bg-purple-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors"><FlaskConical size={18} /></div>
                            <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</p><p className="text-xs text-slate-400">{t.category}</p></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-500">
                    <Search size={32} className="mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Sonuç bulunamadı.</p>
                  </div>
                )
              ) : (
                // Search History
                <div className="p-2">
                  {searchHistory.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Son Aramalar</p>
                        <button 
                          onClick={() => {
                            setSearchHistory([]);
                            localStorage.removeItem('searchHistory');
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Temizle
                        </button>
                      </div>
                      {searchHistory.map((query, index) => (
                        <button 
                          key={index} 
                          onClick={() => {
                            setSearchQuery(query);
                            setShowResults(false);
                          }}
                          className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group"
                        >
                          <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                            <Search size={18} />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{query}</p>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      <p className="text-sm">Arama geçmişi bulunmuyor</p>
                      <p className="text-xs mt-1">Arama yapmaya başladığınızda burada görünecek</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">

        {/* System Status Indicators */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <div className={`flex items-center gap-1 ${systemStatus.api === 'online' ? 'text-green-500' : 'text-red-500'}`}>
            {systemStatus.api === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-xs font-medium">API</span>
          </div>
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-600"></div>
          <div className={`flex items-center gap-1 ${systemStatus.database === 'online' ? 'text-green-500' : 'text-red-500'}`}>
            <Database size={14} />
            <span className="text-xs font-medium">DB</span>
          </div>
        </div>

        {/* Quick Actions Button */}
        <div className="relative" ref={quickActionsRef}>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`relative rounded-full p-2.5 transition-all duration-200 ${showQuickActions
                ? 'bg-violet-50 text-violet-600 dark:bg-slate-800 dark:text-violet-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            title="Hızlı Eylemler (⌘+P)"
          >
            <Zap size={20} />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-4 w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 z-50 animate-scale-in ring-1 ring-black/5 origin-top-right overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <Zap size={16} className="text-violet-500" />
                  Hızlı Eylemler
                </h3>
              </div>
              <div className="p-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors group"
                  >
                    <div className={`p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative rounded-full p-2.5 transition-all duration-200 ${showNotifications
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <Bell size={20} />
            {notificationData.unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-full sm:w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 z-50 animate-scale-in overflow-hidden ring-1 ring-black/5 origin-top-right sm:origin-top-right">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Bildirimler</h3>
                  {notificationData.unreadCount > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {notificationData.unreadCount} yeni
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      notifications.forEach(n => markNotificationRead(n.id));
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
                  >
                    Tümünü okundu işaretle
                  </button>
                  <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Tümünü Gör</button>
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notificationData.recentNotifications.length > 0 ? (
                  <>
                    {notificationData.recentNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        onClick={() => handleNotificationClick(notification.id)} 
                        className={`p-4 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer relative transition-all duration-200 group ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className={`text-sm leading-snug max-w-[80%] ${!notification.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 ml-3">
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            )}
                            <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {getRelativeTime(notification.date)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{notification.message}</p>
                        {!notification.read && (
                          <span className="absolute right-4 bottom-4 w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 scale-0 group-hover:scale-100 transition-transform"></span>
                        )}
                      </div>
                    ))}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Tüm bildirimleri gör ({notifications.length})
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Bell size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Hiç bildirim yok</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 pl-2 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-1">{user.title}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-slate-900">
              {user.avatarInitials}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-4 w-64 sm:w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 z-50 animate-scale-in ring-1 ring-black/5 origin-top-right overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="font-bold text-slate-900 dark:text-white truncate text-base">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors"
                >
                  <div className="p-1.5 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400"><UserIcon size={16} /></div>
                  Profilim
                </button>
                {(user.role === 'Admin' || user.role === 'Manager') && (
                  <button
                    onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors"
                  >
                    <div className="p-1.5 bg-purple-50 dark:bg-slate-700 rounded-lg text-purple-600 dark:text-purple-400"><Settings size={16} /></div>
                    Ayarlar
                  </button>
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg"><LogOut size={16} /></div>
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // Command Palette Component
  const CommandPalette = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[20vh] animate-fade-in">
      <div 
        ref={commandPaletteRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in"
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <CommandIcon size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Komut veya menü ara..."
            className="flex-1 bg-transparent text-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setShowCommandPalette(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="text-sm">ESC</span>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="p-2">
            <p className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Hızlı Eylemler</p>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  setShowCommandPalette(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors group"
              >
                <div className={`p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between px-6 lg:px-8 transition-all duration-300 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        {/* Existing header content */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Global Search */}
          <div className={`relative transition-all duration-300 ${isSearchFocused ? 'flex-1' : 'flex-1 md:max-w-sm'}`} ref={searchRef}>
            <div className={`flex items-center rounded-2xl px-4 py-2.5 border transition-all duration-300 ${isSearchFocused
                ? 'bg-white dark:bg-slate-800 border-blue-500 ring-4 ring-blue-500/10 shadow-lg'
                : 'bg-slate-100/50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              <Search size={18} className={`transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Ara (Firma, Personel, Test...)"
                className="ml-3 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
              />
              <button
                onClick={toggleVoiceSearch}
                className={`ml-2 p-1.5 rounded-lg transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-pulse' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={isListening ? 'Dinleniyor...' : 'Sesli arama'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              {!isSearchFocused && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300/50 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50">
                  <Command size={10} className="text-slate-400" />
                  <span className="text-[10px] font-medium text-slate-400">K</span>
                </div>
              )}
            </div>

            {/* Search Dropdown Results */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-scale-in ring-1 ring-black/5 origin-top">
                {searchQuery ? (
                  searchResults.hasResults ? (
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                      {searchResults.companies.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Firmalar</p>
                          {searchResults.companies.map(c => (
                            <button key={c.id} onClick={() => handleResultClick(`/companies/${c.id}`)} className="w-full flex items-center gap-3 p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors"><Building2 size={18} /></div>
                              <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p></div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.staff.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Personel</p>
                          {searchResults.staff.map(s => (
                            <button key={s.id} onClick={() => handleResultClick('/staff')} className="w-full flex items-center gap-3 p-2.5 hover:bg-green-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                              <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors"><UserRound size={18} /></div>
                              <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p><p className="text-xs text-slate-400">{s.title}</p></div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.tests.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Testler</p>
                          {searchResults.tests.map(t => (
                            <button key={t.id} onClick={() => handleResultClick('/tests')} className="w-full flex items-center gap-3 p-2.5 hover:bg-purple-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group">
                              <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors"><FlaskConical size={18} /></div>
                              <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</p><p className="text-xs text-slate-400">{t.category}</p></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-slate-500">
                      <Search size={32} className="mx-auto text-slate-300 mb-2 opacity-50" />
                      <p className="text-sm font-medium">Sonuç bulunamadı.</p>
                    </div>
                  )
                ) : (
                  // Search History
                  <div className="p-2">
                    {searchHistory.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between px-3 py-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Son Aramalar</p>
                          <button 
                            onClick={() => {
                              setSearchHistory([]);
                              localStorage.removeItem('searchHistory');
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Temizle
                          </button>
                        </div>
                        {searchHistory.map((query, index) => (
                          <button 
                            key={index} 
                            onClick={() => {
                              setSearchQuery(query);
                              setShowResults(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors group"
                          >
                            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                              <Search size={18} />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{query}</p>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-6 text-center text-slate-400">
                        <p className="text-sm">Arama geçmişi bulunmuyor</p>
                        <p className="text-xs mt-1">Arama yapmaya başladığınızda burada görünecek</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className={`flex items-center gap-1 ${systemStatus.api === 'online' ? 'text-green-500' : 'text-red-500'}`}>
              {systemStatus.api === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="text-xs font-medium">API</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-600"></div>
            <div className={`flex items-center gap-1 ${systemStatus.database === 'online' ? 'text-green-500' : 'text-red-500'}`}>
              <Database size={14} />
              <span className="text-xs font-medium">DB</span>
            </div>
          </div>

          {/* Quick Actions Button */}
          <div className="relative" ref={quickActionsRef}>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`relative rounded-full p-2.5 transition-all duration-200 ${showQuickActions
                  ? 'bg-violet-50 text-violet-600 dark:bg-slate-800 dark:text-violet-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              title="Hızlı Eylemler (⌘+P)"
            >
              <Zap size={20} />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-4 w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 z-50 animate-scale-in ring-1 ring-black/5 origin-top-right overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Zap size={16} className="text-violet-500" />
                    Hızlı Eylemler
                  </h3>
                </div>
                <div className="p-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action();
                        setShowQuickActions(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors group"
                    >
                      <div className={`p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                        {action.icon}
                      </div>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative rounded-full p-2.5 transition-all duration-200 ${showNotifications
                  ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <Bell size={20} />
              {notificationData.unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-full sm:w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 z-50 animate-scale-in overflow-hidden ring-1 ring-black/5 origin-top-right sm:origin-top-right">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Bildirimler</h3>
                    {notificationData.unreadCount > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {notificationData.unreadCount} yeni
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        notifications.forEach(n => markNotificationRead(n.id));
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
                    >
                      Tümünü okundu işaretle
                    </button>
                    <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Tümünü Gör</button>
                  </div>
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notificationData.recentNotifications.length > 0 ? (
                    <>
                      {notificationData.recentNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          onClick={() => handleNotificationClick(notification.id)} 
                          className={`p-4 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer relative transition-all duration-200 group ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className={`text-sm leading-snug max-w-[80%] ${!notification.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 ml-3">
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              )}
                              <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {getRelativeTime(notification.date)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{notification.message}</p>
                          {!notification.read && (
                            <span className="absolute right-4 bottom-4 w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 scale-0 group-hover:scale-100 transition-transform"></span>
                          )}
                        </div>
                      ))}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                        <button 
                          onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          Tüm bildirimleri gör ({notifications.length})
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <Bell size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Hiç bildirim yok</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 pl-2 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-1">{user.title}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-slate-900">
                {user.avatarInitials}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-64 sm:w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 z-50 animate-scale-in ring-1 ring-black/5 origin-top-right overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="font-bold text-slate-900 dark:text-white truncate text-base">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors"
                  >
                    <div className="p-1.5 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400"><UserIcon size={16} /></div>
                    Profilim
                  </button>
                  {(user.role === 'Admin' || user.role === 'Manager') && (
                    <button
                      onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-colors"
                    >
                      <div className="p-1.5 bg-purple-50 dark:bg-slate-700 rounded-lg text-purple-600 dark:text-purple-400"><Settings size={16} /></div>
                      Ayarlar
                    </button>
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg"><LogOut size={16} /></div>
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {showCommandPalette && <CommandPalette />}
    </>
  );
});

Header.displayName = 'Header';