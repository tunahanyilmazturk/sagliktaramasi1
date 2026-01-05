
import { Company, Proposal, HealthTest, Appointment, Staff, InstitutionProfile } from '../types';

declare global {
    interface Window {
        pdfMake: any;
    }
}

// --- Compact Premium Design Constants ---
const COLORS = {
    primary: '#2563EB',    // Blue 600
    secondary: '#64748B',  // Slate 500
    dark: '#0F172A',       // Slate 900
    text: '#334155',       // Slate 700
    lightBg: '#F8FAFC',    // Slate 50 (Card Background)
    border: '#E2E8F0',     // Slate 200
    accent: '#EFF6FF',     // Blue 50
    success: '#10B981',    // Green 500
    warning: '#F59E0B'     // Amber 500
};

// --- Helpers ---

const getPageBackground = () => {
    return null;
};

// New Header: Improved layout and spacing
const getHeader = (institution: InstitutionProfile, docTitle: string, docSubTitle: string) => {
    return {
        stack: [
            {
                columns: [
                    // LEFT: Logo (Increased size and improved spacing)
                    institution.logoBase64 ? {
                        image: institution.logoBase64,
                        width: 85, // Increased from 60
                        margin: [0, 0, 0, 0],
                        alignment: 'left'
                    } : { width: 85, text: '' },

                    // MIDDLE: Institution Info (Better separation)
                    {
                        width: '*',
                        stack: [
                            { text: (institution.name || 'KURUM ADI').toUpperCase(), fontSize: 13, bold: true, color: COLORS.primary, marginBottom: 4 },
                            {
                                columns: [
                                    {
                                        width: 'auto',
                                        stack: [
                                            { text: institution.address, fontSize: 9, color: COLORS.secondary, maxWidth: 220 },
                                            { text: `${institution.phone} • ${institution.email}`, fontSize: 9, color: COLORS.secondary, marginTop: 2 },
                                        ]
                                    }
                                ]
                            },
                            { text: institution.website, fontSize: 9, color: COLORS.primary, marginTop: 2, bold: true }
                        ],
                        margin: [25, 2, 0, 0] // Added left margin to separate from logo
                    },

                    // RIGHT: Document Title (More prominent)
                    {
                        width: 'auto',
                        stack: [
                            { text: docTitle.toUpperCase(), fontSize: 16, bold: true, alignment: 'right', color: COLORS.dark, characterSpacing: 1.2 },
                            { text: docSubTitle, fontSize: 10, alignment: 'right', color: COLORS.secondary, margin: [0, 2, 0, 0] },
                            {
                                canvas: [
                                    { type: 'rect', x: 0, y: 5, w: 120, h: 2, color: COLORS.primary, r: 1 }
                                ],
                                alignment: 'right',
                                marginTop: 4
                            }
                        ],
                        margin: [0, 0, 0, 0]
                    }
                ]
            },
            // Divider Line (Subtle but clear)
            {
                canvas: [{ type: 'line', x1: 0, y1: 15, x2: 535, y2: 15, lineWidth: 0.5, lineColor: COLORS.border }]
            },
            { text: '', margin: [0, 10] }
        ],
        margin: [30, 10, 30, 0]
    };
};

const getFooter = (currentPage: number, pageCount: number, institution: InstitutionProfile) => {
    return {
        stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: COLORS.border }] },
            // Professional Note / Slogan
            {
                text: '“Sağlıklı Çalışan, Güvenli İşyeri, Sürdürülebilir Gelecek İçin Çözüm Ortağınız”',
                alignment: 'center',
                fontSize: 9,
                italics: true,
                color: COLORS.primary,
                margin: [0, 6, 0, 2]
            },
            {
                columns: [
                    {
                        text: [
                            { text: institution.name || 'HanTech Sağlık', bold: true },
                            ` • ${institution.phone || ''}`
                        ],
                        fontSize: 8,
                        color: COLORS.secondary,
                        margin: [0, 2, 0, 0]
                    },
                    {
                        text: `Sayfa ${currentPage} / ${pageCount}`,
                        alignment: 'right',
                        fontSize: 8,
                        color: COLORS.secondary,
                        margin: [0, 2, 0, 0]
                    }
                ]
            }
        ],
        margin: [30, 0, 30, 0]
    };
};

// --- DOC DEFINITION BUILDERS ---

