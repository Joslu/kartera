export type Category = {
  id: string;
  name: string;
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
