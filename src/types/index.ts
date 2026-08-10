/** App roles: only Admin and Employee have distinct access. */
export type Role = 'ADMIN' | 'EMPLOYEE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'INVITED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  department: string;
  capacityHours: number; // e.g. 40h / week
  /** Monthly salary (admin). Hourly cost ≈ salary ÷ (capacity × 52/12). */
  monthlySalary?: number;
  costRate?: number; // e.g. 2000 LKR/h (Admin only) — used for project delivery cost
  billableRate?: number; // e.g. 5000 LKR/h (Admin only)
  assignedProjectIds: string[];
  status: UserStatus;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  department?: string;
  capacityHours?: number;
  monthlySalary?: number;
  costRate?: number;
  billableRate?: number;
}

export interface UpdateUserInput {
  name?: string;
  department?: string;
  capacityHours?: number;
  monthlySalary?: number;
  costRate?: number;
  billableRate?: number;
  status?: UserStatus;
}

/** Admin-only snapshot when drafting an invoice from time. */
export interface InvoiceCostSummary {
  billableHours: number;
  totalHours: number;
  laborCost: number;
  expenses: number;
  billableExpenses: number;
  deliveryCost: number;
  clientBillable: number;
  margin: number;
  marginPercent: number;
  currency: string;
  byPerson: {
    userId: string;
    userName: string;
    hours: number;
    billableHours: number;
    costRate: number;
    billableRate: number;
    laborCost: number;
    clientAmount: number;
  }[];
  expenseLines: {
    id: string;
    name: string;
    amount: number;
    billable: boolean;
    date: string;
  }[];
}

export interface Expense {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  currency: string;
  billable: boolean;
  date: string;
  category: string;
  notes?: string;
  invoiceId?: string;
  createdAt?: string;
}

export interface CreateExpenseInput {
  name: string;
  projectId: string;
  amount: number;
  currency?: string;
  billable?: boolean;
  date?: string;
  category?: string;
  notes?: string;
}

export type ProjectType = 'TIME_AND_MATERIALS' | 'FIXED_FEE' | 'NON_BILLABLE';
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type BudgetType = 'TOTAL_HOURS' | 'TOTAL_AMOUNT' | 'HOURS_PER_PERSON' | 'HOURS_PER_TASK';

export interface ProjectBudget {
  type: BudgetType;
  totalHours?: number;
  totalAmount?: number;
  warnThresholds: number[]; // e.g. [70, 80, 90, 100]
}

export interface Project {
  id: string;
  name: string;
  code: string;
  clientId: string;
  clientName: string;
  description?: string;
  startDate: string;
  deadline?: string;
  managerId: string;
  managerName: string;
  teamMemberIds: string[];
  taskIds: string[];
  type: ProjectType;
  budget: ProjectBudget;
  usedHours: number;
  currency: string;
  status: ProjectStatus;
}

export interface Task {
  id: string;
  name: string;
  category: string;
  isBillableDefault: boolean;
  defaultRate?: number;
  /** Auto-selected on new projects when true. */
  isCommon?: boolean;
  isActive?: boolean;
}

export type TimeEntryStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  taskId: string;
  taskName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  workCompleted: string;
  isBillable: boolean;
  status: TimeEntryStatus;
  invoiceId?: string;
  rejectionComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectHoursSummary {
  projectId: string;
  projectName: string;
  hours: number;
}

export interface WeeklySubmission {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  department: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  totalHours: number;
  expectedHours: number;
  billableHours: number;
  nonBillableHours: number;
  projectBreakdown: ProjectHoursSummary[];
  status: TimeEntryStatus;
  rejectionComment?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  taxDetails?: string;
  paymentTerms: string;
  notes?: string;
  activeProjectsCount: number;
  outstandingBalance: number;
  totalBilled: number;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  description: string;
  hoursOrQty: number;
  unitPrice: number;
  amount: number;
  taskId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  poNumber?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  currency: string;
}

export type EstimateStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  issueDate: string;
  expiryDate: string;
  status: EstimateStatus;
  items: InvoiceItem[];
  totalAmount: number;
  currency: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPROVAL' | 'REJECTION' | 'PROJECT_ASSIGNMENT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface ReportFilter {
  startDate: string;
  endDate: string;
  userIds?: string[];
  departmentIds?: string[];
  clientIds?: string[];
  projectIds?: string[];
  taskIds?: string[];
  isBillable?: boolean;
  status?: TimeEntryStatus;
}
