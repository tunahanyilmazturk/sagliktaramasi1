
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import {
  Company, Staff, HealthTest, Proposal, Appointment, Notification, UserProfile, Equipment, CompanyDocument, InstitutionProfile, Task, SystemDefinitions, Subscription, UserAccount, ActivityLog
} from '../types';
import {
  MOCK_COMPANIES, MOCK_STAFF, MOCK_TESTS, MOCK_PROPOSALS, MOCK_APPOINTMENTS, MOCK_NOTIFICATIONS, MOCK_EQUIPMENT, MOCK_DOCUMENTS, MOCK_TASKS, MOCK_SUBSCRIPTION, MOCK_ACCOUNTS
} from '../constants';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthContext';

interface DataContextType {
  companies: Company[];
  staff: Staff[];
  tests: HealthTest[];
  proposals: Proposal[];
  appointments: Appointment[];
  notifications: Notification[];
  equipment: Equipment[];
  documents: CompanyDocument[];
  tasks: Task[];
  user: UserProfile;
  institution: InstitutionProfile;
  definitions: SystemDefinitions;
  accounts: UserAccount[];
  activityLogs: ActivityLog[];
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;

  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;

  addStaff: (person: Staff) => void;
  updateStaff: (person: Staff) => void;
  deleteStaff: (id: string) => void;

  addTest: (test: HealthTest) => void;
  addTests: (newTests: HealthTest[]) => void; // New bulk add function
  updateTest: (test: HealthTest) => void;
  deleteTest: (id: string) => void;

  deleteProposal: (id: string) => void;
  deleteProposals: (ids: string[]) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposal: (proposal: Proposal) => void;

  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;

  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  addEquipment: (item: Equipment) => void;
  updateEquipment: (item: Equipment) => void;
  deleteEquipment: (id: string) => void;

  addDocument: (doc: CompanyDocument) => void;
  deleteDocument: (id: string) => void;

  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;

  updateUser: (user: UserProfile) => void;
  updateInstitution: (info: InstitutionProfile) => void;
  updateSubscription: (sub: Subscription) => void;
  addAccount: (account: UserAccount) => void;
  updateAccount: (account: UserAccount) => void;
  deleteAccount: (id: string) => void;

  // Definition Actions
  addDefinitionItem: (type: 'testCategories' | 'staffRoles', item: any) => void;
  removeDefinitionItem: (type: 'testCategories' | 'staffRoles', id: string) => void;

  // Activity Log Actions
  addActivityLog: (action: string, details: string) => void;

