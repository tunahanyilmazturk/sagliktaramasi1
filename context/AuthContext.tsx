
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserAccount, ActivityLog, Notification } from '../types';
import { MOCK_ACCOUNTS } from '../constants';
import toast from 'react-hot-toast';
import { verifyPassword } from '../utils/security';

interface AuthContextType {
    user: UserProfile;
    isAuthenticated: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: UserProfile) => void;
    addActivityLog: (action: string, details: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadState = <T,>(key: string, fallback: T): T => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        const lastActivity = localStorage.getItem('lastActivity');

        if (storedAuth === 'true' && storedUser && lastActivity) {
            const sessionAge = Date.now() - parseInt(lastActivity);
            const sessionDuration = 8 * 60 * 60 * 1000;
            if (sessionAge < sessionDuration) return true;

            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('lastActivity');
            return false;
        }
        return false;
    });

    const [user, setUser] = useState<UserProfile>(() => loadState('user', {
        name: 'Admin User',
        email: 'admin@hantech.com',
        phone: '+90 555 123 45 67',
        title: 'Sistem Yöneticisi',
        avatarInitials: 'AU',
        role: 'Admin'
    }));

    const [loginAttempts, setLoginAttempts] = useState<Record<string, { count: number; lastAttempt: number }>>({});
    const sessionDuration = 8 * 60 * 60 * 1000;

    useEffect(() => {
        localStorage.setItem('user', JSON.stringify(user));
    }, [user]);

    const addActivityLog = (action: string, details: string) => {
        // In actual implementation, this might call a global log setter or API
        const newLog: ActivityLog = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user.email,
            userEmail: user.email,
            action,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: '127.0.0.1'
        };

        // We'll let DataContext handle the actual storage of logs for now to avoid global state mess
        // or we can persist logs independently
        const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        localStorage.setItem('activityLogs', JSON.stringify([newLog, ...existingLogs].slice(0, 1000)));
    };

    const login = async (email: string, password?: string) => {
        const attempt = loginAttempts[email] || { count: 0, lastAttempt: 0 };
        const now = Date.now();
        const lockoutDuration = 15 * 60 * 1000;
        const maxAttempts = 5;

        if (attempt.count >= maxAttempts && (now - attempt.lastAttempt) < lockoutDuration) {
            const remainingTime = Math.ceil((lockoutDuration - (now - attempt.lastAttempt)) / 60000);
            toast.error(`Çok fazla başarısız deneme! Lütfen ${remainingTime} dakika sonra tekrar deneyin.`);
            return;
        }

        const accounts = loadState<UserAccount[]>('accounts', MOCK_ACCOUNTS);
        const account = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());

        if (account && password) {
            const isValidPassword = await verifyPassword(password, account.password);

            if (isValidPassword) {
                setLoginAttempts({});
                setUser({
                    name: account.name,
                    email: account.email,
                    phone: account.phone || '+90 555 123 45 67',
                    title: account.title || 'Sistem Kullanıcısı',
                    avatarInitials: account.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
                    role: account.role
                });
                setIsAuthenticated(true);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('lastActivity', Date.now().toString());
                addActivityLog('Giriş Yapıldı', `${email} adresiyle sisteme giriş yapıldı.`);
                toast.success(`Hoş geldiniz, ${account.name}!`);
            } else {
                setLoginAttempts(prev => ({
                    ...prev,
                    [email]: { count: (prev[email]?.count || 0) + 1, lastAttempt: now }
                }));
                toast.error('Hatalı şifre!');
            }
        } else {
            toast.error('Hesap bulunamadı veya bilgiler hatalı.');
        }
    };

    const logout = () => {
        addActivityLog('Çıkış Yapıldı', 'Sistemden çıkış yapıldı.');
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('lastActivity');
        setUser({
            name: 'Admin User',
            email: 'admin@hantech.com',
            phone: '+90 555 123 45 67',
            title: 'Sistem Yöneticisi',
            avatarInitials: 'AU',
            role: 'Admin'
        });
        toast.success('Çıkış yapıldı.');
    };

    const updateUser = (updatedUser: UserProfile) => {
        const initials = updatedUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        setUser({ ...updatedUser, avatarInitials: initials });
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser, addActivityLog }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
