
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { generateProposalPDF } from '../services/pdfService';
import { ArrowLeft, ArrowRight, Eye, Plus, Search, Trash2, CheckCircle2, Building2, Save, FileText, User, Phone, MapPin } from 'lucide-react';
import { ProposalItem, HealthTest, Proposal, Company } from '../types';
import toast from 'react-hot-toast';

const CreateProposal: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { companies, tests, addProposal, institution, addCompany } = useData();

    // Workflow State
    const [step, setStep] = useState(1);

    // Data State
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [selectedTests, setSelectedTests] = useState<ProposalItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Quick Company State
    const [isQuickCompanyModalOpen, setIsQuickCompanyModalOpen] = useState(false);
    const [quickCompany, setQuickCompany] = useState<Partial<Company>>({
        name: '',
        authorizedPerson: '',
        phone: '',
        email: '',
        address: '',
        sector: '',
        status: 'Active',
        riskLevel: 'Medium'
    });

    // Financial State
    const [discountRate, setDiscountRate] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(20);
    const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    const [customNote, setCustomNote] = useState("");

    const company = companies.find((c) => c.id === selectedCompanyId);

    // calculations
    const subTotal = selectedTests.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountAmount = subTotal * (discountRate / 100);
    const taxBase = subTotal - discountAmount;
    const taxAmount = taxBase * (taxRate / 100);
    const grandTotal = taxBase + taxAmount;

    const totalCost = selectedTests.reduce((sum, item) => sum + ((item.unitCost || 0) * item.quantity), 0);
    const estimatedProfit = taxBase - totalCost;
    const profitMargin = taxBase > 0 ? Math.round((estimatedProfit / taxBase) * 100) : 0;

    const handleUpdateItem = (testId: string, field: "quantity" | "unitPrice" | "discount" | "unitCost", value: number) => {
        setSelectedTests(selectedTests.map(t => {
            if (t.testId === testId) {
                const updated = { ...t, [field]: value };
                const itemSubtotal = updated.unitPrice * updated.quantity;
                const itemDiscount = itemSubtotal * ((updated.discount || 0) / 100);
                updated.totalPrice = itemSubtotal - itemDiscount;
                return updated;
            }
            return t;
        }));
    };

    const handleAddTest = (test: HealthTest) => {
        // Default quantity 10 for quick add
        const unitPrice = test.price;
        const unitCost = test.cost || 0;
        const quantity = 10;
        setSelectedTests([...selectedTests, {
            testId: test.id,
            quantity,
            unitPrice,
            unitCost,
            discount: 0,
            totalPrice: unitPrice * quantity
        }]);
        setSearchTerm("");
    };

    // Check for pre-selected company from navigation state
    useEffect(() => {
        if (location.state && location.state.preselectedCompanyId) {
            setSelectedCompanyId(location.state.preselectedCompanyId);
        }
    }, [location.state]);

    // Auto-Generate Note when entering Step 3
    useEffect(() => {
        if (step === 3 && company) {
            const testNames = selectedTests.map(t => tests.find(mt => mt.id === t.testId)?.name).join(", ");
            const note = `Sayın ${company.authorizedPerson},
          
${company.name} firması çalışanları için talep etmiş olduğunuz aşağıdaki sağlık tarama hizmetlerine ilişkin teklifimiz ekte sunulmuştur.

Kapsam: ${testNames}

Teklifimiz ${new Date(validUntil).toLocaleDateString('tr-TR')} tarihine kadar geçerlidir.

Saygılarımızla,
${institution.name}`;
            setCustomNote(note);
        }
    }, [step, company, validUntil, selectedTests, tests, institution.name]);

    // Filtering
    const availableTests = useMemo(() => {
        if (!searchTerm) return tests;
        return tests.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, tests]);

    // Handlers
    const handleCompanySelect = (compId: string) => {
        setSelectedCompanyId(compId);
    };

    const handleSaveQuickCompany = () => {
        if (!quickCompany.name || !quickCompany.authorizedPerson || !quickCompany.phone) {
            toast.error('Lütfen gerekli alanları doldurun (Firma Adı, Yetkili, Telefon).');
            return;
        }

        const newCompany: Company = {
            id: Math.random().toString(36).substr(2, 9),
            name: quickCompany.name,
            authorizedPerson: quickCompany.authorizedPerson,
            phone: quickCompany.phone,
            email: quickCompany.email || '',
            address: quickCompany.address || '',
            sector: quickCompany.sector || 'Diğer',
            taxInfo: '',
            status: 'Active',
            riskLevel: 'Medium'
        };

        addCompany(newCompany);
        setSelectedCompanyId(newCompany.id);
        setIsQuickCompanyModalOpen(false);
        setQuickCompany({
            name: '',
            authorizedPerson: '',
            phone: '',
            email: '',
            address: '',
            sector: '',
            status: 'Active',
            riskLevel: 'Medium'
        });
        toast.success('Firma hızlıca eklendi ve seçildi.');
    };

    const handleRemoveTest = (id: string) => {
        setSelectedTests(selectedTests.filter((t) => t.testId !== id));
    };

    const handleSave = () => {
        if (!company) return;

        const currentYear = new Date().getFullYear();
        const newProposal: Proposal = {
            id: `PR-${currentYear}-${Math.floor(Math.random() * 1000)}`,
            companyId: company.id,
            date: new Date().toISOString().split('T')[0],
            validUntil,
            status: 'Draft' as const,
            items: selectedTests,
            totalAmount: grandTotal,
            taxRate,
            currency,
            exchangeRate,
            notes: customNote,
            currentVersion: 1,
            versions: [
                {
                    version: 1,
                    date: new Date().toISOString(),
                    items: selectedTests,
                    totalAmount: grandTotal,
                    notes: customNote,
                    createdBy: 'Sistem Yöneticisi'
                }
            ]
        };

        addProposal(newProposal);
        toast.success('Teklif başarıyla oluşturuldu!');
        navigate(`/proposals/${newProposal.id}`);
    };

    const handlePreviewPDF = () => {
        if (!company) return;
        // Temporary object for preview
        const tempProposal = {
            id: "TASLAK",
            companyId: company.id,
            date: new Date().toISOString(),
            validUntil,
            status: 'Draft' as const,
            items: selectedTests,
            totalAmount: grandTotal,
            taxRate,
            currency,
            exchangeRate,
            notes: customNote,
            currentVersion: 1
        };
        generateProposalPDF(tempProposal, company, tests, institution);
    };

    // --- RENDER STEPS ---

    // STEP 1: Company Selection
    if (step === 1) {
        return (
            <div className="w-full space-y-8 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/proposals')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="w-6 h-6 text-slate-500" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Yeni Teklif Oluştur</h2>
                            <p className="text-slate-500 dark:text-slate-400">Adım 1: Teklif verilecek firmayı seçin.</p>
                        </div>
                    </div>
                    <Button variant="outline" icon={<Plus size={18} />} onClick={() => setIsQuickCompanyModalOpen(true)}>Hızlı Firma Ekle</Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {companies.map((comp) => (
                        <div
                            key={comp.id}
                            className={`relative cursor-pointer transition-all duration-200 p-6 rounded-3xl border shadow-sm group hover:-translate-y-1 hover:shadow-lg ${selectedCompanyId === comp.id
                                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 ring-1 ring-blue-500'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                                }`}
                            onClick={() => handleCompanySelect(comp.id)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                                        {comp.name.charAt(0)}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{comp.name}</h3>
                                </div>
                                {selectedCompanyId === comp.id && <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5 pl-1">
                                <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Yetkili: {comp.authorizedPerson}</p>
                                <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Şehir: {comp.address.split(" ").slice(-1)[0]}</p>
                            </div>
                        </div>
                    ))}
                </div>

            <div className="flex justify-end pt-4">
                    <Button
                        size="lg"
                        disabled={!selectedCompanyId}
                        onClick={() => setStep(2)}
                        icon={<ArrowRight size={18} />}
                    >
                        İleri
                    </Button>
                </div>

                {/* Quick Company Modal */}
                <Modal
                    isOpen={isQuickCompanyModalOpen}
                    onClose={() => setIsQuickCompanyModalOpen(false)}
                    title="Hızlı Firma Kaydı"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setIsQuickCompanyModalOpen(false)}>İptal</Button>
                            <Button onClick={handleSaveQuickCompany}>Kaydet ve Seç</Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex items-start gap-3 mb-2">
                            <Building2 size={20} className="text-amber-600 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                Teklif oluştururken hızlıca firma kaydı açabilirsiniz. Daha detaylı bilgileri Firma Yönetimi sayfasından sonra ekleyebilirsiniz.
                            </p>
                        </div>

                        <div>
                            <label className="label">Firma Adı *</label>
                            <div className="relative">
                                <input
                                    className="input pl-10"
                                    placeholder="Örn: HanTech Yazılım Ltd. Şti."
                                    value={quickCompany.name}
                                    onChange={(e) => setQuickCompany({ ...quickCompany, name: e.target.value })}
                                />
                                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Yetkili Kişi *</label>
                                <div className="relative">
                                    <input
                                        className="input pl-10"
                                        placeholder="Ad Soyad"
                                        value={quickCompany.authorizedPerson}
                                        onChange={(e) => setQuickCompany({ ...quickCompany, authorizedPerson: e.target.value })}
                                    />
                                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Telefon *</label>
                                <div className="relative">
                                    <input
                                        className="input pl-10"
                                        placeholder="05..."
                                        value={quickCompany.phone}
                                        onChange={(e) => setQuickCompany({ ...quickCompany, phone: e.target.value })}
                                    />
                                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="label">E-posta</label>
                            <input
                                className="input"
                                type="email"
                                placeholder="info@firma.com"
                                value={quickCompany.email}
                                onChange={(e) => setQuickCompany({ ...quickCompany, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Şehir / Adres</label>
                            <div className="relative">
                                <input
                                    className="input pl-10"
                                    placeholder="Konum bilgisi"
                                    value={quickCompany.address}
                                    onChange={(e) => setQuickCompany({ ...quickCompany, address: e.target.value })}
                                />
                                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // STEP 2: Service Selection
    if (step === 2) {
        return (
            <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setStep(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="w-6 h-6 text-slate-500" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hizmet Seçimi</h2>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Adım 2: Hizmetleri ve miktarları belirleyin.</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Ara Toplam</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{subTotal.toLocaleString("tr-TR")} ₺</div>
                        </div>
                        <Button size="lg" disabled={selectedTests.length === 0} onClick={() => setStep(3)} icon={<ArrowRight size={18} />}>
                            İleri
                        </Button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                    {/* LEFT: Test Pool (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-800 dark:text-white">Hizmet Havuzu</h3>
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-bold">{availableTests.length}</span>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    placeholder="Test ara..."
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {availableTests.map(test => {
                                const isSelected = selectedTests.some(st => st.testId === test.id);
                                if (isSelected) return null;

                                return (
                                    <div key={test.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700" onClick={() => handleAddTest(test)}>
                                        <div className="overflow-hidden">
                                            <div className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{test.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 mt-0.5">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{test.category}</span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">{test.price} ₺</span>
                                            </div>
                                        </div>
                                        <button className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                )
                            })}
                            {availableTests.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Aranan kriterde hizmet bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Selected Items (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex justify-between items-center">
                            <h3 className="font-bold text-blue-900 dark:text-blue-100">Seçilen Hizmetler</h3>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">{selectedTests.length} Kalem</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 sticky top-0 z-10 font-semibold border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="py-3 px-6">Hizmet Adı</th>
                                        <th className="py-3 px-4 text-center w-28">Birim Maliyet</th>
                                        <th className="py-3 px-4 text-center w-28">Birim Fiyat</th>
                                        <th className="py-3 px-4 text-center w-24">Miktar</th>
                                        <th className="py-3 px-4 text-center w-20">İndirim</th>
                                        <th className="py-3 px-6 text-right w-32">Toplam</th>
                                        <th className="w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {selectedTests.map(item => {
                                        const test = tests.find(t => t.id === item.testId)!;
                                        return (
                                            <tr key={item.testId} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="py-3 px-6">
                                                    <div className="font-medium text-slate-800 dark:text-white">{test.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">{test.category}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            className="w-full text-center bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg py-1 text-xs focus:border-amber-500 focus:outline-none dark:text-slate-300"
                                                            value={item.unitCost}
                                                            onChange={(e) => handleUpdateItem(item.testId, 'unitCost', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">₺</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-sm focus:border-blue-500 focus:outline-none dark:text-white"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleUpdateItem(item.testId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">₺</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        className="w-full text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 rounded-lg py-1 focus:outline-none"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(item.testId, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            className="w-full text-center bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg py-1 text-xs focus:border-blue-500 focus:outline-none dark:text-white"
                                                            value={item.discount || 0}
                                                            onChange={(e) => handleUpdateItem(item.testId, 'discount', parseFloat(e.target.value) || 0)}
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-right font-bold text-slate-900 dark:text-white">
                                                    {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency === 'TRY' ? '₺' : currency}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        onClick={() => handleRemoveTest(item.testId)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {selectedTests.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Plus className="w-10 h-10 mb-3 opacity-20" />
                                                    <p>Soldaki hizmet havuzundan teklife ekleme yapın.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 3: Financials & Notes
    return (
        <div className="w-full space-y-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
                <button onClick={() => setStep(2)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-500" />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Finansal Detaylar & Onay</h2>
                    <p className="text-slate-500 dark:text-slate-400">Adım 3: İndirim, KDV ve teklif koşullarını belirleyin.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Financial Settings */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" /> Finansal Ayarlar
                        </h3>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Genel İndirim (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={discountRate}
                                        onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="label">Para Birimi</label>
                                    <select
                                        className="input"
                                        value={currency}
                                        onChange={(e) => {
                                            const newCurrency = e.target.value as any;
                                            setCurrency(newCurrency);
                                            if (newCurrency === 'TRY') setExchangeRate(1);
                                        }}
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            {currency !== 'TRY' && (
                                <div className="animate-fade-in">
                                    <label className="label flex justify-between items-center">
                                        <span>Manuel Döviz Kuru (1 {currency} = ? ₺)</span>
                                        <span className="text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-900/40 px-2 py-0.5 rounded">Gerekli</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input border-blue-200 dark:border-blue-800 focus:ring-blue-500"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                                        placeholder="Kur giriniz..."
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Teklif toplamı bu kur üzerinden hesaplanmaz, sadece bilgilendirme ve raporlama amaçlıdır.</p>
                                </div>
                            )}

                            <div>
                                <label className="label">KDV Oranı (%)</label>
                                <div className="flex gap-2">
                                    {[0, 10, 20].map(rate => (
                                        <button
                                            key={rate}
                                            onClick={() => setTaxRate(rate)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${taxRate === rate
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none'
                                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            %{rate}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">Geçerlilik Tarihi</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>Ara Toplam</span>
                                <span>{subTotal.toLocaleString("tr-TR")} {currency === 'TRY' ? '₺' : currency}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-red-600 font-medium">
                                    <span>Genel İndirim (%{discountRate})</span>
                                    <span>-{discountAmount.toLocaleString("tr-TR")} {currency === 'TRY' ? '₺' : currency}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>KDV (%{taxRate})</span>
                                <span>{taxAmount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {currency === 'TRY' ? '₺' : currency}</span>
                            </div>
                            
                            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <span>Toplam Maliyet</span>
                                    <span>{totalCost.toLocaleString("tr-TR")} {currency === 'TRY' ? '₺' : currency}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                    <span>Tahmini Kâr</span>
                                    <span>{estimatedProfit.toLocaleString("tr-TR")} {currency === 'TRY' ? '₺' : currency} (%{profitMargin})</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-2xl font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700">
                                <span>GENEL TOPLAM</span>
                                <span className="text-blue-600 dark:text-blue-400">{grandTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {currency === 'TRY' ? '₺' : currency}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note Editor */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-white">Teklif Notu</h3>
                    </div>
                    <div className="flex-1 p-0">
                        <textarea
                            className="w-full h-full min-h-[350px] p-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 resize-none outline-none bg-transparent font-mono"
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={handlePreviewPDF} icon={<Eye size={18} />}>
                    PDF Önizle
                </Button>
                <Button size="lg" onClick={handleSave} icon={<Save size={18} />}>
                    Teklifi Tamamla & Kaydet
                </Button>
            </div>
        </div>
    );
};

export default CreateProposal;
