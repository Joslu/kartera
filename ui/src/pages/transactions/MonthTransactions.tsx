import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { Toast } from "../../components/Toast";
import { money, formatDate, formatMonthName } from "../../utils/format";
import {
  getCategories,
  getMonthIncomes,
  getMonthTransactions,
  getMonths,
  getPaymentMethods,
  patchTransaction,
  patchIncome,
  deleteTransaction,
  deleteIncome,
} from "../../api/endpoints";
import { MonthSelect } from "../inbox/MonthSelect";
import type { Category, PaymentMethod } from "../../api/types";
import { getStoredMonthId, setStoredMonthId } from "../../utils/month";

type MonthRow = { id: string; year: number; month: number; createdAt: string };

type TransactionRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  paymentMethodName?: string;
  paymentMethodId?: string | null;
  categoryName?: string;
  groupName?: string;
  categoryId?: string | null;
};

const DEFAULT_MONTH_ID = import.meta.env.VITE_DEFAULT_MONTH_ID as string;

function normalizeDateOnly(value: string) {
  if (!value) return value;
  return value.includes("T") ? value.slice(0, 10) : value;
}

export default function MonthTransactions() {
  const [monthId, setMonthId] = useState<string>(() =>
    getStoredMonthId(DEFAULT_MONTH_ID),
  );
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [monthLabel, setMonthLabel] = useState<string>("");
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilterId, setPaymentFilterId] = useState<string>("ALL");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { date: string; categoryId?: string | null; amount?: string }>
  >({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ms, cats, pms] = await Promise.all([
          getMonths(),
          getCategories(),
          getPaymentMethods(),
        ]);
        ms.sort((a, b) => b.year - a.year || b.month - a.month);
        setMonths(ms);
        setCategories(cats);
        setPaymentMethods(pms);

        if (ms.length > 0 && !ms.some((m) => m.id === monthId)) {
          setMonthId(ms[0].id);
          setStoredMonthId(ms[0].id);
        }
      } catch (e: any) {
        setToast({
          type: "error",
          message: e?.message ?? "No se pudo cargar meses",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!monthId) return;
    setStoredMonthId(monthId);
    (async () => {
      setLoading(true);
      try {
        const [txRes, incRes] = await Promise.all([
          getMonthTransactions(monthId),
          getMonthIncomes(monthId),
        ]);
        const txRows: TransactionRow[] = (txRes.transactions ?? []).map(
          (t) => ({
            id: t.id,
            date: normalizeDateOnly(t.date),
            description: t.description,
            amount: Number(t.amount ?? 0),
            type: "EXPENSE",
            paymentMethodName: t.paymentMethod?.name,
            paymentMethodId: t.paymentMethodId,
            categoryName: t.category?.name ?? "Sin categoría",
            groupName: t.category?.group?.name ?? "—",
            categoryId: t.categoryId,
          }),
        );
        const incRows: TransactionRow[] = (incRes.incomes ?? []).map((i) => ({
          id: i.id,
          date: normalizeDateOnly(i.date),
          description: i.source?.trim() || "Ingreso",
          amount: Number(i.amount ?? 0),
          type: "INCOME",
          paymentMethodName: i.paymentMethod?.name ?? "—",
          paymentMethodId: i.paymentMethodId ?? null,
          categoryName: "Ingreso",
          groupName: "—",
          categoryId: null,
        }));
        const merged = [...txRows, ...incRows].sort((a, b) => {
          const ad = new Date(a.date).getTime();
          const bd = new Date(b.date).getTime();
          return ad - bd;
        });
        setRows(merged);
        const month = txRes.month ?? incRes.month;
        setMonthLabel(formatMonthName(month.year, month.month));
      } catch (e: any) {
        setToast({
          type: "error",
          message: e?.message ?? "No se pudo cargar transacciones",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [monthId]);

  const groupedCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    for (const c of categories) {
      const group = c.groupName || "Sin grupo";
      if (!groups[group]) groups[group] = [];
      groups[group].push(c);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [categories]);

  const filteredRows = useMemo(() => {
    if (paymentFilterId === "ALL") return rows;
    return rows.filter(
      (r) => r.type === "EXPENSE" && r.paymentMethodId === paymentFilterId,
    );
  }, [rows, paymentFilterId]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, t) => {
        if (t.type === "INCOME") acc.income += Number(t.amount ?? 0);
        else acc.expense += Number(t.amount ?? 0);
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [filteredRows]);

  function rowKey(row: TransactionRow) {
    return `${row.type}:${row.id}`;
  }

  function startEdit(row: TransactionRow) {
    const key = rowKey(row);
    setEditingKey(key);
    setDrafts((current) => ({
      ...current,
      [key]: {
        date: row.date,
        categoryId: row.categoryId ?? "",
        amount: row.type === "INCOME" ? String(row.amount) : undefined,
      },
    }));
  }

  function cancelEdit(row: TransactionRow) {
    const key = rowKey(row);
    setEditingKey(null);
    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateDraft(row: TransactionRow, patch: { date?: string; categoryId?: string; amount?: string }) {
    const key = rowKey(row);
    setDrafts((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { date: row.date }), ...patch },
    }));
  }

  async function saveEdit(row: TransactionRow) {
    const key = rowKey(row);
    const draft = drafts[key];
    if (!draft) return;
    const date = draft.date ?? row.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setToast({ type: "error", message: "Fecha inválida" });
      return;
    }

    setSavingKey(key);
    const prev = rows;

    if (row.type === "EXPENSE") {
      const categoryId = draft.categoryId || row.categoryId || undefined;
      const selected = categories.find((c) => c.id === categoryId);
      setRows((current) =>
        current.map((r) =>
          r.id === row.id && r.type === row.type
            ? {
                ...r,
                date,
                categoryId: categoryId ?? r.categoryId,
                categoryName: selected?.name ?? r.categoryName,
                groupName: selected?.groupName ?? r.groupName,
              }
            : r,
        ),
      );
      try {
        await patchTransaction(row.id, { date, categoryId });
        setToast({ type: "success", message: "Transacción actualizada" });
        setEditingKey(null);
      } catch (e: any) {
        setRows(prev);
        setToast({
          type: "error",
          message: e?.message ?? "No se pudo actualizar",
        });
      } finally {
        setSavingKey(null);
      }
      return;
    }

    const amountNumber = Number(draft.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setToast({ type: "error", message: "Monto inválido (> 0)" });
      setSavingKey(null);
      return;
    }

    setRows((current) =>
      current.map((r) =>
        r.id === row.id && r.type === row.type
          ? { ...r, date, amount: amountNumber }
          : r,
      ),
    );
    try {
      await patchIncome(row.id, { date, amount: amountNumber });
      setToast({ type: "success", message: "Ingreso actualizado" });
      setEditingKey(null);
    } catch (e: any) {
      setRows(prev);
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo actualizar",
      });
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDelete(row: TransactionRow) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const key = rowKey(row);
    setSavingKey(key);
    const prev = rows;
    setRows((current) =>
      current.filter((r) => !(r.id === row.id && r.type === row.type)),
    );
    try {
      if (row.type === "EXPENSE") {
        await deleteTransaction(row.id);
      } else {
        await deleteIncome(row.id);
      }
      setToast({ type: "success", message: "Movimiento eliminado" });
    } catch (e: any) {
      setRows(prev);
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo eliminar",
      });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Transacciones del mes
            </h1>
            <p className="text-sm text-zinc-600">
              Vista completa de movimientos con categoría y método de pago.
            </p>
          </div>

          <MonthSelect
            monthId={monthId}
            months={months}
            onChange={setMonthId}
            disabled={months.length === 0}
          />
        </div>

        <div className="mb-4 flex items-center gap-3 text-sm">
          <label className="text-xs text-zinc-600">Metodo de pago</label>
          <select
            className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200"
            value={paymentFilterId}
            onChange={(e) => setPaymentFilterId(e.target.value)}
          >
            <option value="ALL">Todos</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  {monthLabel ? `Mes · ${monthLabel}` : "Mes"}
                </div>
                <div className="text-xs text-zinc-600">
                  GET /months/:monthId/transactions
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                  {rows.length} movimientos
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                  Ingresos {money(totals.income)}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                  Gastos {money(totals.expense)}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardBody>
            {loading ? (
              <div className="text-sm text-zinc-600">Cargando…</div>
            ) : filteredRows.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No hay transacciones para este mes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr className="border-b border-zinc-100">
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Descripción</th>
                      <th className="py-2 pr-3">Tipo</th>
                      <th className="py-2 pr-3">Categoría</th>
                      <th className="py-2 pr-3">Grupo</th>
                      <th className="py-2 pr-3">Método</th>
                      <th className="py-2 text-center">Monto</th>
                      <th className="py-2 pr-3 pl-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((t) => (
                      <tr
                        key={`${t.type}:${t.id}`}
                        className={`border-b border-zinc-50 ${
                          t.type === "INCOME" ? "bg-emerald-50/60" : ""
                        }`}
                      >
                        {(() => {
                          const key = rowKey(t);
                          const isEditing = editingKey === key;
                          const draft = drafts[key];
                          return (
                            <>
                              <td className="py-3 pr-3 whitespace-nowrap text-zinc-700">
                                {isEditing ? (
                                  <input
                                    className="h-8 w-[140px] rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
                                    type="date"
                                    value={draft?.date ?? t.date}
                                    onChange={(e) =>
                                      updateDraft(t, { date: e.target.value })
                                    }
                                    disabled={savingKey === key}
                                  />
                                ) : (
                                  formatDate(t.date)
                                )}
                              </td>
                              <td className="py-3 pr-3 text-zinc-900">
                                {t.description}
                              </td>
                              <td className="py-3 pr-3 text-zinc-700">
                                {t.type === "INCOME" ? "Ingreso" : "Gasto"}
                              </td>
                              <td className="py-3 pr-3 text-zinc-700">
                                {t.type === "EXPENSE" && isEditing ? (
                                  <select
                                    className="h-8 w-[180px] rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
                                    value={draft?.categoryId ?? t.categoryId ?? ""}
                                    onChange={(e) =>
                                      updateDraft(t, { categoryId: e.target.value })
                                    }
                                    disabled={savingKey === key}
                                  >
                                    <option value="" disabled>
                                      Selecciona…
                                    </option>
                                    {Object.entries(groupedCategories)
                                      .sort(([a], [b]) => a.localeCompare(b))
                                      .map(([groupName, cats]) => (
                                        <optgroup key={groupName} label={groupName}>
                                          {cats.map((c) => (
                                            <option key={c.id} value={c.id}>
                                              {c.name}
                                            </option>
                                          ))}
                                        </optgroup>
                                      ))}
                                  </select>
                                ) : (
                                  t.categoryName ?? "—"
                                )}
                              </td>
                              <td className="py-3 pr-3 text-zinc-700">
                                {t.groupName ?? "—"}
                              </td>
                              <td className="py-3 pr-3 text-zinc-700">
                                {t.paymentMethodName ?? "—"}
                              </td>
                              <td
                                className={`py-3 text-center font-medium ${
                                  t.type === "INCOME"
                                    ? "text-emerald-700"
                                    : "text-zinc-900"
                                }`}
                              >
                                {t.type === "INCOME" && isEditing ? (
                                  <input
                                    className="h-8 w-[120px] rounded-md border border-zinc-200 bg-white px-2 text-xs text-center outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
                                    inputMode="decimal"
                                    value={draft?.amount ?? String(t.amount)}
                                    onChange={(e) =>
                                      updateDraft(t, { amount: e.target.value })
                                    }
                                    disabled={savingKey === key}
                                  />
                                ) : (
                                  money(t.amount)
                                )}
                              </td>
                              <td className="py-3 pr-3 pl-4 text-zinc-700">
                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        className="h-8 rounded-md bg-zinc-900 px-2 text-xs text-white hover:bg-zinc-800 disabled:opacity-60"
                                        onClick={() => saveEdit(t)}
                                        disabled={savingKey === key}
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                                        onClick={() => cancelEdit(t)}
                                        disabled={savingKey === key}
                                      >
                                        Cancelar
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      className="h-8 w-8 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                                      onClick={() => startEdit(t)}
                                      disabled={savingKey === key}
                                      aria-label="Editar"
                                      title="Editar"
                                    >
                                      <svg
                                        className="mx-auto h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                      >
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    className="h-8 w-8 rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                    onClick={() => handleDelete(t)}
                                    disabled={savingKey === key}
                                    aria-label="Eliminar"
                                    title="Eliminar"
                                  >
                                    <svg
                                      className="mx-auto h-4 w-4"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M6 6l1 14h10l1-14" />
                                      <path d="M10 11v6" />
                                      <path d="M14 11v6" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {toast ? (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
