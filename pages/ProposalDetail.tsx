import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { getProposalDocDefinition } from '../services/pdfService';
import { 
  ArrowLeft, Save, Mail, Trash2, Plus, RefreshCw, FileText, Download, 
  Calendar, CheckCircle2, XCircle, Clock, Send, AlertCircle, Copy, Check
} from 'lucide-react';
import { Proposal, ProposalItem } from '../types';
import toast from 'react-hot-toast';

const ProposalDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { proposals, companies, tests, institution, updateProposal } = useData();

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'items' | 'settings' | 'email' | 'versions'>('items');
    const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isEmailSending, setIsEmailSending] = useState(false);
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
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            // HTML içeriğini kopyalamak için ClipboardItem kullanıyoruz
            const blob = new Blob([emailBody], { type: 'text/html' });
            const richText = new ClipboardItem({ 'text/html': blob });
            await navigator.clipboard.write([richText]);
            setCopied(true);
            toast.success("Tasarım kopyalandı! Gmail'e yapıştırabilirsiniz.");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Kopyalama hatası:', err);
            toast.error("Tasarım kopyalanamadı.");
        }
    };

    // Initial Load
    useEffect(() => {
        const found = proposals.find(p => p.id === id);
        if (found) {
            setProposal({ ...found }); // Clone to edit locally
            const targetCompany = companies.find(c => c.id === found.companyId);
            setEmailRecipients(targetCompany?.email ? [targetCompany.email] : []);
            setEmailSubject(`Teklif: ${found.id} - ${institution.name}`);
            
            const body = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #2563eb; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Hizmet Teklifi</h1>
    </div>
    <div style="padding: 32px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Sayın <strong>${targetCompany?.authorizedPerson || 'Yetkili'}</strong>,</p>
        <p style="margin-bottom: 20px;">Firmanız için hazırladığımız <strong>#${found.id}</strong> numaralı hizmet teklifi ekte bilgilerinize sunulmuştur.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Teklif Detayları:</p>
            <p style="margin: 4px 0 0 0; font-weight: 600;">Teklif Tutarı: ${found.totalAmount.toLocaleString('tr-TR')} ₺</p>
            <p style="margin: 4px 0 0 0; font-weight: 600;">Geçerlilik: ${found.validUntil ? new Date(found.validUntil).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</p>
        </div>

        <p style="margin-bottom: 24px;">Teklifimizi inceleyip geri dönüş yapmanızı rica eder, iyi çalışmalar dileriz.</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        
        <p style="font-size: 14px; margin: 0; color: #64748b;">Saygılarımızla,</p>
        <p style="font-size: 16px; font-weight: 700; margin: 4px 0 0 0; color: #1e293b;">${institution.name}</p>
        <p style="font-size: 14px; margin: 4px 0 0 0; color: #64748b;">${institution.phone || ''} | ${institution.email || ''}</p>
    </div>
    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        Bu e-posta HanTech Yönetim Paneli üzerinden otomatik olarak oluşturulmuştur.
    </div>
</div>`;
            setEmailBody(body);
        }
        setLoading(false);
    }, [id, proposals, institution, companies]);

    // Derived Company Data
    const company = proposal ? companies.find(c => c.id === proposal.companyId) : null;

    // Update PDF Preview whenever proposal changes
    useEffect(() => {
        if (!proposal || !company || !institution) return;

        const generatePreview = () => {
            try {
                if (window.pdfMake) {
                    const docDef = getProposalDocDefinition(proposal, company, tests, institution);
                    const pdfDocGenerator = window.pdfMake.createPdf(docDef);
                    pdfDocGenerator.getDataUrl((dataUrl: string) => {
                        setPdfUrl(dataUrl);
                    });
                }
            } catch (e) {
                console.error("PDF Preview generation failed", e);
            }
        };

        // Debounce
        const timeout = setTimeout(generatePreview, 500);
        return () => clearTimeout(timeout);
    }, [proposal, company, tests, institution]);


    const handleUpdateItem = (index: number, field: string, value: any) => {
        if (!proposal) return;
        const newItems = [...proposal.items];
        
        // Önce değeri güncelle
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Eğer birim fiyat, maliyet, adet veya indirim değiştiyse kalem toplamını hesapla
        if (field === 'unitPrice' || field === 'unitCost' || field === 'quantity' || field === 'discount') {
            const item = newItems[index];
            const itemSubtotal = (item.unitPrice || 0) * (item.quantity || 0);
            const itemDiscount = itemSubtotal * ((item.discount || 0) / 100);
            item.totalPrice = itemSubtotal - itemDiscount;
        }

        // Genel toplamı hesapla ve state'i güncelle
        recalculateTotal(newItems, proposal.taxRate || 20);
    };

    const handleRemoveItem = (index: number) => {
        if (!proposal) return;
        const newItems = proposal.items.filter((_, i) => i !== index);
        recalculateTotal(newItems, proposal.taxRate || 20);
    };

    const handleAddItem = (type: 'standard' | 'custom') => {
        if (!proposal) return;
        
        let newItem: ProposalItem;
        
        if (type === 'standard') {
            const test = tests[0]; // Varsayılan kayıtlı test
            newItem = {
                testId: test.id,
                unitPrice: test.price,
                unitCost: test.cost || 0,
                quantity: 1,
                discount: 0,
                totalPrice: test.price
            };
        } else {
            newItem = {
                testId: 'custom',
                customName: '',
                unitPrice: 0,
                unitCost: 0,
                quantity: 1,
                discount: 0,
                totalPrice: 0
            };
        }
        
        const newItems = [...proposal.items, newItem];
        recalculateTotal(newItems, proposal.taxRate || 20);
    };

    const recalculateTotal = (items: ProposalItem[], taxRate: number) => {
        if (!proposal) return;
        const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = subTotal * (taxRate / 100);
        const grandTotal = subTotal + taxAmount;

        setProposal({
            ...proposal,
            items: items,
            totalAmount: grandTotal,
            taxRate: taxRate
        });
    };

    const handleFinancialUpdate = (field: 'taxRate' | 'currency', value: any) => {
        if (!proposal) return;
        if (field === 'taxRate') {
            recalculateTotal(proposal.items, value);
        } else {
            setProposal({ ...proposal, [field]: value });
        }
    };

    const handleFieldUpdate = (field: keyof Proposal, value: any) => {
        if (!proposal) return;
        setProposal({ ...proposal, [field]: value });
    };

    const handleSave = async () => {
        if (proposal) {
            setSaving(true);
            
            // Create a new version
            const newVersionNumber = (proposal.versions?.length || 0) + 1;
            const newVersion = {
                version: newVersionNumber,
                date: new Date().toISOString(),
                items: [...proposal.items],
                totalAmount: proposal.totalAmount,
                notes: proposal.notes,
                createdBy: 'Sistem Yöneticisi'
            };

            const updatedProposal = {
                ...proposal,
                currentVersion: newVersionNumber,
                versions: [...(proposal.versions || []), newVersion]
            };

            setProposal(updatedProposal);
            updateProposal(updatedProposal);
            
            // Simulate network delay
            await new Promise(r => setTimeout(r, 800));
            setSaving(false);
            toast.success("Teklif güncellendi ve yeni sürüm oluşturuldu!");
        }
    };

    const handleAddEmail = () => {
        if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            if (!emailRecipients.includes(newEmail)) {
                setEmailRecipients([...emailRecipients, newEmail]);
            }
            setNewEmail('');
        } else if (newEmail) {
            toast.error('Geçerli bir e-posta adresi giriniz.');
        }
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setEmailRecipients(emailRecipients.filter(email => email !== emailToRemove));
    };

    const handleSendMail = async () => {
        if (emailRecipients.length === 0) {
            toast.error("Lütfen en az bir alıcı e-posta adresi ekleyin.");
            return;
        }

        // HTML'den düz metne dönüştürme (mailto için)
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = emailBody;
        const plainTextBody = tempDiv.innerText || tempDiv.textContent || "";

        const recipients = emailRecipients.join(',');
        const subject = encodeURIComponent(emailSubject);
        const body = encodeURIComponent(plainTextBody);

        // Mailto linkini oluştur
        const mailtoLink = `mailto:${recipients}?subject=${subject}&body=${body}`;

        // PDF'i indirt (Çünkü mailto ile dosya eklemek tarayıcı kısıtlamaları nedeniyle mümkün değildir)
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Teklif-${proposal?.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.appendChild(link);
            link.remove();
            toast.success("PDF indiriliyor, Gmail/Outlook üzerinden ekleyebilirsiniz.");
        }

        // Gmail/Outlook aç
        window.location.href = mailtoLink;

        if (proposal) {
            const updated = { ...proposal, status: 'Sent' as const };
            setProposal(updated);
            updateProposal(updated);
        }
        
        setActiveTab('items');
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    if (!proposal || !company) return <div className="p-8 text-center text-slate-500">Teklif veya firma bulunamadı.</div>;

    // Calc for display
    const subTotal = proposal.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalCost = proposal.items.reduce((sum, item) => sum + ((item.unitCost || 0) * item.quantity), 0);
    const taxRate = proposal.taxRate || 20;
    const itemDiscounts = proposal.items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) - item.totalPrice), 0);
    const taxBase = subTotal - itemDiscounts;
    const estimatedProfit = taxBase - totalCost;
    const profitMargin = taxBase > 0 ? Math.round((estimatedProfit / taxBase) * 100) : 0;
    const taxAmount = taxBase * (taxRate / 100);
    const grandTotal = taxBase + taxAmount;

    return (
        <div className="space-y-4 pb-4 w-full mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/proposals')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Teklif #{proposal.id}</h1>
                            <select
                                className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200"
                                value={proposal.status}
                                onChange={(e) => handleFieldUpdate('status', e.target.value)}
                            >
                                <option value="Draft">Taslak</option>
                                <option value="Sent">Gönderildi</option>
                                <option value="Approved">Onaylandı</option>
                                <option value="Rejected">Reddedildi</option>
                            </select>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {company.name} • {new Date(proposal.date).toLocaleDateString("tr-TR")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={activeTab === 'email' ? 'primary' : 'outline'} 
                        onClick={() => setActiveTab('email')} 
                        icon={<Mail size={16} />}
                    >
                        E-posta
                    </Button>
                    <Button onClick={handleSave} disabled={saving} icon={saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}>
                        Kaydet
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0 flex-1">
                {/* Left: Editor Tabs */}
                <div className="flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 pt-6 pb-0 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl w-full">
                            <button
                                onClick={() => setActiveTab('items')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'items' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                Hizmetler & Liste
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                Ayarlar & Notlar
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'email' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                E-posta Gönder
                            </button>
                            <button
                                onClick={() => setActiveTab('versions')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'versions' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                Versiyonlar
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/20">
                        {/* TAB 1: ITEMS */}
                        {activeTab === 'items' && (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-auto p-4 space-y-2 custom-scrollbar">
                                    {proposal.items.map((item, index) => {
                                        const testRef = tests.find(t => t.id === item.testId);
                                        return (
                                            <div key={index} className="flex gap-4 items-start p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Hizmet Adı</label>
                                                        <div className="relative flex gap-2">
                                                            <div className="flex-1">
                                                                {item.testId === 'custom' ? (
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            autoFocus
                                                                            className="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 dark:text-slate-200"
                                                                            value={item.customName || ''}
                                                                            placeholder="Özel hizmet adı giriniz..."
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const newItems = [...proposal.items];
                                                                                newItems[index] = { ...newItems[index], customName: val };
                                                                                setProposal({ ...proposal, items: newItems });
                                                                            }}
                                                                        />
                                                                        <button 
                                                                            onClick={() => {
                                                                                handleUpdateItem(index, 'testId', tests[0]?.id || '');
                                                                                handleUpdateItem(index, 'customName', undefined);
                                                                                handleUpdateItem(index, 'unitCost', tests[0]?.cost || 0);
                                                                            }}
                                                                            className="px-2 text-amber-600 hover:text-amber-700 text-xs font-medium shrink-0"
                                                                        >
                                                                            Listeye Dön
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <select
                                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
                                                                        value={item.testId}
                                                                        onChange={(e) => {
                                                                            if (e.target.value === 'custom') {
                                                                                handleUpdateItem(index, 'testId', 'custom');
                                                                                handleUpdateItem(index, 'customName', '');
                                                                                handleUpdateItem(index, 'unitCost', 0);
                                                                                return;
                                                                            }
                                                                            const selectedTest = tests.find(t => t.id === e.target.value);
                                                                            if (selectedTest) {
                                                                                handleUpdateItem(index, 'testId', selectedTest.id);
                                                                                handleUpdateItem(index, 'unitPrice', selectedTest.price);
                                                                                handleUpdateItem(index, 'unitCost', selectedTest.cost || 0);
                                                                                handleUpdateItem(index, 'customName', undefined);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <optgroup label="Kayıtlı Hizmetler">
                                                                            {tests.map(t => (
                                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                                            ))}
                                                                        </optgroup>
                                                                        <optgroup label="Diğer">
                                                                            <option value="custom">+ Yeni/Özel Hizmet Ekle</option>
                                                                        </optgroup>
                                                                    </select>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="w-32">
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Birim Maliyet</label>
                                                            <input
                                                                type="number"
                                                                value={item.unitCost || 0}
                                                                onChange={(e) => handleUpdateItem(index, 'unitCost', parseFloat(e.target.value))}
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 dark:text-slate-200"
                                                            />
                                                        </div>
                                                        <div className="w-32">
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Birim Fiyat</label>
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
                                                            />
                                                        </div>
                                                        <div className="w-24">
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">Adet</label>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value))}
                                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2 text-sm text-center font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="w-24">
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 block">İndirim (%)</label>
                                                            <input
                                                                type="number"
                                                                value={item.discount || 0}
                                                                onChange={(e) => handleUpdateItem(index, 'discount', parseFloat(e.target.value))}
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
                                                            />
                                                        </div>
                                                        <div className="flex-1 pt-7 text-right font-bold text-slate-700 dark:text-slate-300">
                                                            {(item.totalPrice || 0).toLocaleString("tr-TR")} ₺
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg mt-1 transition-colors"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <div className="flex gap-3">
                                        <button 
                                            className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors h-14 rounded-xl flex items-center justify-center gap-2 font-medium bg-white dark:bg-slate-800"
                                            onClick={() => handleAddItem('standard')}
                                        >
                                            <Plus className="w-5 h-5" />
                                            Kayıtlı Hizmet Ekle
                                        </button>
                                        <button 
                                            className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-amber-500 hover:text-amber-500 dark:hover:border-amber-400 dark:hover:text-amber-400 transition-colors h-14 rounded-xl flex items-center justify-center gap-2 font-medium bg-white dark:bg-slate-800"
                                            onClick={() => handleAddItem('custom')}
                                        >
                                            <FileText className="w-5 h-5" />
                                            Özel Hizmet Ekle
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>Ara Toplam</span>
                                            <span>{(subTotal || 0).toLocaleString("tr-TR")} ₺</span>
                                        </div>
                                        {itemDiscounts > 0 && (
                                            <div className="flex justify-between text-red-600 dark:text-red-400">
                                                <span>Toplam İndirim</span>
                                                <span>-{(itemDiscounts || 0).toLocaleString("tr-TR")} ₺</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>KDV (%{taxRate})</span>
                                            <span>{(taxAmount || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺</span>
                                        </div>

                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                                <span>Toplam Maliyet</span>
                                                <span>{(totalCost || 0).toLocaleString("tr-TR")} ₺</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-emerald-600">
                                                <span>Tahmini Kâr</span>
                                                <span>{(estimatedProfit || 0).toLocaleString("tr-TR")} ₺ (%{profitMargin})</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between font-bold text-xl text-blue-600 dark:text-blue-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <span>Genel Toplam</span>
                                            <span>{(grandTotal || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SETTINGS & NOTES */}
                        {activeTab === 'settings' && (
                            <div className="h-full overflow-auto p-6 space-y-6 custom-scrollbar">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                                        <Calendar className="w-5 h-5 text-blue-500" /> Finansal Ayarlar
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">KDV Oranı (%)</label>
                                            <div className="flex w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                {[0, 10, 20].map(rate => (
                                                    <button
                                                        key={rate}
                                                        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${(proposal.taxRate || 0) === rate
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                            }`}
                                                        onClick={() => handleFinancialUpdate('taxRate', rate)}
                                                    >
                                                        %{rate}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Teklif Geçerlilik Tarihi</label>
                                            <input
                                                type="date"
                                                className="input"
                                                value={proposal.validUntil ? new Date(proposal.validUntil).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleFieldUpdate('validUntil', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <AlertCircle className="w-5 h-5 text-indigo-500" /> Hüküm ve Koşullar
                                    </h3>
                                    <div className="space-y-3">
                                        {(proposal.terms || [
                                            'Fiyatlara KDV dahil değildir.',
                                            'Ödeme, hizmet bitiminde 15 gün içinde yapılmalıdır.',
                                            'Randevu iptalleri en geç 24 saat önceden bildirilmelidir.',
                                            'Bu belge elektronik ortamda oluşturulmuştur.'
                                        ]).map((term, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    className="flex-1 input py-2 text-sm"
                                                    value={term}
                                                    onChange={(e) => {
                                                        const newTerms = [...(proposal.terms || [
                                                            'Fiyatlara KDV dahil değildir.',
                                                            'Ödeme, hizmet bitiminde 15 gün içinde yapılmalıdır.',
                                                            'Randevu iptalleri en geç 24 saat önceden bildirilmelidir.',
                                                            'Bu belge elektronik ortamda oluşturulmuştur.'
                                                        ])];
                                                        newTerms[idx] = e.target.value;
                                                        setProposal(prev => prev ? { ...prev, terms: newTerms } : null);
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => {
                                                        const newTerms = (proposal.terms || []).filter((_, i) => i !== idx);
                                                        setProposal(prev => prev ? { ...prev, terms: newTerms } : null);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const currentTerms = proposal.terms || [
                                                    'Fiyatlara KDV dahil değildir.',
                                                    'Ödeme, hizmet bitiminde 15 gün içinde yapılmalıdır.',
                                                    'Randevu iptalleri en geç 24 saat önceden bildirilmelidir.',
                                                    'Bu belge elektronik ortamda oluşturulmuştur.'
                                                ];
                                                setProposal(prev => prev ? { ...prev, terms: [...currentTerms, ''] } : null);
                                            }}
                                            className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Yeni Madde Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-amber-500" /> Teklif Notu & Ön Yazı
                                    </h3>
                                    <textarea
                                        className="w-full min-h-[250px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                                        value={proposal.notes || ""}
                                        onChange={(e) => handleFieldUpdate('notes', e.target.value)}
                                        placeholder="Teklif için ön yazı veya özel notlar..."
                                    />
                                    <p className="text-xs text-slate-400 mt-2">Bu alan PDF'in en üst kısmında yer alır.</p>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: VERSIONS */}
                        {activeTab === 'versions' && (
                            <div className="h-full overflow-auto p-6 space-y-6 custom-scrollbar">
                                <div className="space-y-4">
                                    {(proposal.versions || []).map((v, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                        v{v.version}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">Revizyon #{v.version}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                            <Calendar size={12} />
                                                            {new Date(v.date).toLocaleDateString('tr-TR')} {new Date(v.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{v.totalAmount.toLocaleString('tr-TR')} {proposal.currency === 'TRY' ? '₺' : proposal.currency}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{v.createdBy}</p>
                                                </div>
                                            </div>
                                            {v.notes && (
                                                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-2">
                                                    {v.notes}
                                                </p>
                                            )}
                                            <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" icon={<RefreshCw size={14} />} onClick={() => {
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        title: 'Versiyon Geri Yükle',
                                                        message: `v${v.version} versiyonuna geri dönmek istediğinize emin misiniz? Mevcut düzenlemeleriniz kaybolacaktır.`,
                                                        onConfirm: () => {
                                                            setProposal({
                                                                ...proposal,
                                                                items: v.items,
                                                                totalAmount: v.totalAmount,
                                                                notes: v.notes || '',
                                                                currentVersion: v.version
                                                            });
                                                            toast.success(`v${v.version} geri yüklendi.`);
                                                        }
                                                    });
                                                }}>Geri Yükle</Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!proposal.versions || proposal.versions.length === 0) && (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Henüz bir versiyon kaydı bulunmuyor.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'email' && (
                            <div className="h-full overflow-auto p-6 space-y-6 custom-scrollbar">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                                        <Mail className="w-5 h-5 text-indigo-500" /> E-posta Gönderimi
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="label">Alıcı Adresleri</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {emailRecipients.map(email => (
                                                    <div key={email} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800">
                                                        <span>{email}</span>
                                                        <button 
                                                            onClick={() => handleRemoveEmail(email)}
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {emailRecipients.length === 0 && (
                                                    <p className="text-xs text-amber-500 font-medium py-1">Lütfen alıcı adresi ekleyin.</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    className="input"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                                    placeholder="Yeni e-posta ekle..."
                                                />
                                                <Button variant="outline" onClick={handleAddEmail}>Ekle</Button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="label">Konu</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={emailSubject}
                                                onChange={(e) => setEmailSubject(e.target.value)}
                                                placeholder="E-posta konusu..."
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="label mb-0">E-posta Tasarımı (Canlı Önizleme)</label>
                                                <button 
                                                    onClick={copyToClipboard}
                                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                                        copied 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800'
                                                    }`}
                                                >
                                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                                    {copied ? 'Kopyalandı!' : 'Tasarımı Kopyala'}
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div 
                                                    className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-auto max-h-[400px] text-sm shadow-inner"
                                                    dangerouslySetInnerHTML={{ __html: emailBody }}
                                                />
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shrink-0">
                                                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 text-xs">
                                                        <p className="font-bold text-blue-900 dark:text-blue-200">En İyi Sonuç İçin</p>
                                                        <p className="text-blue-700 dark:text-blue-400 opacity-80 leading-relaxed mt-1">
                                                            Tasarımı korumak için yukarıdaki <strong>"Tasarımı Kopyala"</strong> butonuna basın, 
                                                            ardından açılacak Gmail/Outlook penceresinde mesaj alanına <strong>Sağ Tık &gt; Yapıştır (CTRL+V)</strong> yapın. 
                                                            Böylece renkler ve tablolar olduğu gibi aktarılır.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50 flex items-start gap-3">
                                                    <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg shrink-0">
                                                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <div className="flex-1 text-xs">
                                                        <p className="font-bold text-amber-900 dark:text-amber-200">Dosya Eki Hatırlatması</p>
                                                        <p className="text-amber-700 dark:text-amber-400 opacity-80 leading-relaxed mt-1">
                                                            PDF dosyası otomatik olarak indirilecektir. Lütfen maili göndermeden önce 
                                                            indirilen PDF'i e-postanıza eklemeyi unutmayın.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button 
                                                className="w-full py-4 text-base shadow-xl shadow-indigo-500/20 font-bold" 
                                                onClick={handleSendMail}
                                                disabled={emailRecipients.length === 0}
                                                icon={<Send size={20} />}
                                            >
                                                E-posta Uygulamasını Aç (Gmail/Outlook)
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: PDF Preview */}
                <div className="flex flex-col bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="py-3 px-5 border-b border-slate-800 bg-slate-950 flex flex-row justify-between items-center shrink-0">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            Canlı PDF Önizleme
                        </h3>
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                download={`Teklif-${proposal.id}.pdf`}
                                className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                            >
                                <Download className="w-3 h-3" /> İndir
                            </a>
                        )}
                    </div>
                    <div className="flex-1 bg-slate-800/50 relative w-full h-full flex items-center justify-center p-4">
                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl + "#toolbar=0&view=FitH"}
                                className="w-full h-full border-none rounded-xl shadow-lg"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                                <RefreshCw className="w-8 h-8 animate-spin opacity-50" />
                                <p className="text-sm">Önizleme oluşturuluyor...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    );
}

export default ProposalDetail;
