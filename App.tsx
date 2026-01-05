
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import { AIAssistant } from './components/AIAssistant';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';

// Lazy loaded components for better performance
// ... (Lazy imports stay the same)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Companies = lazy(() => import('./pages/Companies'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));
const Staff = lazy(() => import('./pages/Staff'));
const StaffDetail = lazy(() => import('./pages/StaffDetail'));
const TestPool = lazy(() => import('./pages/TestPool'));
const Proposals = lazy(() => import('./pages/Proposals'));
const CreateProposal = lazy(() => import('./pages/CreateProposal'));
const ProposalDetail = lazy(() => import('./pages/ProposalDetail'));
const Screenings = lazy(() => import('./pages/Screenings'));
const ScreeningDetail = lazy(() => import('./pages/ScreeningDetail'));
const CreateScreening = lazy(() => import('./pages/CreateScreening'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const VehicleManagement = lazy(() => import('./pages/VehicleManagement'));
const FieldOperationForm = lazy(() => import('./pages/FieldOperationForm'));
const Finance = lazy(() => import('./pages/Finance'));

// Layout Component (Protected)
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Background Gradients for Depth */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[80px]"></div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-colors duration-300">
        <Header onMenuClick={toggleSidebar} />
        <main className="w-full grow p-6 lg:p-8 transition-all duration-300">
          <div className="mx-auto w-full animate-fade-in-up">
            <AIAssistant />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Role-Based Route Protection
const RoleRoute: React.FC<{ children: React.ReactNode, roles: string[] }> = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user.role || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

        <Route path="/" element={<ProtectedLayout><Navigate to="/dashboard" replace /></ProtectedLayout>} />
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/companies" element={<ProtectedLayout><Companies /></ProtectedLayout>} />
        <Route path="/companies/:id" element={<ProtectedLayout><CompanyDetail /></ProtectedLayout>} />
        <Route path="/staff" element={<ProtectedLayout><Staff /></ProtectedLayout>} />
        <Route path="/staff/:id" element={<ProtectedLayout><StaffDetail /></ProtectedLayout>} />
        <Route path="/tests" element={<ProtectedLayout><TestPool /></ProtectedLayout>} />
        <Route path="/proposals" element={<ProtectedLayout><Proposals /></ProtectedLayout>} />
        <Route path="/proposals/create" element={<ProtectedLayout><CreateProposal /></ProtectedLayout>} />
        <Route path="/proposals/:id" element={<ProtectedLayout><ProposalDetail /></ProtectedLayout>} />
        <Route path="/screenings" element={<ProtectedLayout><Screenings /></ProtectedLayout>} />
        <Route path="/screenings/create" element={<ProtectedLayout><CreateScreening /></ProtectedLayout>} />
        <Route path="/screenings/:id" element={<ProtectedLayout><ScreeningDetail /></ProtectedLayout>} />
        <Route path="/screenings/:id/field-form" element={<ProtectedLayout><FieldOperationForm /></ProtectedLayout>} />
        <Route path="/calendar" element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
        <Route path="/vehicles" element={<ProtectedLayout><VehicleManagement /></ProtectedLayout>} />
        <Route path="/finance" element={
          <ProtectedLayout>
            <RoleRoute roles={['Admin', 'Manager']}><Finance /></RoleRoute>
          </ProtectedLayout>
        } />
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />

        <Route path="/settings" element={
          <ProtectedLayout>
            <RoleRoute roles={['Admin', 'Manager']}><Settings /></RoleRoute>
          </ProtectedLayout>
        } />
        <Route path="/users" element={
          <ProtectedLayout>
            <RoleRoute roles={['Admin', 'Manager']}><UserManagement /></RoleRoute>
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <AppRoutes />
          <KeyboardShortcuts />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'text-sm font-medium',
              style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
              },
            }}
          />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
