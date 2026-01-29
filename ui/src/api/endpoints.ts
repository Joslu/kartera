import { api } from "./client";
import type {
  Category,
  CategoryGroup,
  CreditCard,
  Income,
  MonthSummary,
  MonthSpendByCard,
  PaymentMethod,
  PaymentMethodType,
  Transaction,
} from "./types";

function asArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.transactions)) return v.transactions;
  return [];
}

// Si tu baseUrl YA incluye /api (ej. VITE_API_BASE_URL=/api o http://localhost:3000/api),
// entonces aquí NO pongas "api/..." otra vez. Usa rutas “reales” del backend.

export async function getCategories() {
  const res = await api<any>("/categories");
  const items = asArray<any>(res);
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    groupName: c.group?.name ?? c.groupName ?? "Sin grupo",
    kind: c.kind ?? "EXPENSE",
    isSystem: c.isSystem ?? false,
    groupId: c.groupId ?? c.group?.id,
    sortOrder: c.sortOrder,
    groupSortOrder: c.group?.sortOrder,
  })) as Category[];
}

export async function getCategoryGroups() {
  const res = await api<any>("/category-groups");
  return asArray<CategoryGroup>(res);
}

export function createCategoryGroup(body: { name: string; sortOrder?: number }) {
  return api<CategoryGroup>(`/category-groups`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteCategoryGroup(id: string) {
  return api<void>(`/category-groups/${id}`, { method: "DELETE" });
}

export function createCategory(body: {
  name: string;
  groupId: string;
  kind: "EXPENSE" | "TRACKING";
  sortOrder?: number;
}) {
  return api<Category>(`/categories`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchCategory(id: string, body: { name: string }) {
  return api<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCategory(id: string) {
  return api<void>(`/categories/${id}`, { method: "DELETE" });
}



export async function getUnidentified(monthId: string) {
  const res = await api<any>(`/months/${monthId}/unidentified`);
  return asArray<Transaction>(res);
}

export function patchTransaction(
  id: string,
  body: Partial<
    Pick<
      Transaction,
      "categoryId" | "note" | "isReconciled" | "date" | "amount" | "description" | "paymentMethodId"
    >
  >
) {
  return api<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getMonthSummary(monthId: string) {
  return api<MonthSummary>(`/months/${monthId}/summary`);
}

export function getMonthSpendByCard(monthId: string) {
  return api<MonthSpendByCard>(`/months/${monthId}/spend-by-card`);
}

export function getMonthAssignments(monthId: string) {
  return api<{
    month: { id: string; year: number; month: number; createdAt: string };
    assignments: Array<{
      id: string;
      monthId: string;
      categoryId: string;
      amount: number;
      category?: { name: string; kind?: string; group?: { name: string } | null } | null;
    }>;
  }>(`/months/${monthId}/assignments`);
}

export function getMonthTransactions(monthId: string) {
  return api<{
    month: { id: string; year: number; month: number; createdAt: string };
    transactions: Array<
      Transaction & {
        category?: { name: string; kind?: string; group?: { name: string } | null } | null;
      }
    >;
  }>(`/months/${monthId}/transactions`);
}

export function getMonthIncomes(monthId: string) {
  return api<{
    month: { id: string; year: number; month: number; createdAt: string };
    incomes: Income[];
  }>(`/months/${monthId}/incomes`);
}

export async function getMonths() {
  const res = await api<any>("/months");
  const months = Array.isArray(res) ? res : res.items ?? res.data ?? [];
  months.sort((a: any, b: any) => (b.year - a.year) || (b.month - a.month));
  return months as Array<{ id: string; year: number; month: number; createdAt: string }>;
}

export function createMonth(body: { year: number; month: number }) {
  return api<{ id: string; year: number; month: number }>(`/months`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteMonth(id: string) {
  return api<void>(`/months/${id}`, { method: "DELETE" });
}


export function createIncome(body: {
  monthId: string;
  date: string; // YYYY-MM-DD
  amount: number; // > 0
  source: string;
  paymentMethodId: string;
  isTransfer?: boolean;
}) {
  return api<{ id: string }>(`/incomes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchIncome(
  id: string,
  body: Partial<Pick<Income, "date" | "amount" | "paymentMethodId">>,
) {
  return api<Income>(`/incomes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}




export function createTransaction(body: {
  monthId: string;
  date: string; // YYYY-MM-DD
  amount: number; // > 0
  description: string;
  paymentMethodId: string;
  categoryId?: string;
  note?: string;
  isReconciled?: boolean;
}) {
  return api<Transaction>(`/transactions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getPaymentMethods() {
  const res = await api<any>("/payment-methods");
  return asArray<PaymentMethod>(res);
}

export function createPaymentMethod(body: {
  name: string;
  type: PaymentMethodType;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return api<PaymentMethod>(`/payment-methods`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchPaymentMethod(
  id: string,
  body: Partial<Pick<PaymentMethod, "name" | "type" | "isActive" | "sortOrder">>,
) {
  return api<PaymentMethod>(`/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deletePaymentMethod(id: string) {
  return api<void>(`/payment-methods/${id}`, { method: "DELETE" });
}

export async function getCreditCards() {
  const res = await api<any>("/credit-cards");
  return asArray<CreditCard>(res);
}

export function createCreditCard(body: {
  paymentMethodId: string;
  cutoffDay: number;
  dueDay?: number | null;
  paymentCategoryId?: string | null;
}) {
  return api<CreditCard>(`/credit-cards`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchCreditCard(
  id: string,
  body: Partial<Pick<CreditCard, "cutoffDay" | "dueDay" | "paymentCategoryId">>,
) {
  return api<CreditCard>(`/credit-cards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCreditCard(id: string) {
  return api<void>(`/credit-cards/${id}`, { method: "DELETE" });
}

export async function getCreditCardSummary(cycle?: "current" | "previous") {
  const qs = cycle ? `?cycle=${cycle}` : "";
  const res = await api<any>(`/credit-cards/summary${qs}`);
  return asArray<
    CreditCard & {
      paymentMethodName: string;
      cycleStart: string;
      cycleEnd: string;
      paymentWindowStart?: string | null;
      paymentWindowEnd?: string | null;
      isInPaymentWindow?: boolean;
      spent: number;
      paid: number;
      debt: number;
    }
  >(res);
}

export async function getPaymentMethodBalances() {
  const res = await api<any>("/payment-methods/balances");
  return asArray<
    PaymentMethod & { income: number; expense: number; balance: number }
  >(res);
}

export async function getCreditCardCycle(cardId: string, cycle?: "current" | "previous") {
  const qs = cycle ? `?cycle=${cycle}` : "";
  return api<{
    card: {
      id: string;
      paymentMethodId: string;
      paymentMethodName: string;
      cutoffDay: number;
      dueDay?: number | null;
      paymentCategoryName?: string | null;
      paymentWindowStart?: string | null;
      paymentWindowEnd?: string | null;
      isInPaymentWindow?: boolean;
    };
    cycleStart: string;
    cycleEnd: string;
    items: Array<{
      id: string;
      date: string;
      amount: number;
      description: string;
      kind: "SPENT" | "PAYMENT";
      categoryName?: string | null;
    }>;
  }>(`/credit-cards/${cardId}/cycle${qs}`);
}

export function createTransfer(body: {
  monthId: string;
  date: string;
  amount: number;
  fromPaymentMethodId: string;
  toPaymentMethodId: string;
  description?: string;
  note?: string;
}) {
  return api<{ expenseTx: Transaction; income: Income }>(`/transfers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteTransaction(id: string) {
  return api<void>(`/transactions/${id}`, { method: "DELETE" });
}

export function deleteIncome(id: string) {
  return api<void>(`/incomes/${id}`, { method: "DELETE" });
}

export function upsertBudgetAssignment(body: {
  monthId: string;
  categoryId: string;
  amount: number; // >= 0
}) {
  return api<{
    id: string;
    monthId: string;
    categoryId: string;
    amount: number;
  }>(`/budget-assignments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
