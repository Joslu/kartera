export type Category = {
  id: string;
  name: string;
  groupName: string;
  kind: "EXPENSE" | "TRACKING";
  isSystem?: boolean;
  groupId?: string;
  sortOrder?: number;
  groupSortOrder?: number;
};

export type CategoryGroup = {
  id: string;
  name: string;
  sortOrder: number;
};


export type PaymentMethodType = "CASH" | "DEBIT" | "CREDIT";

export type PaymentMethod = {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  sortOrder: number;
  creditCard?: CreditCard | null;
};

export type CreditCard = {
  id: string;
  paymentMethodId: string;
  cutoffDay: number;
  dueDay?: number | null;
  paymentCategoryId?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentCategory?: { id: string; name: string } | null;
};

export type Transaction = {
  id: string;
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;
  paymentMethodId: string;
  paymentMethod?: PaymentMethod | null;
  categoryId: string | null;
  note?: string | null;
  isReconciled?: boolean;
};

export type Income = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  source?: string | null;
  note?: string | null;
  paymentMethodId?: string | null;
  paymentMethod?: PaymentMethod | null;
  isTransfer?: boolean;
};

export type MonthSummary = {
  month: {
    id: string;
    year: number;
    month: number;
    createdAt: string;
     monthLabel: string;
  };
  totals: {
    income: number;
    assigned: number;
    spentExpense: number;
    spentTracking: number;
  };
  categories: Array<{
    categoryId: string;
    categoryName: string;
    groupName: string;
    kind: "INCOME" | "EXPENSE" | "TRACKING";
    assigned: number;
    spent: number;
    available: number;
  }>;
};

export type MonthSpendByCard = {
  month: {
    id: string;
    year: number;
    month: number;
    createdAt: string;
  };
  totalSpent: number;
  items: Array<{
    paymentMethodId: string;
    paymentMethodName: string;
    spent: number;
    pct: number;
  }>;
};
