
import { Company, Staff, HealthTest, Proposal, Appointment, Notification, Equipment, CompanyDocument, Task, Subscription, UserAccount } from './types';

const currentYear = new Date().getFullYear();
const today = new Date();

export const MOCK_COMPANIES: Company[] = [];

export const MOCK_STAFF: Staff[] = [];

export const MOCK_TESTS: HealthTest[] = [];

export const MOCK_PROPOSALS: Proposal[] = [];

export const MOCK_APPOINTMENTS: Appointment[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const MOCK_EQUIPMENT: Equipment[] = [];

export const MOCK_DOCUMENTS: CompanyDocument[] = [];

export const MOCK_TASKS: Task[] = [];

export const MOCK_SUBSCRIPTION: Subscription = {
  plan: 'AI Plus',
  status: 'Active',
  expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
  price: 100,
  currency: 'USD',
  aiTokenLimit: 1000,
  aiTokenUsage: 450
};

export const PLAN_LIMITS = {
  'Trial': { maxUsers: 2 },
  'Standard': { maxUsers: 10 },
  'AI Plus': { maxUsers: 50 }
};

export const MOCK_ACCOUNTS: UserAccount[] = [
  {
    id: '1',
    name: 'Admin Kullanıcı',
    email: 'admin@hantech.com',
    password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    role: 'Admin',
    lastLogin: new Date().toISOString(),
    title: 'Sistem Yöneticisi',
    phone: '+90 555 000 00 00'
  }
];