export const getProposalDocDefinition = (proposal: Proposal, company: Company, allTests: HealthTest[], institution: InstitutionProfile) => {
    const currencySymbol = '₺';

    const itemsWithDetails = proposal.items.map(item => {
        const test = allTests.find(t => t.id === item.testId);
        return {
            ...item,
            name: item.customName || test?.name || 'Özel Hizmet'
        };
    });

    const subTotal = itemsWithDetails.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalDiscount = itemsWithDetails.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) - item.totalPrice), 0);
    const taxRate = proposal.taxRate || 20;
    const taxBase = subTotal - totalDiscount;
    const taxAmount = taxBase * (taxRate / 100);
    const grandTotal = taxBase + taxAmount;

    const totalCost = itemsWithDetails.reduce((sum, item) => sum + ((item.unitCost || 0) * item.quantity), 0);
    const estimatedProfit = taxBase - totalCost;
    const profitMargin = taxBase > 0 ? Math.round((estimatedProfit / taxBase) * 100) : 0;

    const introText = proposal.notes || 'Talebiniz üzerine hazırlanan hizmet teklifimiz ve detayları aşağıda bilgilerinize sunulmuştur.';

    const formatCurrency = (val: number) => {
        return (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return {
        pageSize: 'A4',
        // Margins kept tight but content font increased
        pageMargins: [30, 15, 30, 25],
        background: getPageBackground(),

        content: [
            getHeader(institution, 'HİZMET TEKLİFİ', `#${proposal.id} | ${new Date(proposal.date).toLocaleDateString('tr-TR')}`),

            // APPLE CARD DESIGN FOR CLIENT INFO
            {
                table: {
                    widths: ['*'],
                    body: [[
                        {
                            columns: [
                                {
                                    width: '60%',
                                    stack: [
                                        { text: 'SAYIN MÜŞTERİ', fontSize: 8, bold: true, color: COLORS.secondary, marginBottom: 1 },
                                        { text: company.name, fontSize: 11, bold: true, color: COLORS.dark, marginBottom: 1 },
                                        { text: `Yetkili: ${company.authorizedPerson}`, fontSize: 9, color: COLORS.text },
                                        { text: company.address, fontSize: 9, color: COLORS.secondary, margin: [0, 1, 0, 0] },
                                        { text: `V.D. ${company.taxInfo}`, fontSize: 8, color: COLORS.secondary, italics: true, margin: [0, 1, 0, 0] }
                                    ]
                                },
                                {
                                    width: '40%',
                                    stack: [
                                        { text: 'TEKLİF DETAYLARI', fontSize: 8, bold: true, color: COLORS.secondary, alignment: 'right', marginBottom: 1 },
                                        {
                                            table: {
                                                widths: ['*', 'auto'],
                                                body: [
                                                    [{ text: 'Teklif Tarihi', style: 'kvLabel' }, { text: new Date(proposal.date).toLocaleDateString('tr-TR'), style: 'kvValue' }],
                                                    [{ text: 'Geçerlilik', style: 'kvLabel' }, { text: proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('tr-TR') : '30 Gün', style: 'kvValue' }],
                                                    [{ text: 'Teklif No', style: 'kvLabel' }, { text: proposal.id, style: 'kvValue' }]
                                                ]
                                            },
                                            layout: 'noBorders',
                                            alignment: 'right'
                                        }
                                    ]
                                }
                            ],
                            margin: [8, 8]
                        }
                    ]]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    fillColor: () => COLORS.lightBg,
                },
                margin: [0, 0, 0, 10]
            },

            // Intro
            { text: introText, style: 'textBody', margin: [0, 0, 0, 8] },

            // Items Table
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                        [
                            { text: 'HİZMET ADI', style: 'th', alignment: 'left' },
                            { text: 'MİKTAR', style: 'th', alignment: 'center' },
                            { text: 'BİRİM FİYAT', style: 'th', alignment: 'right' },
                            { text: 'İNDİRİM', style: 'th', alignment: 'right' },
                            { text: 'TOPLAM', style: 'th', alignment: 'right' }
                        ],
                        ...itemsWithDetails.map((item) => [
                            { text: item.customName || item.name, style: 'td', alignment: 'left', bold: true },
                            { text: item.quantity.toString(), style: 'td', alignment: 'center' },
                            { text: formatCurrency(item.unitPrice), style: 'td', alignment: 'right' },
                            { text: `%${item.discount || 0}`, style: 'td', alignment: 'right' },
                            { text: `${formatCurrency(item.totalPrice)} ${currencySymbol}`, style: 'tdBold', alignment: 'right' }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i: number) => i === 0 || i === 1 ? COLORS.primary : COLORS.border,
                    paddingLeft: () => 4,
                    paddingRight: () => 4,
                    paddingTop: () => 3,
                    paddingBottom: () => 3,
                    fillColor: (i: number) => i === 0 ? '#F1F5F9' : null
                }
            },

            // Financial Summary & Terms Combined
            {
                columns: [
                    // LEFT SIDE: Terms
                    {
                        width: '*',
                        stack: [
                            { text: 'HÜKÜM VE KOŞULLAR', style: 'label', margin: [0, 10, 0, 2] },
                            {
                                ul: proposal.terms && proposal.terms.length > 0 ? proposal.terms : [
                                    'Fiyatlara KDV dahil değildir.',
                                    'Ödeme, hizmet bitiminde 15 gün içinde yapılmalıdır.',
                                    'Randevu iptalleri en geç 24 saat önceden bildirilmelidir.',
                                    'Bu belge elektronik ortamda oluşturulmuştur.'
                                ],
                                style: 'textSmall',
                                color: COLORS.secondary
                            }
                        ]
                    },

                    // RIGHT SIDE: Totals
                    {
                        width: 180,
                        margin: [0, 10, 0, 0],
                        stack: [
                            {
                                    table: {
                                        widths: ['*', 'auto'],
                                        body: [
                                            [{ text: 'Ara Toplam', style: 'kvLabel' }, { text: `${formatCurrency(subTotal)} ${currencySymbol}`, style: 'kvValue', alignment: 'right' }],
                                            totalDiscount > 0 ? [{ text: 'Toplam İndirim', style: 'kvLabel' }, { text: `-${formatCurrency(totalDiscount)} ${currencySymbol}`, style: 'kvValue', alignment: 'right', color: '#DC2626' }] : null,
                                            [{ text: 'KDV Matrahı', style: 'kvLabel' }, { text: `${formatCurrency(taxBase)} ${currencySymbol}`, style: 'kvValue', alignment: 'right' }],
                                            [{ text: `KDV (%${taxRate})`, style: 'kvLabel' }, { text: `${formatCurrency(taxAmount)} ${currencySymbol}`, style: 'kvValue', alignment: 'right' }],
                                        ].filter(Boolean) as any
                                    },
                                layout: 'noBorders'
                            },
                            { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 180, y2: 4, lineWidth: 0.5, lineColor: COLORS.border }] },
                            {
                                columns: [
                                    { text: 'GENEL TOPLAM', bold: true, fontSize: 10, color: COLORS.dark, margin: [0, 6, 0, 0] },
                                    { text: `${formatCurrency(grandTotal)} ${currencySymbol}`, bold: true, fontSize: 12, color: COLORS.primary, alignment: 'right', margin: [0, 4, 0, 0] }
                                ]
                            }
                        ]
                    }
                ]
            },

            // Signatures
            {
                columns: [
                    {
                        stack: [
                            { text: 'MÜŞTERİ ONAYI', style: 'label', alignment: 'center' },
                            { text: '\n................................................', alignment: 'center', color: COLORS.border },
                            { text: 'Kaşe / İmza', style: 'textSmall', alignment: 'center', color: COLORS.secondary }
                        ]
                    },
                    {
                        stack: [
                            { text: (institution.name || 'KURUM ADI').toUpperCase(), style: 'label', alignment: 'center' },
                            { text: '\n................................................', alignment: 'center', color: COLORS.border },
                            { text: 'Yetkili İmza', style: 'textSmall', alignment: 'center', color: COLORS.secondary }
                        ]
                    }
                ],
                margin: [0, 50, 0, 0]
            }
        ],
        footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount, institution),
        styles: {
            label: { fontSize: 9, bold: true, color: COLORS.secondary, marginBottom: 1, characterSpacing: 0.5 },
            value: { fontSize: 10, color: COLORS.dark, marginBottom: 1 },
            valueBig: { fontSize: 11, bold: true, color: COLORS.dark, marginBottom: 1 },
            textBody: { fontSize: 10, color: COLORS.text, lineHeight: 1.2 },
            textMuted: { fontSize: 9, color: COLORS.secondary, lineHeight: 1.1 },
            textSmall: { fontSize: 8, color: COLORS.secondary },
            th: { fontSize: 9, bold: true, color: COLORS.primary },
            td: { fontSize: 10, color: COLORS.text },
            tdBold: { fontSize: 10, bold: true, color: COLORS.dark },
            tdSmall: { fontSize: 9, color: COLORS.secondary },
            kvLabel: { fontSize: 9, color: COLORS.secondary, margin: [0, 1], alignment: 'right' },
            kvValue: { fontSize: 9, color: COLORS.dark, bold: true, margin: [0, 1], alignment: 'right' }
        },
        defaultStyle: { font: 'Roboto' }
    };
};

