import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { Select } from "../../components/Select";
import { Toast } from "../../components/Toast";
import { money, formatDate } from "../../utils/format";
import { mapSummaryToUI, type UISummary } from "../inbox/summary";

import { CreateIncomeModal } from "./CreateIncomeModal";
import { createIncome } from "../../api/endpoints";

import { MonthSelect } from "./MonthSelect";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { createTransaction } from "../../api/endpoints";
import { groupCategories } from "./categoryGroup";

import {
  getCategories,
  getMonthSummary,
  getUnidentified,
  patchTransaction,
  getMonths,
} from "../../api/endpoints";

import type { Category, Transaction } from "../../api/types";
import { getStoredMonthId, setStoredMonthId } from "../../utils/month";
 

const DEFAULT_MONTH_ID = import.meta.env.VITE_DEFAULT_MONTH_ID as string;

export default function InboxUnidentified() {
  const [monthId, setMonthId] = useState<string>(() =>
    getStoredMonthId(DEFAULT_MONTH_ID),
  );

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<UISummary | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [months, setMonths] = useState<
    Array<{ id: string; year: number; month: number; createdAt: string }>
  >([]);

  const unidentifiedTotal = useMemo(() => {
    return rows.reduce((acc, t) => acc + Number(t.amount ?? 0), 0);
  }, [rows]);

  const groupedCategories = useMemo(
    () => groupCategories(categories),
    [categories],
  );

  const donut = useMemo(() => {
    if (!summary || summary.expenses <= 0) return null;
    const expenses = summary.expenses;
    const unidentified = Math.min(summary.unidentifiedSpent, expenses);
    const categorized = Math.max(0, expenses - unidentified);
    const pctUnidentified = unidentified / expenses;
    const pctCategorized = categorized / expenses;
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    return {
      expenses,
      unidentified,
      categorized,
      pctUnidentified,
      pctCategorized,
      radius,
      circumference,
      categorizedDash: `${pctCategorized * circumference} ${circumference}`,
      unidentifiedDash: `${pctUnidentified * circumference} ${circumference}`,
      unidentifiedOffset: `-${pctCategorized * circumference}`,
      pctUnidentifiedLabel: Math.round(pctUnidentified * 100),
      pctCategorizedLabel: Math.round(pctCategorized * 100),
    };
  }, [summary]);
 

  async function load() {
    setLoading(true);
    try {
      const [cats, txs, s] = await Promise.all([
        getCategories(),
        getUnidentified(monthId),
        getMonthSummary(monthId),
      ]);

      setCategories(cats);
      setRows(txs);
      setSummary(mapSummaryToUI(s));
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "Error cargando datos",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const ms = await getMonths();
        // ordena: más reciente primero
        ms.sort((a, b) => b.year - a.year || b.month - a.month);
        setMonths(ms);

        // si tu DEFAULT_MONTH_ID no está en la lista, usa el primero
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthId]);

  async function recategorize(tx: Transaction, newCategoryId: string) {
    if (!newCategoryId) return;
    const selected = categories.find((c) => c.id === newCategoryId);
    if (
      !confirm(
        `¿Asignar categoría "${selected?.name ?? "Sin nombre"}" a "${tx.description}"?`,
      )
    ) {
      return;
    }

    // optimistic update: removemos del inbox (porque ya no es "No identificado")
    const prev = rows;
    setSavingId(tx.id);
    setRows((r) => r.filter((x) => x.id !== tx.id));

    try {
      await patchTransaction(tx.id, { categoryId: newCategoryId });
      setToast({ type: "success", message: "Transacción recategorizada" });

      // refrescamos summary (opcional, pero útil)
      try {
        const s = await getMonthSummary(monthId);
        setSummary(mapSummaryToUI(s));
      } catch {
        // si falla, no rompemos el flujo
      }
    } catch (e: any) {
      // rollback
      setRows(prev);
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo actualizar",
      });
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreateIncome(payload: {
    monthId: string;
    date: string;
    amount: number;
    source: string;
  }) {
    await createIncome(payload);

    setToast({ type: "success", message: "Ingreso agregado" });

    // refresca summary para reflejar ingresos
    const s = await getMonthSummary(monthId);
    setSummary(mapSummaryToUI(s));
  }

  async function handleCreateExpense(payload: {
    monthId: string;
    date: string;
    amount: number;
    description: string;
    paymentMethod: string;
    categoryId?: string;
  }) {
    await createTransaction(payload);

    setToast({ type: "success", message: "Gasto agregado" });

    // Refresca summary + inbox para reflejar el cambio
    const [s, txs] = await Promise.all([
      getMonthSummary(monthId),
      getUnidentified(monthId),
    ]);

    setSummary(mapSummaryToUI(s));
    setRows(txs);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Inbox: “No identificado”
            </h1>
            <p className="text-sm text-zinc-600">
              Regla: “No identificado” es temporal; recategoriza aquí para
              limpiar el mes.
            </p>
          </div>
          <div className="flex flex-1 justify-end">
            <MonthSelect
              monthId={monthId}
              months={months}
              onChange={setMonthId}
              disabled={months.length === 0}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  Acciones rápidas
                </div>
                <div className="text-xs text-zinc-600">
                  Pendientes {rows.length} · Total {money(unidentifiedTotal)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
                  onClick={() => setIncomeOpen(true)}
                  disabled={!monthId}
                  aria-label="Nuevo ingreso"
                  title="Nuevo ingreso"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Ingreso
                </button>
                <button
                  className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
                  onClick={() => setExpenseOpen(true)}
                  disabled={!monthId}
                  aria-label="Nuevo gasto"
                  title="Nuevo gasto"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M19 12l-4-4" />
                    <path d="M19 12l-4 4" />
                  </svg>
                  Gasto
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="h-4" />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-zinc-900">
                {summary
                  ? `RESUMEN · ${summary.monthLabel.toUpperCase()}`
                  : "Resumen"}
              </div>
              <div className="text-xs text-zinc-600">
                /months/:monthId/summary
              </div>
            </CardHeader>

            <CardBody>
              {summary ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Ingresos</span>
                    <span className="font-medium">{money(summary.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Gastos</span>
                    <span className="font-medium">
                      {money(summary.expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Net</span>
                    <span className="font-semibold">{money(summary.net)}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 flex justify-between">
                    <span className="text-zinc-600">
                      No identificado (gastado)
                    </span>
                    <span className="font-semibold">
                      {money(summary.unidentifiedSpent)}
                    </span>
                  </div>
                  <div className="pt-3">
                    {donut ? (
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-16">
                          <svg
                            className="h-16 w-16 -rotate-90"
                            viewBox="0 0 80 80"
                          >
                            <circle
                              cx="40"
                              cy="40"
                              r={donut.radius}
                              fill="none"
                              stroke="#e4e4e7"
                              strokeWidth="10"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r={donut.radius}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="10"
                              strokeDasharray={donut.categorizedDash}
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r={donut.radius}
                              fill="none"
                              stroke="#18181b"
                              strokeWidth="10"
                              strokeDasharray={donut.unidentifiedDash}
                              strokeDashoffset={donut.unidentifiedOffset}
                            />
                          </svg>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-600">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-zinc-900" />
                            No identificado {donut.pctUnidentifiedLabel}%
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Categorizado {donut.pctCategorizedLabel}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">
                        No hay gastos para graficar.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-600">Cargando…</div>
              )}
            </CardBody>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">
                      Transacciones sin categoría
                    </div>
                    <div className="text-xs text-zinc-600">
                      GET /months/:monthId/unidentified
                    </div>
                  </div>
                  <button
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm hover:bg-zinc-50"
                    onClick={load}
                    disabled={loading}
                  >
                    Refrescar
                  </button>
                </div>
              </CardHeader>

              <CardBody>
                {loading ? (
                  <div className="text-sm text-zinc-600">Cargando…</div>
                ) : rows.length === 0 ? (
                  <div className="text-sm text-zinc-600">
                    ✅ Inbox limpio. No hay transacciones “No identificado”.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                        {rows.length} pendientes
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                        Total {money(unidentifiedTotal)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs text-zinc-500">
                          <tr className="border-b border-zinc-100">
                            <th className="py-2 pr-3">Fecha</th>
                            <th className="py-2 pr-3">Descripción</th>
                            <th className="py-2 pr-3">Monto</th>
                            <th className="py-2 pr-3">Método</th>
                            <th className="py-2">Categoría</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((t) => (
                            <tr key={t.id} className="border-b border-zinc-50">
                              <td className="py-3 pr-3 whitespace-nowrap text-zinc-700">
                                {formatDate(t.date)}
                              </td>
                              <td className="py-3 pr-3 text-zinc-900">
                                {t.description}
                              </td>
                              <td className="py-3 pr-3 whitespace-nowrap font-medium text-zinc-900">
                                {money(t.amount)}
                              </td>
                              <td className="py-3 pr-3 whitespace-nowrap text-zinc-700">
                                {t.paymentMethod}
                              </td>
                              <td className="py-2">
                                <Select
                                  value=""
                                  onChange={(v) => recategorize(t, v)}
                                >
                                  <option value="" disabled>
                                    Seleccionar…
                                  </option>
                                  {Object.entries(groupedCategories).map(
                                    ([groupName, cats]) => (
                                      <optgroup
                                        key={groupName}
                                        label={groupName}
                                      >
                                        {cats.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ),
                                  )}
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 text-xs text-zinc-500">
                      Al elegir una categoría, se hace PATCH /transactions/:id y
                      la fila desaparece del inbox.
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {toast ? (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        ) : null}
        <CreateIncomeModal
          open={incomeOpen}
          monthId={monthId}
          onClose={() => setIncomeOpen(false)}
          onCreate={handleCreateIncome}
        />

        <CreateExpenseModal
          open={expenseOpen}
          monthId={monthId}
          categories={groupedCategories} // el Record<string, Category[]> que ya usas para optgroup
          onClose={() => setExpenseOpen(false)}
          onCreate={handleCreateExpense}
        />
      </div>
    </div>
  );
}
