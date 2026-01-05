import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, User, Shield, Mail, Trash2, Pencil, ShieldAlert, Key, Users } from 'lucide-react';
import { UserAccount } from '../types';
import { hashPassword } from '../utils/security';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, institution, user } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<UserAccount>>({ role: 'Standard' });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('All');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: '',
        name: ''
    });

    const handleOpenModal = (user?: UserAccount) => {

        if (user) {
            setEditingUser(user);
        } else {
            setEditingUser({ role: 'Standard' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (editingUser.name && editingUser.email && (editingUser.password || !editingUser.id)) {
            if (editingUser.id) {
                // Editing existing user
                const existingAccount = accounts.find(a => a.id === editingUser.id);
                const updatedUser: UserAccount = {
                    ...editingUser as UserAccount,
                    password: editingUser.password ? await hashPassword(editingUser.password) : existingAccount?.password || '123456'
                };
                updateAccount(updatedUser);
                toast.success('Kullanıcı güncellendi.');
            } else {
                // Creating new user
                const hashedPassword = await hashPassword(editingUser.password || '123456');
                const newUser: UserAccount = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: editingUser.name || '',
                    email: editingUser.email || '',
                    password: hashedPassword,
                    role: editingUser.role || 'Standard',
                    lastLogin: new Date().toISOString()
                };
                addAccount(newUser);
                toast.success('Yeni kullanıcı davet edildi.');
            }
            setIsModalOpen(false);
        } else {
            toast.error('İsim, e-posta ve şifre zorunludur.');
        }
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            id,
            name
        });
    };

    const confirmDelete = () => {
        deleteAccount(confirmModal.id);
        setConfirmModal({ isOpen: false, id: '', name: '' });
        toast.success('Kullanıcı silindi.');
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || acc.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: accounts.length,
        admins: accounts.filter(a => a.role === 'Admin').length,
        managers: accounts.filter(a => a.role === 'Manager').length,
        standards: accounts.filter(a => a.role === 'Standard').length
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Sistem yetkili hesaplarını yönetin ve yeni kullanıcılar davet edin.</p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <Button
                        icon={<Plus size={18} />}
                        onClick={() => handleOpenModal()}
                    >
                        Yeni Kullanıcı Ekle
                    </Button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Toplam Kullanıcı</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 dark:text-purple-400">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Süper Admin</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.admins}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yöneticiler</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.managers}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-400">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Standart</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.standards}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="İsim veya e-posta ile ara..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                    >
                        <option value="All">Tüm Yetkiler</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Yönetici</option>
                        <option value="Standard">Standart</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Kullanıcı</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Yetki Seviyesi</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Son Giriş</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredAccounts.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                                    <User size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{acc.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{acc.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 ${acc.role === 'Admin'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                                : acc.role === 'Manager'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                                    : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                                                }`}>
                                                <Shield size={12} strokeWidth={3} />
                                                {acc.role === 'Admin' ? 'Süper Admin' : acc.role === 'Manager' ? 'Yönetici' : 'Standart'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                <Key size={14} className="text-slate-400" />
                                                {acc.lastLogin ? new Date(acc.lastLogin).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'HİÇ GİRİŞ YAPMADI'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(acc)}
                                                    className="p-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                {(user?.role === 'Admin' || (user?.role === 'Manager' && acc.role !== 'Admin')) && (
                                                    <button
                                                        onClick={() => handleDelete(acc.id, acc.name)}
                                                        className="p-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAccounts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    <Users size={48} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Kullanıcı bulunamadı</p>
                                                    <p className="text-xs text-slate-400 mt-1">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser.id ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Davet Et"}
            >
                <div className="space-y-5 py-2">
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-blue-500 transition-colors">Ad Soyad</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                placeholder="Ahmet Yılmaz"
                                value={editingUser.name || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-blue-500 transition-colors">E-posta Adresi</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                type="email"
                                placeholder="ahmet@hantech.com"
                                value={editingUser.email || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-blue-500 transition-colors">Erişim Şifresi</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                type="password"
                                placeholder={editingUser.id ? "Yeni şifre (opsiyonel)" : "••••••••"}
                                value={editingUser.password || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                            />
                        </div>
                        {editingUser.id && <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 italic">* Mevcut şifreyi korumak için boş bırakın.</p>}
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-blue-500 transition-colors">Yetki Tanımlama</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <select
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 pl-12 pr-10 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                disabled={user?.role === 'Standard'}
                            >
                                <option value="Standard">Standart Kullanıcı (Salt Okunur)</option>
                                <option value="Manager">Yönetici (Operasyonel Yetki)</option>
                                {user?.role === 'Admin' && <option value="Admin">Süper Admin (Tam Yetki)</option>}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Plus size={14} className="rotate-45 text-slate-400" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 italic">* Yöneticiler personel ve kullanıcı yönetimi yapabilir.</p>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button
                            className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Vazgeç
                        </button>
                        <button
                            className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            onClick={handleSave}
                        >
                            {editingUser.id ? 'Değişiklikleri Kaydet' : 'Hesabı Aktifleştir'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Kullanıcıyı Sil"
                message={`"${confirmModal.name}" isimli kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Kullanıcıyı Sil"
                variant="danger"
            />
        </div>
    );
};

export default UserManagement;