// --- NEW FUNCTION: Premium Plan PDF ---
export const generateScreeningPlanPDF = (
    appointment: Appointment,
    company: Company,
    assignedStaff: Staff[],
    plannedTests: HealthTest[],
    institution: InstitutionProfile
) => {
    if (!window.pdfMake) {
        alert("PDF kütüphanesi yüklenemedi.");
        return;
    }

    const dateStr = new Date(appointment.date).toLocaleDateString('tr-TR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const timeStr = new Date(appointment.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 20, 30, 30],

        content: [
            getHeader(institution, 'PLANLAMA ONAYI', 'SAĞLIK TARAMASI ORGANİZASYONU'),

            // BIG TITLE CARD
            {
                stack: [
                    { text: 'SAĞLIK TARAMASI PLANI', fontSize: 18, bold: true, color: 'white', alignment: 'center', margin: [0, 5, 0, 2] },
                    { text: `${company.name} - ${dateStr}`, fontSize: 10, color: 'white', alignment: 'center', opacity: 0.9 }
                ],
                fillColor: COLORS.primary,
                margin: [0, 10, 0, 20],
                padding: [10, 15]
            },

            // TWO COLUMN LAYOUT: Logistics & Contact
            {
                columns: [
                    {
                        stack: [
                            { text: 'OPERASYON DETAYLARI', style: 'sectionHeader' },
                            {
                                table: {
                                    widths: ['auto', '*'],
                                    body: [
                                        [{ text: 'Tarih', style: 'kvLabel' }, { text: dateStr, style: 'kvValue' }],
                                        [{ text: 'Saat', style: 'kvLabel' }, { text: timeStr, style: 'kvValue' }],
                                        [{ text: 'Konum', style: 'kvLabel' }, { text: company.address, style: 'kvValue' }],
                                        [{ text: 'Tür', style: 'kvLabel' }, { text: appointment.type === 'Screening' ? 'Mobil Tarama Aracı' : 'Yerinde Poliklinik', style: 'kvValue' }]
                                    ]
                                },
                                layout: 'noBorders'
                            }
                        ],
                        margin: [0, 0, 10, 0]
                    },
                    {
                        stack: [
                            { text: 'İLETİŞİM BİLGİLERİ', style: 'sectionHeader' },
                            {
                                table: {
                                    widths: ['auto', '*'],
                                    body: [
                                        [{ text: 'Firma Yetkilisi', style: 'kvLabel' }, { text: company.authorizedPerson, style: 'kvValue' }],
                                        [{ text: 'Telefon', style: 'kvLabel' }, { text: company.phone, style: 'kvValue' }],
                                        [{ text: 'E-Posta', style: 'kvLabel' }, { text: company.email, style: 'kvValue' }]
                                    ]
                                },
                                layout: 'noBorders'
                            }
                        ],
                        margin: [10, 0, 0, 0]
                    }
                ],
                margin: [0, 0, 0, 20]
            },

            // SCOPE OF WORK
            { text: 'TARAMA KAPSAMI VE HİZMETLER', style: 'sectionHeader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        [
                            { text: 'HİZMET ADI', style: 'th', fillColor: COLORS.lightBg },
                            { text: 'KATEGORİ', style: 'th', fillColor: COLORS.lightBg, alignment: 'right' }
                        ],
                        ...plannedTests.map(t => [
                            { text: t.name, style: 'td', margin: [0, 3] },
                            { text: t.category, style: 'tdSmall', alignment: 'right', margin: [0, 3] }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: (i: number) => i === 0 || i === 1 ? 1 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i: number) => i === 0 || i === 1 ? COLORS.primary : COLORS.border,
                    paddingTop: () => 5,
                    paddingBottom: () => 5
                },
                margin: [0, 0, 0, 20]
            },

            // TEAM
            { text: 'GÖREVLİ SAĞLIK EKİBİ', style: 'sectionHeader' },
            {
                columns: assignedStaff.map(staff => ({
                    stack: [
                        { text: staff.name, bold: true, fontSize: 10, color: COLORS.dark },
                        { text: staff.title, fontSize: 9, color: COLORS.secondary }
                    ],
                    width: '33%',
                    margin: [0, 5]
                }))
            },

            // FOOTER NOTE
            {
                text: 'Not: Lütfen tarama saatinden 15 dakika önce personellerinizin hazır bulunmasını sağlayınız.',
                style: 'textSmall',
                italics: true,
                color: COLORS.warning,
                margin: [0, 40, 0, 0],
                alignment: 'center'
            }
        ],
        footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount, institution),
        styles: {
            sectionHeader: { fontSize: 11, bold: true, color: COLORS.primary, marginBottom: 8, characterSpacing: 0.5 },
            kvLabel: { fontSize: 9, color: COLORS.secondary, margin: [0, 2], bold: true },
            kvValue: { fontSize: 9, color: COLORS.dark, margin: [0, 2] },
            th: { fontSize: 9, bold: true, color: COLORS.dark },
            td: { fontSize: 10, color: COLORS.text },
            tdSmall: { fontSize: 9, color: COLORS.secondary },
            textSmall: { fontSize: 8, color: COLORS.secondary }
        },
        defaultStyle: { font: 'Roboto' }
    };

    window.pdfMake.createPdf(docDefinition).open();
};