  exportToExcel: (data: any[], filename: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to load from localStorage or fall back to mock data
const loadState = <T,>(key: string, fallback: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
};

// Debounced localStorage saver
const useDebouncedSave = (delay = 500) => {
  const saveQueue = useMemo(() => new Map<string, any>(), []);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback((key: string, value: any) => {
    saveQueue.set(key, value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveQueue.forEach((value, key) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      saveQueue.clear();
    }, delay);
  }, [saveQueue]);

  return debouncedSave;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, login, logout, updateUser } = useAuth();
  const debouncedSave = useDebouncedSave(500);

  // Data States
  const [companies, setCompanies] = useState<Company[]>(() => loadState('companies', []));
  const [staff, setStaff] = useState<Staff[]>(() => loadState('staff', []));
  const [tests, setTests] = useState<HealthTest[]>(() => loadState('tests', []));
  const [proposals, setProposals] = useState<Proposal[]>(() => loadState('proposals', []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadState('appointments', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadState('notifications', []));
  const [equipment, setEquipment] = useState<Equipment[]>(() => loadState('equipment', []));
  const [documents, setDocuments] = useState<CompanyDocument[]>(() => loadState('documents', []));
  const [tasks, setTasks] = useState<Task[]>(() => loadState('tasks', []));
  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadState('accounts', MOCK_ACCOUNTS));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadState('activityLogs', []));

  const [institution, setInstitution] = useState<InstitutionProfile>(() => {
    const defaultInst: InstitutionProfile = {
      name: 'HanTech Sağlık',
      email: 'info@hantech.com',
      phone: '+90 212 555 00 00',
      address: 'Teknoloji Vadisi, İstanbul',
      website: 'www.hantech.com',
      subscription: MOCK_SUBSCRIPTION
    };
    const loaded = loadState('institution', defaultInst);
    return loaded.name ? loaded : { ...defaultInst, ...loaded };
  });

  const [definitions, setDefinitions] = useState<SystemDefinitions>(() => loadState('definitions', {
    testCategories: ['Laboratuvar', 'Diğer İşlemler'],
    staffRoles: [
      { code: 'Doctor', label: 'Doktor' },
      { code: 'Nurse', label: 'Hemşire' },
      { code: 'Lab', label: 'Laborant' },
      { code: 'Audio', label: 'Odyometrist' },
      { code: 'Radiology', label: 'Radyoloji Tek.' },
      { code: 'Staff', label: 'Sağlık Personeli' }
    ]
  }));

  // Persist state changes with debouncing
  useEffect(() => debouncedSave('companies', companies), [companies, debouncedSave]);
  useEffect(() => debouncedSave('staff', staff), [staff, debouncedSave]);
  useEffect(() => debouncedSave('tests', tests), [tests, debouncedSave]);
  useEffect(() => debouncedSave('proposals', proposals), [proposals, debouncedSave]);
  useEffect(() => debouncedSave('appointments', appointments), [appointments, debouncedSave]);
  useEffect(() => debouncedSave('notifications', notifications), [notifications, debouncedSave]);
  useEffect(() => debouncedSave('equipment', equipment), [equipment, debouncedSave]);
  useEffect(() => debouncedSave('documents', documents), [documents, debouncedSave]);
  useEffect(() => debouncedSave('tasks', tasks), [tasks, debouncedSave]);
  useEffect(() => debouncedSave('accounts', accounts), [accounts, debouncedSave]);
  useEffect(() => debouncedSave('activityLogs', activityLogs), [activityLogs, debouncedSave]);
  useEffect(() => debouncedSave('institution', institution), [institution, debouncedSave]);
  useEffect(() => debouncedSave('definitions', definitions), [definitions, debouncedSave]);

  // Moved to AuthContext or handled globally

  // Activity Logger
  const addActivityLog = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.email,
      userEmail: user.email,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ipAddress: '127.0.0.1' // In production, get from server
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Removed from here

  // Company Actions
  const addCompany = (company: Company) => {
    setCompanies([...companies, company]);
    addNotification('Yeni Firma Eklendi', `${company.name} sisteme eklendi.`, 'info');
  };
  const updateCompany = (updated: Company) => setCompanies(companies.map(c => c.id === updated.id ? updated : c));
  const deleteCompany = (id: string) => {
    setCompanies(companies.filter(c => c.id !== id));
    addNotification('Firma Silindi', 'Firma kaydı sistemden kaldırıldı.', 'warning');
  };

  // Staff Actions
  const addStaff = (person: Staff) => {
    setStaff([...staff, person]);
    addNotification('Personel Eklendi', `${person.name} ekibe katıldı.`, 'info');
  };
  const updateStaff = (updated: Staff) => setStaff(staff.map(s => s.id === updated.id ? updated : s));
  const deleteStaff = (id: string) => setStaff(staff.filter(s => s.id !== id));

  // Test Actions
  const addTest = (test: HealthTest) => setTests([...tests, test]);
  const addTests = (newTests: HealthTest[]) => {
    setTests(prev => [...prev, ...newTests]);
    addNotification('Toplu Yükleme', `${newTests.length} yeni test sisteme eklendi.`, 'success');
  };
  const updateTest = (updated: HealthTest) => setTests(tests.map(t => t.id === updated.id ? updated : t));
  const deleteTest = (id: string) => setTests(tests.filter(t => t.id !== id));

  useEffect(() => {
    // 1. Category Migration Logic (Cleanup for tests)
    if (tests.length > 0) {
      const needsUpdate = tests.some(t => !['Laboratuvar', 'Diğer İşlemler'].includes(t.category));
      if (needsUpdate) {
        const updatedTests = tests.map(t => {
          const name = t.name.toLowerCase();
          if (name.includes('kan') || name.includes('idrar') || name.includes('tahlil') || t.category === 'Laboratuvar') {
            return { ...t, category: 'Laboratuvar' };
          }
          return { ...t, category: 'Diğer İşlemler' };
        });
        setTests(updatedTests);
      }
    }

    // 2. Definition Migration Logic (Ensure testCategories is correct)
    const validCategories = ['Laboratuvar', 'Diğer İşlemler'];
    const currentCategories = definitions?.testCategories || [];
    const isDefinitionsOutdated = !definitions || 
                                 currentCategories.length !== validCategories.length || 
                                 !currentCategories.every(cat => validCategories.includes(cat));
    
    if (isDefinitionsOutdated) {
      setDefinitions(prev => ({
        ...prev,
        testCategories: validCategories,
        staffRoles: prev?.staffRoles || [
          { code: 'Doctor', label: 'Doktor' },
          { code: 'Nurse', label: 'Hemşire' },
          { code: 'Lab', label: 'Laborant' },
          { code: 'Audio', label: 'Odyometrist' },
          { code: 'Radiology', label: 'Radyoloji Tek.' },
          { code: 'Staff', label: 'Sağlık Personeli' }
        ]
      }));
    }
  }, [tests, definitions]);

  // Proposal Actions
  const addProposal = (proposal: Proposal) => {
    setProposals([...proposals, proposal]);
    const companyName = companies.find(c => c.id === proposal.companyId)?.name || 'Firma';
    addNotification('Teklif Oluşturuldu', `${companyName} için yeni teklif hazırlandı.`, 'info');
  };

  const deleteProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
    addNotification('Teklif Silindi', 'Teklif kaydı sistemden kaldırıldı.', 'warning');
  };

