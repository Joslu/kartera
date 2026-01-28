export type Category = {
  id: string;
  name: string;
  groupName: string;
  kind: "EXPENSE" | "TRACKING";
  groupId?: string;
  sortOrder?: number;
  groupSortOrder?: number;
};

export type CategoryGroup = {
  id: string;
  name: string;
  sortOrder: number;
};


export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

export type Transaction = {
  id: string;
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
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
