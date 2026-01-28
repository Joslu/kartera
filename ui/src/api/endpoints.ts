import { api } from "./client";
import type { Category, CategoryGroup, Income, MonthSummary, Transaction } from "./types";

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
      "categoryId" | "note" | "isReconciled" | "date" | "amount" | "description" | "paymentMethod"
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
        category?: { name: string; group?: { name: string } | null } | null;
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
}) {
  return api<{ id: string }>(`/incomes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchIncome(
  id: string,
  body: Partial<Pick<Income, "date" | "amount">>,
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
  paymentMethod: string; // ajusta a tu enum si lo tipas
  categoryId?: string;
  note?: string;
  isReconciled?: boolean;
}) {
  return api<Transaction>(`/transactions`, {
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
