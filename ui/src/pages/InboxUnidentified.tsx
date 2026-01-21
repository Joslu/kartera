import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Select } from "../components/Select";
import { Toast } from "../components/Toast";
import {
  getCategories,
  getMonthSummary,
  getUnidentified,
  patchTransaction,
  getMonths,
} from "../api/endpoints";

import type { Category, Transaction } from "../api/types";

const DEFAULT_MONTH_ID = import.meta.env.VITE_DEFAULT_MONTH_ID as string;

function money(value: unknown) {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(n) ? n : 0);
}

type UISummary = {
  income: number;
  expenses: number; // totals.spentExpense
  net: number; // income - expenses
  unidentifiedSpent: number; // from categories[] where categoryName === "No identificado"
  monthLabel: string;
};

function formatDate(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatMonthName(year: number, month: number) {
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export default function InboxUnidentified() {
  const [monthId, setMonthId] = useState<string>(DEFAULT_MONTH_ID);

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

  function mapSummaryToUI(s: any): UISummary {
    const income = Number(s?.totals?.income ?? 0);
    const expenses = Number(s?.totals?.spentExpense ?? 0);
    const net = income - expenses;

    const noIdent = (s?.categories ?? []).find(
      (c: any) =>
        String(c?.categoryName ?? "").toLowerCase() === "no identificado",
    );
    const unidentifiedSpent = Number(noIdent?.spent ?? 0);

    const monthLabel = s?.month
      ? formatMonthName(s.month.year, s.month.month)
      : "";

    return { income, expenses, net, unidentifiedSpent, monthLabel };
  }

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function recategorize(tx: Transaction, newCategoryId: string) {
    if (!newCategoryId) return;

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Inbox: “No identificado”
            </h1>
            <p className="text-sm text-zinc-600">
              Regla: “No identificado” es temporal; recategoriza aquí para
              limpiar el mes.
            </p>
          </div>

          <select
            className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={monthId}
            onChange={(e) => setMonthId(e.target.value)}
          >
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {formatMonthName(m.year, m.month)}
              </option>
            ))}
          </select>

          <div className="text-right text-sm text-zinc-600">
            <div>
              <span className="font-medium text-zinc-900">monthId:</span>{" "}
              {monthId}
            </div>
          </div>
        </div>

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
                                  {categories
                                    .filter(
                                      (c) =>
                                        c.name.toLowerCase() !==
                                        "no identificado",
                                    )
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
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
      </div>
    </div>
  );
}
