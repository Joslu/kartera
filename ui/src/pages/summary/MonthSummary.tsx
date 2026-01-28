import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { Toast } from "../../components/Toast";
import { money, formatMonthName } from "../../utils/format";
import { MonthSelect } from "../inbox/MonthSelect";
import { getMonthSummary, getMonths } from "../../api/endpoints";
import type { MonthSummary as MonthSummaryType } from "../../api/types";
import { getStoredMonthId, setStoredMonthId } from "../../utils/month";

type MonthRow = { id: string; year: number; month: number; createdAt: string };

const DEFAULT_MONTH_ID = import.meta.env.VITE_DEFAULT_MONTH_ID as string;

export default function MonthSummary() {
  const [monthId, setMonthId] = useState<string>(() =>
    getStoredMonthId(DEFAULT_MONTH_ID),
  );
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [summary, setSummary] = useState<MonthSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ms = await getMonths();
        ms.sort((a, b) => b.year - a.year || b.month - a.month);
        setMonths(ms);
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
        const s = await getMonthSummary(monthId);
        setSummary(s);
      } catch (e: any) {
        setToast({
          type: "error",
          message: e?.message ?? "No se pudo cargar resumen",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [monthId]);

  const monthLabel = useMemo(() => {
    if (!summary?.month) return "";
    return formatMonthName(summary.month.year, summary.month.month);
  }, [summary]);

  const totals = useMemo(() => {
    const income = Number(summary?.totals.income ?? 0);
    const assigned = Number(summary?.totals.assigned ?? 0);
    const spent = Number(summary?.totals.spentExpense ?? 0);
    const tracking = Number(summary?.totals.spentTracking ?? 0);
    return {
      income,
      assigned,
      spent,
      tracking,
      net: income - spent,
      unassigned: income - assigned,
    };
  }, [summary]);

  const topSpent = useMemo(() => {
    const rows = (summary?.categories ?? [])
      .filter((c) => c.kind === "EXPENSE")
      .sort((a, b) => Number(b.spent) - Number(a.spent))
      .slice(0, 5);
    return rows;
  }, [summary]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Resumen</h1>
            <p className="text-sm text-zinc-600">
              Vista general del mes seleccionado.
            </p>
          </div>
          <MonthSelect
            monthId={monthId}
            months={months}
            onChange={setMonthId}
            disabled={months.length === 0}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Ingresos</div>
            <div className="text-lg font-semibold text-zinc-900">
              {money(totals.income)}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Gastos</div>
            <div className="text-lg font-semibold text-zinc-900">
              {money(totals.spent)}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Net</div>
            <div
              className={`text-lg font-semibold ${
                totals.net < 0 ? "text-rose-700" : "text-zinc-900"
              }`}
            >
              {money(totals.net)}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Sin asignar</div>
            <div
              className={`text-lg font-semibold ${
                totals.unassigned < 0 ? "text-rose-700" : "text-zinc-900"
              }`}
            >
              {money(totals.unassigned)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    {monthLabel ? `Mes · ${monthLabel}` : "Mes"}
                  </div>
                  <div className="text-xs text-zinc-600">
                    /months/:monthId/summary
                  </div>
                </div>
                <div className="text-xs text-zinc-600">
                  Tracking {money(totals.tracking)}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-sm text-zinc-600">Cargando…</div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Asignado</span>
                    <span className="font-medium">
                      {money(totals.assigned)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Gastado</span>
                    <span className="font-medium">{money(totals.spent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Tracking</span>
                    <span className="font-medium">{money(totals.tracking)}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-zinc-900">
                Top categorías (gasto)
              </div>
              <div className="text-xs text-zinc-600">Top 5 por gasto</div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-sm text-zinc-600">Cargando…</div>
              ) : topSpent.length === 0 ? (
                <div className="text-sm text-zinc-600">
                  No hay gastos en este mes.
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {topSpent.map((c) => (
                    <div
                      key={c.categoryId}
                      className="flex items-center justify-between"
                    >
                      <span className="text-zinc-700">{c.categoryName}</span>
                      <span className="font-medium">{money(c.spent)}</span>
                    </div>
                  ))}
                </div>
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
  );
}
