export type Role = "VIEWER" | "ANALYST" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type RecordType = "INCOME" | "EXPENSE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardSummary = {
  totals: {
    income: number;
    expenses: number;
    netBalance: number;
  };
  categoryBreakdown: Array<{
    category: string;
    type: RecordType;
    total: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    type: RecordType;
    total: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    type: RecordType;
    total: number;
  }>;
  recentTransactions: FinancialRecord[];
};

export type FinancialRecord = {
  id: string;
  amount: string | number;
  type: RecordType;
  category: string;
  date: string;
  description?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  timestamp: string;
  path: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
