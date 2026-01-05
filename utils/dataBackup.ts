import { Company, Staff, HealthTest, Proposal, Appointment, UserAccount, Notification } from '../types';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    companies: Company[];
    staff: Staff[];
    tests: HealthTest[];
    proposals: Proposal[];
    appointments: Appointment[];
    notifications: Notification[];
    accounts: UserAccount[];
  };
}

export const createBackup = (
  companies: Company[],
  staff: Staff[],
  tests: HealthTest[],
  proposals: Proposal[],
  appointments: Appointment[],
  notifications: Notification[],
  accounts: UserAccount[]
): BackupData => {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data: {
      companies,
      staff,
      tests,
      proposals,
      appointments,
      notifications,
      accounts,
    },
  };
};

export const downloadBackup = (backup: BackupData) => {
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hantech-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const restoreBackup = (backupFile: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;
        
        // Validate backup structure
        if (!backup.version || !backup.data) {
          throw new Error('Geçersiz yedek dosyası formatı');
        }
        
        resolve(backup);
      } catch (error) {
        reject(new Error('Yedek dosyası okunamadı: ' + (error as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsText(backupFile);
  });
};

export const validateBackupData = (backup: BackupData): string[] => {
  const errors: string[] = [];
  
  if (!backup.data.companies || !Array.isArray(backup.data.companies)) {
    errors.push('Firma verileri eksik veya hatalı');
  }
  
  if (!backup.data.staff || !Array.isArray(backup.data.staff)) {
    errors.push('Personel verileri eksik veya hatalı');
  }
  
  if (!backup.data.tests || !Array.isArray(backup.data.tests)) {
    errors.push('Test verileri eksik veya hatalı');
  }
  
  if (!backup.data.proposals || !Array.isArray(backup.data.proposals)) {
    errors.push('Teklif verileri eksik veya hatalı');
  }
  
  if (!backup.data.appointments || !Array.isArray(backup.data.appointments)) {
    errors.push('Randevu verileri eksik veya hatalı');
  }
  
  return errors;
};