export const generateProposalPDF = (proposal: Proposal, company: Company, allTests: HealthTest[], institution: InstitutionProfile) => {
    if (!window.pdfMake) {
        alert("PDF kütüphanesi yüklenemedi.");
        return;
    }
    const docDefinition = getProposalDocDefinition(proposal, company, allTests, institution);
    window.pdfMake.createPdf(docDefinition).open();
};

export const generateAppointmentPDF = (
    appointment: Appointment,
    company: Company,
    assignedStaff: Staff[],
    plannedTests: HealthTest[],
    institution: InstitutionProfile
) => {
    if (!window.pdfMake) {
        alert("PDF kütüphanesi yüklenemedi.");
        return;
    }

    const dateStr = new Date(appointment.date).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 15, 30, 25],

        header: () => null,
        footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount, institution),

        content: [
            getHeader(institution, 'GÖREV EMRİ', 'OPERASYONEL SAHA FORMU'),

            // Meta Data Grid (Apple Card Style)
            {
                table: {
                    widths: ['*'],
                    body: [[
                        {
                            columns: [
                                {
                                    width: '60%',
                                    stack: [
                                        { text: 'MÜŞTERİ BİLGİLERİ', fontSize: 8, bold: true, color: COLORS.secondary, marginBottom: 1 },
                                        { text: company.name, fontSize: 11, bold: true, color: COLORS.dark, marginBottom: 1 },
                                        { text: company.address, fontSize: 9, color: COLORS.secondary },
                                        { text: `Yetkili: ${company.authorizedPerson} • Tel: ${company.phone}`, fontSize: 9, color: COLORS.text, marginTop: 1 }
                                    ]
                                },
                                {
                                    width: '40%',
                                    stack: [
                                        { text: 'OPERASYON DETAYI', fontSize: 8, bold: true, color: COLORS.secondary, alignment: 'right', marginBottom: 1 },
                                        {
                                            table: {
                                                widths: ['*', 'auto'],
                                                body: [
                                                    [{ text: 'Tarih', style: 'kvLabel' }, { text: dateStr, style: 'kvValue' }],
                                                    [{ text: 'Görev No', style: 'kvLabel' }, { text: `#${appointment.id}`, style: 'kvValue' }],
                                                    [{ text: 'Tür', style: 'kvLabel' }, { text: appointment.type === 'Screening' ? 'Mobil Tarama' : 'Yerinde Hizmet', style: 'kvValue' }]
                                                ]
                                            },
                                            layout: 'noBorders',
                                            alignment: 'right'
                                        }
                                    ]
                                }
                            ],
                            margin: [8, 8]
                        }
                    ]]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    fillColor: () => COLORS.lightBg,
                },
                margin: [0, 0, 0, 10]
            },

            // Staff Table
            { text: 'GÖREVLİ SAHA EKİBİ', style: 'sectionHeader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto'],
                    body: [
                        [
                            { text: '#', style: 'th', alignment: 'center' },
                            { text: 'PERSONEL ADI', style: 'th' },
                            { text: 'ÜNVAN / GÖREV', style: 'th' },
                            { text: 'İMZA', style: 'th', alignment: 'center' }
                        ],
                        ...assignedStaff.map((staff, idx) => [
                            { text: (idx + 1).toString(), style: 'td', alignment: 'center' },
                            { text: staff.name, style: 'td', bold: true },
                            { text: staff.title, style: 'tdSmall' },
                            { text: '', style: 'td' }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: (i: number) => 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i: number) => i === 0 || i === 1 ? COLORS.warning : COLORS.border,
                    paddingTop: () => 4,
                    paddingBottom: () => 4,
                    fillColor: (i: number) => i === 0 ? '#FFFBEB' : null
                },
                margin: [0, 0, 0, 10]
            },

            // Tests / Checklist
            { text: 'YAPILACAK İŞLEMLER LİSTESİ', style: 'sectionHeader' },
            plannedTests.length > 0 ? {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto'],
                    body: [
                        [
                            { text: '#', style: 'th', alignment: 'center' },
                            { text: 'HİZMET / TEST ADI', style: 'th' },
                            { text: 'KATEGORİ', style: 'th' },
                            { text: 'KONTROL', style: 'th', alignment: 'center' }
                        ],
                        ...plannedTests.map((test, idx) => [
                            { text: (idx + 1).toString(), style: 'td', alignment: 'center' },
                            { text: test.name, style: 'td' },
                            { text: test.category, style: 'tdSmall' },
                            { text: '[   ] Tamamlandı', style: 'tdSmall', alignment: 'center', color: COLORS.secondary }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: (i: number) => 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i: number) => i === 0 || i === 1 ? COLORS.primary : COLORS.border,
                    paddingTop: () => 3,
                    paddingBottom: () => 3
                }
            } : { text: '* Özel test tanımlanmamıştır.', italics: true, fontSize: 9, color: COLORS.secondary, margin: [0, 0, 0, 5] },

            { text: '', margin: [0, 8] },

            {
                stack: [
                    { text: 'SAHA NOTLARI', style: 'label' },
                    {
                        table: {
                            widths: ['*'],
                            body: [[{ text: '\n\n', margin: [0, 2] }]]
                        },
                        layout: {
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => COLORS.border,
                            vLineColor: () => COLORS.border
                        }
                    }
                ]
            },

            // Signatures - Moved Down
            {
                columns: [
                    {
                        stack: [
                            { text: 'EKİP LİDERİ', style: 'label', alignment: 'center' },
                            { text: '\n................................................', alignment: 'center', color: COLORS.border },
                        ]
                    },
                    {
                        stack: [
                            { text: 'FİRMA YETKİLİSİ (TESLİM ALAN)', style: 'label', alignment: 'center' },
                            { text: '\n................................................', alignment: 'center', color: COLORS.border },
                        ]
                    }
                ],
                margin: [0, 50, 0, 0]
            }
        ],
        styles: {
            sectionHeader: { fontSize: 10, bold: true, color: COLORS.primary, marginBottom: 3, characterSpacing: 0.5 },
            label: { fontSize: 9, bold: true, color: COLORS.secondary, marginBottom: 1 },
            value: { fontSize: 10, color: COLORS.dark },
            valueBig: { fontSize: 11, bold: true, color: COLORS.dark },
            textMuted: { fontSize: 9, color: COLORS.secondary },
            th: { fontSize: 9, bold: true, color: COLORS.dark },
            td: { fontSize: 10, color: COLORS.text },
            tdSmall: { fontSize: 9, color: COLORS.secondary },
            kvLabel: { fontSize: 9, color: COLORS.secondary, margin: [0, 1], alignment: 'right' },
            kvValue: { fontSize: 9, color: COLORS.dark, bold: true, margin: [0, 1], alignment: 'right' }
        },
        defaultStyle: { font: 'Roboto' }
    };

    window.pdfMake.createPdf(docDefinition).open();
};

