import { Company, Staff, HealthTest, Proposal, Appointment } from '../types';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export class DataExporter {
  // CSV Export
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    options: Partial<ExportOptions> = {}
  ): void {
    const { includeHeaders = true, format } = options;

    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      includeHeaders ? headers.join(',') : '',
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].filter(Boolean).join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  // Excel Export (using CSV format that Excel can open)
  static exportToExcel<T extends Record<string, any>>(
    data: T[],
    filename: string,
    options: Partial<ExportOptions> = {}
  ): void {
    // For now, we'll use CSV format with .xlsx extension
    // In a real app, you'd use a library like xlsx
    this.exportToCSV(data, filename, { ...options, format: 'excel' });
    this.downloadFile(
      this.getCSVContent(data, options),
      `${filename}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }

  // PDF Export (placeholder - would need a PDF library)
  static exportToPDF<T extends Record<string, any>>(
    data: T[],
    filename: string,
    options: Partial<ExportOptions> = {}
  ): void {
    // In a real app, you'd use libraries like jsPDF or Puppeteer
    console.log('PDF export would be implemented with a PDF library');
    alert('PDF export özelliği yakında eklenecek!');
  }

  // Export Companies
  static exportCompanies(
    companies: Company[],
    options: Partial<ExportOptions> = {}
  ): void {
    const exportData = companies.map(company => ({
      'Firma Adı': company.name,
      'Yetkili Kişi': company.authorizedPerson,
      'E-posta': company.email,
      'Telefon': company.phone,
      'Adres': company.address,
      'Vergi No': company.taxInfo,
      'Kayıt Tarihi': new Date().toLocaleDateString('tr-TR')
    }));

    this.exportByFormat(exportData, 'firmalar', options);
  }

  // Export Staff
  static exportStaff(
    staff: Staff[],
    options: Partial<ExportOptions> = {}
  ): void {
    const exportData = staff.map(person => ({
      'Ad Soyad': person.name,
      'E-posta': person.email,
      'Telefon': person.phone,
      'ID': person.id,
      'Kayıt Tarihi': new Date().toLocaleDateString('tr-TR')
    }));

    this.exportByFormat(exportData, 'personel', options);
  }

  // Export Health Tests
  static exportTests(
    tests: HealthTest[],
    options: Partial<ExportOptions> = {}
  ): void {
    const exportData = tests.map(test => ({
      'Test ID': test.id,
      'ID': test.id
    }));

    this.exportByFormat(exportData, 'testler', options);
  }

  // Export Proposals
  static exportProposals(
    proposals: Proposal[],
    options: Partial<ExportOptions> = {}
  ): void {
    const exportData = proposals.map(proposal => ({
      'Teklif ID': proposal.id,
      'Firma ID': proposal.companyId,
      'Tarih': new Date(proposal.date).toLocaleDateString('tr-TR'),
      'Durum': proposal.status,
      'Toplam Tutar': `₺${proposal.totalAmount.toLocaleString('tr-TR')}`,
      'Notlar': proposal.notes || ''
    }));

    this.exportByFormat(exportData, 'teklifler', options);
  }

  // Export Appointments
  static exportAppointments(
    appointments: Appointment[],
    options: Partial<ExportOptions> = {}
  ): void {
    const exportData = appointments.map(apt => ({
      'ID': apt.id,
      'Firma ID': apt.companyId,
      'Personel ID': (apt.staffIds && apt.staffIds.length > 0) ? apt.staffIds.join(', ') : '',
      'Tarih': new Date(apt.date).toLocaleDateString('tr-TR'),
      'Tip': apt.type,
      'Durum': apt.status
    }));

    this.exportByFormat(exportData, 'randevular', options);
  }

  // Helper methods
  private static exportByFormat<T extends Record<string, any>>(
    data: T[],
    baseFilename: string,
    options: Partial<ExportOptions>
  ): void {
    const { format = 'csv' } = options;

    switch (format) {
      case 'csv':
        this.exportToCSV(data, baseFilename, options);
        break;
      case 'excel':
        this.exportToExcel(data, baseFilename, options);
        break;
      case 'pdf':
        this.exportToPDF(data, baseFilename, options);
        break;
      default:
        this.exportToCSV(data, baseFilename, options);
    }
  }

  private static getCSVContent<T extends Record<string, any>>(
    data: T[],
    options: Partial<ExportOptions>
  ): string {
    const { includeHeaders = true } = options;

    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [
      includeHeaders ? headers.join(',') : '',
      ...rows
    ].filter(Boolean).join('\n');
  }

  private static downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate summary report
  static generateSummaryReport(
    companies: Company[],
    staff: Staff[],
    tests: HealthTest[],
    proposals: Proposal[]
  ): string {
    const totalCompanies = companies.length;
    const totalStaff = staff.length;
    const totalTests = tests.length;
    const totalProposals = proposals.length;
    const approvedProposals = proposals.filter(p => p.status === 'Approved').length;
    const totalRevenue = proposals
      .filter(p => p.status === 'Approved')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    return `
ÖZET RAPORU
============

Firma Bilgileri:
- Toplam Firma: ${totalCompanies}

Personel Bilgileri:
- Toplam Personel: ${totalStaff}

Test Bilgileri:
- Toplam Test: ${totalTests}

Teklif Bilgileri:
- Toplam Teklif: ${totalProposals}
- Onaylanan Teklif: ${approvedProposals}
- Onay Oranı: ${totalProposals > 0 ? Math.round((approvedProposals / totalProposals) * 100) : 0}%
- Toplam Gelir: ₺${totalRevenue.toLocaleString('tr-TR')}

Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}
    `.trim();
  }
}