  const deleteProposals = (ids: string[]) => {
    setProposals(prev => prev.filter(p => !ids.includes(p.id)));
    addNotification('Toplu Silme', `${ids.length} adet teklif silindi.`, 'warning');
  };

  const updateProposal = (updated: Proposal) => {
    setProposals(proposals.map(p => p.id === updated.id ? updated : p));
    if (updated.status === 'Approved') {
      addNotification('Teklif Onaylandı', `${updated.id} numaralı teklif onaylandı!`, 'success');
    } else if (updated.status === 'Rejected') {
      addNotification('Teklif Reddedildi', `${updated.id} numaralı teklif reddedildi.`, 'error');
    }
  };

  // Appointment Actions
  const addAppointment = (appointment: Appointment) => {
    setAppointments([...appointments, appointment]);
    addNotification('Randevu Planlandı', `${appointment.title} takvime işlendi.`, 'info');
  };

  const updateAppointment = (updated: Appointment) => {
    setAppointments(appointments.map(a => a.id === updated.id ? updated : a));
    if (updated.status === 'Completed') {
      addNotification('Tarama Tamamlandı', `${updated.title} başarıyla tamamlandı.`, 'success');
    }
  };

  const deleteAppointment = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
    addNotification('Randevu Silindi', 'Randevu/Tarama kaydı silindi.', 'warning');
  };

  // Notification Actions
  const markNotificationRead = (id: string) =>
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllNotificationsRead = () =>
    setNotifications(notifications.map(n => ({ ...n, read: true })));

  // Equipment Actions
  const addEquipment = (item: Equipment) => {
    setEquipment(prev => [...prev, item]);
    addNotification('Envanter Eklendi', `${item.name} sisteme kaydedildi.`, 'info');
  };
  const updateEquipment = (updated: Equipment) => setEquipment(prev => prev.map(e => e.id === updated.id ? updated : e));
  const deleteEquipment = (id: string) => setEquipment(prev => prev.filter(e => e.id !== id));

  // Document Actions
  const addDocument = (doc: CompanyDocument) => {
    setDocuments(prev => [doc, ...prev]);
    addNotification('Dosya Yüklendi', `${doc.title} eklendi.`, 'success');
  };
  const deleteDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  // Task Actions
  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
    addNotification('Yeni Görev', `${task.title} oluşturuldu.`, 'info');
  };
  const updateTask = (updated: Task) => setTasks(tasks.map(t => t.id === updated.id ? updated : t));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  // User & Institution Actions
  // Moved to AuthContext

  const updateInstitution = (info: InstitutionProfile) => {
    setInstitution(info);
  };

  const updateSubscription = (sub: Subscription) => {
    setInstitution(prev => ({ ...prev, subscription: sub }));
    addNotification('Abonelik Güncellendi', `Planınız ${sub.plan} olarak güncellendi.`, 'success');
  };

  const addAccount = (account: UserAccount) => {
    setAccounts([...accounts, account]);
    addNotification('Hesap Oluşturuldu', `${account.name} için yetkili hesabı açıldı.`, 'info');
  };

  const updateAccount = (updated: UserAccount) => setAccounts(accounts.map(a => a.id === updated.id ? updated : a));
  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    addNotification('Hesap Silindi', 'Kullanıcı hesabı sistemden kaldırıldı.', 'warning');
  };

  // Definition Actions
  const addDefinitionItem = (type: 'testCategories' | 'staffRoles', item: any) => {
    setDefinitions(prev => {
      if (type === 'testCategories') {
        return { ...prev, testCategories: [...prev.testCategories, item] };
      } else {
        return { ...prev, staffRoles: [...prev.staffRoles, item] };
      }
    });
    toast.success('Kayıt eklendi.');
  };

  const removeDefinitionItem = (type: 'testCategories' | 'staffRoles', id: string) => {
    setDefinitions(prev => {
      if (type === 'testCategories') {
        return { ...prev, testCategories: prev.testCategories.filter(cat => cat !== id) };
      } else {
        return { ...prev, staffRoles: prev.staffRoles.filter(role => role.code !== id) };
      }
    });
    toast.success('Kayıt silindi.');
  };

  // Utility: Export to Excel (Modern & Spacious)
  const exportToExcel = (data: any[], filename: string) => {
    if (!data || !data.length) {
      toast.error('Dışa aktarılacak veri bulunamadı.');
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to sheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Modern Styling: Set column widths based on content length or default spacious width
    const keys = Object.keys(data[0]);
    const wscols = keys.map(key => {
      // Calculate max width for this column (header vs data)
      const maxContentLength = Math.max(
        key.length,
        ...data.map(row => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: Math.min(Math.max(maxContentLength + 5, 20), 50) }; // Min 20, Max 50 chars width
    });
    ws['!cols'] = wscols;

    // Append sheet
    XLSX.utils.book_append_sheet(wb, ws, "Veriler");

    // Write file
    XLSX.writeFile(wb, filename);
    toast.success(`${filename} indirildi.`);
  };

  return (
    <DataContext.Provider value={{
      companies, staff, tests, proposals, appointments, notifications, equipment, documents, tasks, user, institution, definitions, accounts, activityLogs, isAuthenticated,
      login, logout,
      addCompany, updateCompany, deleteCompany,
      addStaff, updateStaff, deleteStaff,
      addTest, updateTest, deleteTest,
      addTests,
      addProposal, updateProposal, deleteProposal, deleteProposals,
      addAppointment, updateAppointment, deleteAppointment,
      addNotification, markNotificationRead, markAllNotificationsRead,
      addEquipment, updateEquipment, deleteEquipment,
      addDocument, deleteDocument,
      addTask, updateTask, deleteTask,
      updateUser, updateInstitution, updateSubscription,
      addAccount, updateAccount, deleteAccount,
      addDefinitionItem, removeDefinitionItem,
      addActivityLog,
      exportToExcel
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