export const generateScreeningReportPDF = (
    appointment: Appointment,
    company: Company,
    tests: HealthTest[],
    institution: InstitutionProfile
) => {
    if (!window.pdfMake) {
        alert("PDF kütüphanesi yüklenemedi.");
        return;
    }

    const dateStr = new Date(appointment.date).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 15, 30, 25],

        footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount, institution),

        content: [
            getHeader(institution, 'SONUÇ RAPORU', 'SAĞLIK TARAMASI VE ANALİZ'),

            // Client Info (Apple Card Style)
            {
                table: {
                    widths: ['*'],
                    body: [[
                        {
                            columns: [
                                {
                                    width: '*',
                                    stack: [
                                        { text: 'RAPORLANAN FİRMA', fontSize: 8, bold: true, color: COLORS.secondary, marginBottom: 1 },
                                        { text: company.name, fontSize: 11, bold: true, color: COLORS.dark, marginBottom: 1 },
                                        { text: company.address, fontSize: 9, color: COLORS.secondary },
                                    ]
                                },
                                {
                                    width: 'auto',
                                    stack: [
                                        { text: 'RAPOR TARİHİ', fontSize: 8, bold: true, color: COLORS.secondary, alignment: 'right', marginBottom: 1 },
                                        { text: dateStr, fontSize: 10, bold: true, color: COLORS.dark, alignment: 'right' },
                                    ]
                                }
                            ],
                            margin: [8, 8]
                        }
                    ]]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    fillColor: () => COLORS.lightBg,
                },
                margin: [0, 0, 0, 10]
            },

            {
                stack: [
                    { text: `Sayın ${company.name} Yetkilisi,`, fontSize: 11, bold: true, margin: [0, 0, 0, 4] },
                    {
                        text: [
                            'Kurumunuz bünyesinde ', { text: dateStr, bold: true }, ' tarihinde gerçekleştirilen sağlık taraması işlemleri başarıyla tamamlanmıştır. ',
                            'Yapılan tıbbi tetkikler ve muayeneler sonucunda elde edilen genel veriler aşağıda özetlenmiştir.'
                        ],
                        fontSize: 10,
                        color: COLORS.text,
                        lineHeight: 1.3,
                        alignment: 'justify'
                    }
                ],
                margin: [0, 0, 0, 10]
            },

            { text: 'TARAMA KAPSAMI', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto'],
                    body: tests.map(t => [
                        { text: t.name, style: 'td', margin: [0, 2] },
                        { text: t.category, style: 'tdSmall', alignment: 'right', margin: [0, 2] }
                    ])
                },
                layout: {
                    hLineWidth: (i: number, node: any) => i === 0 || i === node.table.body.length ? 0.5 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: () => COLORS.border,
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 3,
                    paddingBottom: () => 3
                },
                margin: [0, 0, 0, 10]
            },

            {
                stack: [
                    { text: 'GENEL DEĞERLENDİRME & HEKİM GÖRÜŞÜ', style: 'sectionHeader' },
                    {
                        stack: [
                            {
                                text: 'Yapılan tetkikler sonucunda işyerinizde meslek hastalığı şüphesi uyandıran yoğun bir bulguya rastlanmamıştır. Ancak, işitme testlerinde (Odyometri) gürültülü alanlarda çalışan 3 personelde hafif dereceli işitme kaybı gözlemlenmiş olup, KBB uzmanına sevkleri yapılmıştır.',
                                fontSize: 10,
                                color: COLORS.text,
                                lineHeight: 1.4,
                                background: COLORS.lightBg,
                                margin: [0, 2, 0, 5]
                            },
                            {
                                text: 'ÖNERİLER:',
                                bold: true,
                                fontSize: 10,
                                color: COLORS.primary,
                                margin: [0, 2, 0, 2]
                            },
                            {
                                ul: [
                                    'Gürültülü alanlarda kulak koruyucu kullanımının denetlenmesi.',
                                    'Tozlu ortamlarda çalışanların maske kullanım sıklığının artırılması.',
                                    '6 ay sonra periyodik kontrol muayenelerinin tekrarlanması.'
                                ],
                                fontSize: 10,
                                color: COLORS.text,
                                lineHeight: 1.2,
                                markerColor: COLORS.primary
                            }
                        ],
                        margin: [0, 0, 0, 15]
                    }
                ]
            },

            // Approval Box - Moved Down
            {
                table: {
                    widths: ['50%', '50%'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'ONAYLAYAN HEKİM', style: 'label', alignment: 'center' },
                                    { text: 'Uzm. Dr. Selin Kaya', bold: true, fontSize: 10, alignment: 'center', margin: [0, 6, 0, 0] },
                                    { text: 'İşyeri Hekimi / Dip. No: 12345', fontSize: 9, color: COLORS.secondary, alignment: 'center' }
                                ],
                                margin: [5, 8]
                            },
                            {
                                stack: [
                                    { text: 'TESLİM ALAN', style: 'label', alignment: 'center' },
                                    { text: company.authorizedPerson, bold: true, fontSize: 10, alignment: 'center', margin: [0, 6, 0, 0] },
                                    { text: 'Firma Yetkilisi', fontSize: 9, color: COLORS.secondary, alignment: 'center' }
                                ],
                                margin: [5, 8]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: (i) => i === 1 ? 0.5 : 0,
                    hLineColor: () => COLORS.border,
                    vLineColor: () => COLORS.border
                },
                margin: [0, 50, 0, 0] // Increased to 50
            }
        ],
        styles: {
            sectionHeader: { fontSize: 10, bold: true, color: COLORS.primary, marginBottom: 4, decoration: 'underline', decorationColor: COLORS.border, decorationStyle: 'dotted' },
            label: { fontSize: 9, bold: true, color: COLORS.secondary, marginBottom: 1 },
            td: { fontSize: 10, color: COLORS.text },
            tdSmall: { fontSize: 9, color: COLORS.secondary },
            kvLabel: { fontSize: 9, color: COLORS.secondary, margin: [0, 1], alignment: 'right' },
            kvValue: { fontSize: 9, color: COLORS.dark, bold: true, margin: [0, 1], alignment: 'right' }
        },
        defaultStyle: { font: 'Roboto' }
    };

    window.pdfMake.createPdf(docDefinition).open();
};

