import { api } from "./client";
import type { Category, MonthSummary, Transaction } from "./types";

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
  return asArray<Category>(res);
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

export async function getMonths() {
  const res = await api<any>("/months");
  const months = Array.isArray(res) ? res : res.items ?? res.data ?? [];
  months.sort((a: any, b: any) => (b.year - a.year) || (b.month - a.month));
  return months as Array<{ id: string; year: number; month: number; createdAt: string }>;
}