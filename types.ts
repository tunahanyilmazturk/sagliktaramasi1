
export interface Company {
  id: string;
  name: string;
  taxInfo: string;
  authorizedPerson: string;
  email: string;
  phone: string;
  address: string;
  sector: string;
  status: 'Active' | 'Inactive' | 'Pending';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  role: string;
  phone: string;
  email?: string;
  avatar?: string;
  bloodType?: string;
  startDate?: string;
  skills?: string[];
  status: 'Active' | 'OnLeave' | 'Inactive';
  hourlyRate?: number; // Added for finance/earnings calculation
  baseSalary?: number; // Added for finance
}

export interface HealthTest {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  description?: string;
}

export type ProposalStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected';

export interface ProposalItem {
  testId: string;
  customName?: string;
  unitPrice: number;
  unitCost?: number; // Added for profit analysis
  quantity: number;
  discount: number;
  totalPrice: number;
}

export interface ProposalVersion {
  version: number;
  date: string;
  items: ProposalItem[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
}

export interface Proposal {
  id: string;
  companyId: string;
  date: string;
  validUntil: string;
  status: ProposalStatus;
  items: ProposalItem[];
  totalAmount: number;
  taxRate: number;
  currency: 'TRY' | 'USD' | 'EUR';
  exchangeRate?: number;
  terms?: string[];
  notes?: string;
  versions?: ProposalVersion[];
  currentVersion: number;
}

export interface Appointment {
  id: string;
  companyId: string;
  title: string;
  date: string; // ISO String (Date only or start date-time)
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  durationMinutes?: number; // Calculated duration
  type: 'Screening' | 'Training' | 'Consultation' | 'Vehicle';
  status: 'Planned' | 'Completed' | 'Cancelled';
  staffIds: string[];
  testIds?: string[];
  equipmentIds?: string[]; // Added for equipment tracking
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
}


export interface Subscription {
  plan: 'Trial' | 'Standard' | 'AI Plus';
  status: 'Active' | 'Expired' | 'Pending';
  expiryDate: string; // ISO String
  price: number;
  currency: 'USD' | 'TRY';
  aiTokenLimit?: number;
  aiTokenUsage?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Standard';
  lastLogin?: string;
  phone?: string;
  title?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  title: string;
  avatarInitials: string;
  role?: 'Admin' | 'Manager' | 'Standard'; // Added for account permissions
}

export interface InstitutionProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logoBase64?: string;
  subscription?: Subscription; // Added for SaaS
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  type: 'Medical' | 'Vehicle' | 'IT' | 'Consumable' | 'Other';
  status: 'Active' | 'Maintenance' | 'Broken';
  calibrationDate?: string; // ISO String (Last Maintenance for vehicles)
  assignedStaffId?: string;
  // Vehicle Specific
  currentKm?: number;
  nextInspectionDate?: string; // ISO String
  equipmentIds?: string[]; // IDs of medical equipment inside the vehicle
  isVehicleEquipment?: boolean; // If true, this equipment can be placed inside a vehicle
  // Consumable Specific
  quantity?: number;
  unit?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  amount: number; // Tutar (TL)
  liters: number; // Litre
  odometer: number; // Yakıt alındığındaki KM
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  title: string;
  type: 'Contract' | 'Report' | 'Invoice' | 'Other';
  uploadDate: string;
  size: string;
  fileUrl?: string;
}

export type TaskStatus = 'Todo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string; // ISO String
}

export interface SystemDefinitions {
  testCategories: string[];
  staffRoles: { code: string, label: string }[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