export const generateStaffFinancePDF = (
    staff: Staff,
    earnings: any,
    selectedMonth: string,
    selectedYear: number,
    institution: InstitutionProfile
) => {
    if (!window.pdfMake) {
        alert("PDF kütüphanesi yüklenemedi.");
        return;
    }

    const currencySymbol = '₺';
    const formatCurrency = (val: number) => {
        return (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 15, 30, 25],
        content: [
            getHeader(institution, 'PERSONEL HAKEDİŞ RAPORU', `${selectedMonth} ${selectedYear}`),

            // Personnel Info Card
            {
                table: {
                    widths: ['*'],
                    body: [[
                        {
                            columns: [
                                {
                                    width: '60%',
                                    stack: [
                                        { text: 'PERSONEL BİLGİLERİ', fontSize: 8, bold: true, color: COLORS.secondary, marginBottom: 1 },
                                        { text: staff.name, fontSize: 11, bold: true, color: COLORS.dark, marginBottom: 1 },
                                        { text: `Ünvan: ${staff.title}`, fontSize: 9, color: COLORS.text },
                                        { text: `Telefon: ${staff.phone}`, fontSize: 9, color: COLORS.secondary, margin: [0, 1, 0, 0] }
                                    ]
                                },
                                {
                                    width: '40%',
                                    stack: [
                                        { text: 'ÖDEME ÖZETİ', fontSize: 8, bold: true, color: COLORS.secondary, alignment: 'right', marginBottom: 1 },
                                        {
                                            table: {
                                                widths: ['*', 'auto'],
                                                body: [
                                                    [{ text: 'Dönem', style: 'kvLabel' }, { text: `${selectedMonth} ${selectedYear}`, style: 'kvValue' }],
                                                    [{ text: 'Toplam Çalışma', style: 'kvLabel' }, { text: `${earnings.workHours.toFixed(1)} Saat`, style: 'kvValue' }],
                                                    [{ text: 'Operasyon', style: 'kvLabel' }, { text: earnings.appointmentCount, style: 'kvValue' }]
                                                ]
                                            },
                                            layout: 'noBorders',
                                            alignment: 'right'
                                        }
                                    ]
                                }
                            ],
                            margin: [8, 8]
                        }
                    ]]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    fillColor: () => COLORS.lightBg,
                },
                margin: [0, 0, 0, 15]
            },

            // Financial Breakdown Table
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        [
                            { text: 'AÇIKLAMA', style: 'th', alignment: 'left' },
                            { text: 'TUTAR', style: 'th', alignment: 'right' }
                        ],
                        [
                            { text: 'SABİT MAAŞ', style: 'td' },
                            { text: `${formatCurrency(staff.baseSalary || 0)} ${currencySymbol}`, style: 'tdBold', alignment: 'right' }
                        ],
                        [
                            { text: `MESAİ HAKEDİŞİ (${earnings.workHours.toFixed(1)} sa x ${staff.hourlyRate || 0} ₺)`, style: 'td' },
                            { text: `${formatCurrency(earnings.variableEarnings)} ${currencySymbol}`, style: 'tdBold', alignment: 'right' }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: (i: number) => i === 0 || i === 1 || i === 3 ? 0.5 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i: number) => i === 0 || i === 1 ? COLORS.primary : COLORS.border,
                    paddingTop: () => 5,
                    paddingBottom: () => 5,
                    fillColor: (i: number) => i === 0 ? '#F1F5F9' : null
                }
            },

            // Grand Total
            {
                columns: [
                    { width: '*', text: '' },
                    {
                        width: 180,
                        margin: [0, 10, 0, 0],
                        stack: [
                            {
                                columns: [
                                    { text: 'GENEL TOPLAM', bold: true, fontSize: 10, color: COLORS.dark, margin: [0, 6, 0, 0] },
                                    { text: `${formatCurrency(earnings.totalEarnings)} ${currencySymbol}`, bold: true, fontSize: 14, color: COLORS.primary, alignment: 'right', margin: [0, 4, 0, 0] }
                                ]
                            },
                            { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 180, y2: 4, lineWidth: 1, lineColor: COLORS.primary }] }
                        ]
                    }
                ]
            },

            // Operations List
            { text: 'OPERASYON DETAYLARI', style: 'sectionHeader', marginTop: 25 },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: [
                        [
                            { text: 'OPERASYON / TARAMA ADI', style: 'th', alignment: 'left' },
                            { text: 'TARİH', style: 'th', alignment: 'center' },
                            { text: 'SÜRE', style: 'th', alignment: 'center' },
                            { text: 'HAKEDİŞ', style: 'th', alignment: 'right' }
                        ],
                        ...earnings.appointments.map((app: any) => [
                            { text: app.title, style: 'td', alignment: 'left' },
                            { text: new Date(app.date).toLocaleDateString('tr-TR'), style: 'td', alignment: 'center' },
                            { text: `${Math.floor(app.durationMinutes / 60)}s ${app.durationMinutes % 60}d`, style: 'td', alignment: 'center' },
                            { text: `${formatCurrency((app.durationMinutes / 60) * (staff.hourlyRate || 0))} ₺`, style: 'tdBold', alignment: 'right' }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: (i: number) => 0.5,
                    vLineWidth: () => 0,
                    hLineColor: () => COLORS.border,
                    paddingTop: () => 4,
                    paddingBottom: () => 4
                }
            },

            // Signatures
            {
                columns: [
                    {
                        stack: [
                            { text: 'PERSONEL İMZA', style: 'label', alignment: 'center' },
                            { text: '\n\n................................................', alignment: 'center', color: COLORS.border }
                        ]
                    },
                    {
                        stack: [
                            { text: 'ONAYLAYAN (Yönetici)', style: 'label', alignment: 'center' },
                            { text: '\n\n................................................', alignment: 'center', color: COLORS.border }
                        ]
                    }
                ],
                margin: [0, 50, 0, 0]
            }
        ],
        footer: (currentPage: number, pageCount: number) => getFooter(currentPage, pageCount, institution),
        styles: {
            sectionHeader: { fontSize: 11, bold: true, color: COLORS.primary, marginBottom: 8, characterSpacing: 0.5 },
            label: { fontSize: 9, bold: true, color: COLORS.secondary, marginBottom: 1 },
            th: { fontSize: 9, bold: true, color: COLORS.dark },
            td: { fontSize: 10, color: COLORS.text },
            tdBold: { fontSize: 10, bold: true, color: COLORS.dark },
            kvLabel: { fontSize: 9, color: COLORS.secondary, margin: [0, 1], alignment: 'right' },
            kvValue: { fontSize: 9, color: COLORS.dark, bold: true, margin: [0, 1], alignment: 'right' }
        },
        defaultStyle: { font: 'Roboto' }
    };

    window.pdfMake.createPdf(docDefinition).open();
};
