
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal'; // Keep modal for functionality if needed later
import { ConfirmModal } from '../components/ConfirmModal';
import { generateProposalPDF } from '../services/pdfService';
import { Pagination } from '../components/Pagination';
import {
    FileText, Plus, Search, Filter, TrendingUp, Calendar,
    Download, Eye, MoreHorizontal, LayoutGrid, List,
    ArrowUpRight, CheckCircle2, XCircle, Clock, Copy, Trash2
} from 'lucide-react';
import { Proposal, ProposalStatus } from '../types';
import toast from 'react-hot-toast';

// Local Stats Card - Compact Design
const StatsCard = ({ title, value, icon: Icon, description, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0`}>
            <Icon size={18} className={colorClass.split(' ')[1].replace('bg-', 'text-')} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">{title}</p>
                {description && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 shrink-0">{description}</span>}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-0.5">{value}</h3>
        </div>
    </div>
);

const Proposals: React.FC = () => {
    const navigate = useNavigate();
    const { proposals, companies, tests, institution, exportToExcel, addProposal, deleteProposals } = useData();

    // State
    const [searchTerm, setSearchTerm] = useState("");
    const [activeStatuses, setActiveStatuses] = useState<string[]>([
        "Draft", "Sent", "Approved", "Rejected"
    ]);
    const [sortKey, setSortKey] = useState<"dateDesc" | "dateAsc" | "amountDesc">("dateDesc");
    const [viewMode, setViewMode] = useState<"card" | "table">("table"); // Default table

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([]);

    // Filtering & Sorting Logic
    const filteredProposals = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();

        const filtered = proposals.map(p => {
            const company = companies.find(c => c.id === p.companyId);
            return { ...p, companyName: company?.name || 'Bilinmiyor' };
        }).filter((p) => {
            // Status Filter
            if (!activeStatuses.includes(p.status)) return false;

            // Search Filter
            if (!q) return true;
            const haystack = `${p.id} ${p.companyName} ${p.date}`.toLowerCase();
            return haystack.includes(q);
        });

        return [...filtered].sort((a, b) => {
            if (sortKey === "dateAsc") {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            if (sortKey === "dateDesc") {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return b.totalAmount - a.totalAmount; // amountDesc
        });
    }, [proposals, companies, activeStatuses, searchTerm, sortKey]);

    const currencySymbol = (currency: string) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            default: return '₺';
        }
    };

    // Pagination Logic
    const paginatedProposals = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProposals.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProposals, currentPage, itemsPerPage]);

    // Statistics
    const stats = useMemo(() => {
        const counts = {
            Draft: 0,
            Sent: 0,
            Approved: 0,
            Rejected: 0
        };
        let totalAmount = 0;
        let approvedAmount = 0;
        let pendingAmount = 0;

        proposals.forEach((p) => {
            if (counts[p.status as keyof typeof counts] !== undefined) counts[p.status as keyof typeof counts]++;
            totalAmount += p.totalAmount;
            if (p.status === 'Approved') approvedAmount += p.totalAmount;
            if (p.status === 'Sent' || p.status === 'Draft') pendingAmount += p.totalAmount;
        });
        
        const conversionRate = proposals.length > 0 
            ? Math.round((counts.Approved / proposals.length) * 100) 
            : 0;

        return { counts, totalAmount, approvedAmount, pendingAmount, conversionRate };
    }, [proposals]);

    const toggleStatus = (status: string) => {
        setActiveStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        );
        setCurrentPage(1);
    };

    const toggleSelectAll = () => {
        if (selectedProposalIds.length === paginatedProposals.length) {
            setSelectedProposalIds([]);
        } else {
            setSelectedProposalIds(paginatedProposals.map(p => p.id));
        }
    };

    const toggleSelectProposal = (id: string) => {
        setSelectedProposalIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedProposalIds.length === 0) return;
        
        setConfirmModal({
            isOpen: true,
            title: 'Toplu Silme',
            message: `${selectedProposalIds.length} adet teklifi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            onConfirm: () => {
                deleteProposals(selectedProposalIds);
                setSelectedProposalIds([]);
                toast.success('Seçili teklifler silindi.');
            }
        });
    };

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle2 size={12} /> Onaylandı</span>;
            case "Sent": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><Clock size={12} /> Gönderildi</span>;
            case "Rejected": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><XCircle size={12} /> Reddedildi</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><FileText size={12} /> Taslak</span>;
        }
    };

    const handleDownload = (e: React.MouseEvent, proposalId: string) => {
        e.stopPropagation();
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;
        const company = companies.find(c => c.id === proposal.companyId);
        if (company) {
            generateProposalPDF(proposal, company, tests, institution);
        }
    };

    const handleDuplicate = (e: React.MouseEvent, proposal: Proposal) => {
        e.stopPropagation();
        const currentYear = new Date().getFullYear();
        const newId = `PR-${currentYear}-${Math.floor(Math.random() * 10000)}`;
        const duplicatedProposal: Proposal = {
            ...proposal,
            id: newId,
            date: new Date().toISOString().split('T')[0],
            status: 'Draft',
            currentVersion: 1,
            versions: [
                {
                    version: 1,
                    date: new Date().toISOString(),
                    items: [...proposal.items],
                    totalAmount: proposal.totalAmount,
                    notes: proposal.notes,
                    createdBy: 'Sistem Yöneticisi'
                }
            ]
        };
        addProposal(duplicatedProposal);
        toast.success('Teklif başarıyla kopyalandı (Taslak olarak).');
        navigate(`/proposals/${newId}`);
    };

    const handleExportCSV = () => {
        const data = filteredProposals.map(p => ({
            'Teklif No': p.id,
            'Firma': p.companyName,
            'Tarih': p.date,
            'Durum': p.status,
            'Toplam Tutar': p.totalAmount,
        }));
        exportToExcel(data, 'teklifler-listesi.xlsx');
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Teklif Yönetimi</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Fiyatlandırma, onay süreçleri ve sözleşmeler.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={<Download size={18} />} onClick={handleExportCSV}>Excel</Button>
                    <Button icon={<Plus size={18} />} onClick={() => navigate('/proposals/create')}>Yeni Teklif</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Toplam Teklif"
                    value={proposals.length}
                    icon={FileText}
                    description="Tüm Zamanlar"
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatsCard
                    title="Onay Oranı"
                    value={`%${stats.conversionRate}`}
                    icon={TrendingUp}
                    description="Dönüşüm"
                    colorClass="bg-green-500 text-green-500"
                />
                <StatsCard
                    title="Bekleyen Tutar"
                    value={`${stats.pendingAmount.toLocaleString('tr-TR')} ₺`}
                    icon={Clock}
                    description="Draft & Gönderildi"
                    colorClass="bg-amber-500 text-amber-500"
                />
                <StatsCard
                    title="Onaylanan Ciro"
                    value={`${stats.approvedAmount.toLocaleString('tr-TR')} ₺`}
                    icon={ArrowUpRight}
                    description="Gerçekleşen"
                    colorClass="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Filter & Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 p-2">
                    {selectedProposalIds.length > 0 ? (
                        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-left-2">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{selectedProposalIds.length} Seçili</span>
                            <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                            <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={handleBulkDelete}>Sil</Button>
                            <button onClick={() => setSelectedProposalIds([])} className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">İptal</button>
                        </div>
                    ) : (
                        <div className="relative w-full sm:w-80 group">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                placeholder="Firma, ID veya tarih ara..."
                                className="pl-10 input bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm group-focus-within:ring-2 ring-blue-100 dark:ring-blue-900/50"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 px-2 border-r border-slate-200 dark:border-slate-700">
                            <Filter className="w-4 h-4" />
                            <span className="font-medium hidden sm:inline">Durum:</span>
                        </div>
                        {[
                            ["Draft", "Taslak"],
                            ["Sent", "Gönderildi"],
                            ["Approved", "Onaylandı"],
                            ["Rejected", "Reddedildi"]
                        ].map(([key, label]) => {
                            const isActive = activeStatuses.includes(key);
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleStatus(key)}
                                    className={`filter-pill ${isActive ? 'filter-pill-active' : 'filter-pill-inactive'}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3 p-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                    <select
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-blue-400 dark:hover:border-slate-500 transition-colors shadow-sm"
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as any)}
                    >
                        <option value="dateDesc">Tarih (Yeni &rarr; Eski)</option>
                        <option value="dateAsc">Tarih (Eski &rarr; Yeni)</option>
                        <option value="amountDesc">Tutar (Azalan)</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedProposals.map(proposal => (
                        <div
                            key={proposal.id}
                            className="group bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                            onClick={() => navigate(`/proposals/${proposal.id}`)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg border border-blue-100 dark:border-blue-800">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{proposal.id}</h3>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono">v{proposal.currentVersion || 1}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1">{proposal.companyName}</p>
                                    </div>
                                </div>
                                {getStatusBadge(proposal.status)}
                            </div>

                            {/* Card Content */}
                            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex-1">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teklif Tarihi</span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Calendar size={12} className="text-slate-400" />
                                        {new Date(proposal.date).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geçerlilik</span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {new Date(proposal.validUntil).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 col-span-2 mt-1 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Toplam Teklif Tutarı</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white text-center tracking-tight">
                                        {proposal.totalAmount.toLocaleString('tr-TR')} {currencySymbol(proposal.currency || 'TRY')}
                                    </span>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <div className="flex items-center -space-x-2">
                                    {proposal.items.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-600" title={tests.find(t => t.id === item.testId)?.name}>
                                            {tests.find(t => t.id === item.testId)?.name.charAt(0) || '?'}
                                        </div>
                                    ))}
                                    {proposal.items.length > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                            +{proposal.items.length - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl" onClick={(e) => handleDuplicate(e, proposal)} title="Kopyala">
                                        <Copy size={16} />
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl" onClick={(e) => handleDownload(e, proposal.id)} title="İndir">
                                        <Download size={16} />
                                    </Button>
                                    <Button size="sm" variant="primary" className="px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20" onClick={() => navigate(`/proposals/${proposal.id}`)}>
                                        İncele
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-6 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedProposalIds.length === paginatedProposals.length && paginatedProposals.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Teklif No</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Firma</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Tarih</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Tutar</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Durum</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProposals.map(proposal => (
                                    <tr
                                        key={proposal.id}
                                        className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group ${selectedProposalIds.includes(proposal.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        onClick={() => navigate(`/proposals/${proposal.id}`)}
                                    >
                                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedProposalIds.includes(proposal.id)}
                                                onChange={() => toggleSelectProposal(proposal.id)}
                                            />
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">{proposal.id} <span className="text-[10px] text-slate-400 font-mono ml-1">v{proposal.currentVersion || 1}</span></td>
                                        <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{proposal.companyName}</td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-sm">{new Date(proposal.date).toLocaleDateString('tr-TR')}</td>
                                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">{proposal.totalAmount.toLocaleString('tr-TR')} {currencySymbol(proposal.currency || 'TRY')}</td>
                                        <td className="py-4 px-6">{getStatusBadge(proposal.status)}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleDuplicate(e, proposal)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                                    title="Kopyala"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDownload(e, proposal.id)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="İndir"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/proposals/${proposal.id}`)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                                    title="Detay"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Pagination
                totalItems={filteredProposals.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant="danger"
            />
        </div>
    );
};

export default Proposals;
