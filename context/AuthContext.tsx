
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
    if (!stored) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
    }
    return JSON.parse(stored);
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
        name: 'Admin Kullanıcı',
        email: 'admin@hantech.com',
        phone: '+90 555 000 00 00',
        title: 'Sistem Yöneticisi',
        avatarInitials: 'AK',
        role: 'Admin'
    }));

    const [loginAttempts, setLoginAttempts] = useState<Record<string, { count: number; lastAttempt: number }>>({});
    const sessionDuration = 8 * 60 * 60 * 1000;

    useEffect(() => {
        // Kesin temizlik: Eğer localStorage'da 'accounts' varsa ve içinde 'admin123' yoksa (eski hash varsa) temizle
        const storedAccounts = localStorage.getItem('accounts');
        if (storedAccounts) {
            try {
                const accounts = JSON.parse(storedAccounts);
                const adminAccount = accounts.find((a: any) => a.email === 'admin@hantech.com');
                if (adminAccount && adminAccount.password !== 'admin123') {
                    console.log('Eski şifre formatı tespit edildi, temizleniyor...');
                    localStorage.removeItem('accounts');
                    window.location.reload();
                }
            } catch (e) {
                localStorage.removeItem('accounts');
            }
        }
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

    const login = async (identifier: string, password?: string) => {
        const trimmedIdentifier = identifier.toLowerCase().trim();
        const trimmedPassword = password?.trim();
        
        // LocalStorage'daki güncel hesapları al
        const accounts = loadState<UserAccount[]>('accounts', MOCK_ACCOUNTS);
        
        const account = accounts.find(acc => 
            acc.email.toLowerCase().trim() === trimmedIdentifier || 
            (acc.username && acc.username.toLowerCase().trim() === trimmedIdentifier)
        );
        
        console.log('Giriş Denemesi:', trimmedIdentifier);
        console.log('Sistemdeki Toplam Hesap:', accounts.length);
        console.log('Bulunan Hesap:', account ? 'EVET' : 'HAYIR');

        if (account && trimmedPassword) {
            console.log('Şifre Karşılaştırması:', trimmedPassword, '==', account.password);
            
            if (trimmedPassword === account.password) {
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
                addActivityLog('Giriş Yapıldı', `${identifier} adresiyle sisteme giriş yapıldı.`);
                toast.success(`Hoş geldiniz, ${account.name}!`);
            } else {
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
