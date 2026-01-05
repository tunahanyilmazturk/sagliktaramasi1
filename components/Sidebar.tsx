
import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  FlaskConical,
  FileText,
  CalendarDays,
  X,
  Stethoscope,
  Settings,
  ClipboardList,
  BarChart3,
  UserCheck,
  ChevronRight,
  LogOut,
  Truck,
  Calculator,
  Home,
  TrendingUp,
  Package,
  Activity,
  Bell,
  User,
  Moon,
  Sun,
  Search,
  ChevronLeft,
  ChevronDown,
  Menu
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NavItem = ({ item, isCollapsed, key }: { item: any, isCollapsed: boolean, key?: string }) => (
  <NavLink
    to={item.to}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all duration-250 overflow-hidden ${isActive
        ? 'text-blue-700 dark:text-white shadow-md dark:shadow-lg dark:shadow-blue-500/25 scale-[1.02]'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:scale-[1.01]'
      } ${isCollapsed ? 'justify-center px-0 w-12 h-12 mx-auto mb-1' : ''}`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-blue-600 dark:to-blue-700 opacity-100 transition-opacity" />
        )}
        <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
          <span className={`transition-all duration-250 ${isActive
            ? 'text-blue-600 dark:text-blue-100 scale-110'
            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-blue-400 group-hover:scale-105'
            }`}>
            {item.icon}
          </span>
          {!isCollapsed && <span className="font-medium">{item.label}</span>}
        </div>
        {!isCollapsed && isActive && (
          <ChevronRight size={16} className="relative z-10 text-blue-500 dark:text-blue-200 opacity-80 animate-pulse" />
        )}
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = React.memo(({ isOpen, onClose }) => {
  const { user, logout } = useData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { to: '/dashboard', label: 'Ana Sayfa', icon: <Home size={20} /> },
    { to: '/companies', label: 'Firmalar', icon: <Building2 size={20} /> },
    { to: '/staff', label: 'Personel', icon: <Users size={20} /> },
    { to: '/tests', label: 'Hizmetler', icon: <Activity size={20} /> },
    { to: '/proposals', label: 'Teklifler', icon: <FileText size={20} /> },
    { to: '/screenings', label: 'Sağlık Taramaları', icon: <Stethoscope size={20} /> },
    { to: '/calendar', label: 'Takvim', icon: <CalendarDays size={20} /> },
    { to: '/vehicles', label: 'Araç Takibi', icon: <Truck size={20} /> },
    { to: '/finance', label: 'Muhasebe', icon: <Calculator size={20} />, roles: ['Admin', 'Manager'] },
    { to: '/reports', label: 'Raporlar', icon: <TrendingUp size={20} /> },
  ];

  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      const roleMatch = !item.roles || (user.role && item.roles.includes(user.role));
      const searchMatch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
      return roleMatch && searchMatch;
    });
  }, [user.role, searchQuery]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-80'} transform bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
          } flex flex-col border-r border-slate-200/60 dark:border-slate-800/40 relative overflow-hidden group/sidebar`}
      >
        {/* Modern Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/10 dark:via-transparent dark:to-purple-500/10 blur-[100px] pointer-events-none"></div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute right-4 top-8 z-20 h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 shadow-sm transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Section */}
        <div className={`flex h-24 items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 shrink-0 relative z-10`}>
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover transition-all duration-300 group-hover:scale-105 shadow-blue-500/10" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">HanTech</span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">Yönetim Paneli</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden transition-all duration-200"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-4 mb-4 relative z-10">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Menüde ara..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800/60 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar py-2 relative z-10">
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>

          {/* Secondary Links Section */}
          <div className={`pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800/40 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {!isCollapsed && <p className="px-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Sistem</p>}
            
            {(user.role === 'Admin' || user.role === 'Manager') && (
              <NavItem 
                item={{ to: '/users', label: 'Kullanıcı Yönetimi', icon: <UserCheck size={20} /> }} 
                isCollapsed={isCollapsed} 
              />
            )}

            {(user.role === 'Admin') && (
              <NavItem 
                item={{ to: '/settings', label: 'Ayarlar', icon: <Settings size={20} /> }} 
                isCollapsed={isCollapsed} 
              />
            )}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 shrink-0 relative z-10">
          <div className={`rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/60 dark:border-slate-700/50 ${isCollapsed ? 'p-2' : 'p-4'} backdrop-blur-sm group hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-200/80 dark:hover:from-slate-800/80 dark:hover:to-slate-900/80 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white dark:ring-slate-900 group-hover:ring-blue-500/50 group-hover:shadow-xl transition-all duration-300">
                  {user.avatarInitials}
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></div>
              </div>
              
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{user.title}</p>
                  </div>
                  <div className="flex items-center">
                    <button onClick={logout} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10" title="Çıkış Yap">
                      <LogOut size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
