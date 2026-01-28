import { Fragment, useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { Toast } from "../../components/Toast";
import { money, formatMonthName } from "../../utils/format";
import { MonthSelect } from "../inbox/MonthSelect";
import {
  getCategories,
  getMonthSummary,
  getMonths,
  upsertBudgetAssignment,
} from "../../api/endpoints";
import type { Category, MonthSummary } from "../../api/types";
import { getStoredMonthId, setStoredMonthId } from "../../utils/month";

type MonthRow = { id: string; year: number; month: number; createdAt: string };

type BudgetRow = {
  categoryId: string;
  categoryName: string;
  groupName: string;
  kind: "EXPENSE" | "TRACKING";
  assigned: number;
  spent: number;
  available: number;
  sortOrder?: number;
  groupSortOrder?: number;
};

const DEFAULT_MONTH_ID = import.meta.env.VITE_DEFAULT_MONTH_ID as string;

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function buildDrafts(categories: Category[], summary: MonthSummary | null) {
  const summaryById = new Map<string, MonthSummary["categories"][number]>();
  for (const row of summary?.categories ?? []) {
    summaryById.set(row.categoryId, row);
  }

  const drafts: Record<string, string> = {};
  const seen = new Set<string>();

  for (const cat of categories) {
    if (cat.name.toLowerCase() === "no identificado") continue;
    const assigned = toNumber(summaryById.get(cat.id)?.assigned ?? 0);
    drafts[cat.id] = String(assigned);
    seen.add(cat.id);
  }

  for (const row of summary?.categories ?? []) {
    if (seen.has(row.categoryId)) continue;
    drafts[row.categoryId] = String(toNumber(row.assigned ?? 0));
  }

  return drafts;
}

export default function MonthBudgets() {
  const [monthId, setMonthId] = useState<string>(() =>
    getStoredMonthId(DEFAULT_MONTH_ID),
  );
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
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
        const [cats, s] = await Promise.all([
          getCategories(),
          getMonthSummary(monthId),
        ]);
        setCategories(cats);
        setSummary(s);
        setDrafts(buildDrafts(cats, s));
      } catch (e: any) {
        setToast({
          type: "error",
          message: e?.message ?? "No se pudo cargar presupuesto",
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

  const rows = useMemo(() => {
    const summaryById = new Map<string, MonthSummary["categories"][number]>();
    for (const row of summary?.categories ?? []) {
      summaryById.set(row.categoryId, row);
    }

    const items: BudgetRow[] = [];
    const seen = new Set<string>();

    for (const cat of categories) {
      if (cat.name.toLowerCase() === "no identificado") continue;
      const s = summaryById.get(cat.id);
      const assigned = toNumber(s?.assigned ?? 0);
      const spent = toNumber(s?.spent ?? 0);
      items.push({
        categoryId: cat.id,
        categoryName: cat.name,
        groupName: cat.groupName,
        kind: s?.kind ?? cat.kind,
        assigned,
        spent,
        available: toNumber(s?.available ?? assigned - spent),
        sortOrder: cat.sortOrder,
        groupSortOrder: cat.groupSortOrder,
      });
      seen.add(cat.id);
    }

    for (const s of summary?.categories ?? []) {
      if (seen.has(s.categoryId)) continue;
      items.push({
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        groupName: s.groupName,
        kind: s.kind as "EXPENSE" | "TRACKING",
        assigned: toNumber(s.assigned),
        spent: toNumber(s.spent),
        available: toNumber(s.available),
        sortOrder: 9999,
        groupSortOrder: 9999,
      });
    }

    return items.sort((a, b) => {
      const gx = a.groupSortOrder ?? 9999;
      const gy = b.groupSortOrder ?? 9999;
      if (gx !== gy) return gx - gy;
      const cx = a.sortOrder ?? 9999;
      const cy = b.sortOrder ?? 9999;
      if (cx !== cy) return cx - cy;
      return a.categoryName.localeCompare(b.categoryName);
    });
  }, [categories, summary]);

  const groupedRows = useMemo(() => {
    const groups: Array<{ name: string; rows: BudgetRow[] }> = [];
    const map = new Map<string, { name: string; rows: BudgetRow[] }>();
    for (const row of rows) {
      const key = row.groupName || "Sin grupo";
      let group = map.get(key);
      if (!group) {
        group = { name: key, rows: [] };
        map.set(key, group);
        groups.push(group);
      }
      group.rows.push(row);
    }
    return groups;
  }, [rows]);

  const groupChart = useMemo(() => {
    const items = groupedRows.map((group) => {
      const assigned = group.rows.reduce((acc, r) => acc + (r.assigned || 0), 0);
      const spent = group.rows.reduce((acc, r) => acc + (r.spent || 0), 0);
      return {
        name: group.name,
        assigned,
        spent,
      };
    });
    const max = Math.max(1, ...items.map((i) => Math.max(i.assigned, i.spent)));
    return { items, max };
  }, [groupedRows]);

  const totals = useMemo(() => {
    const income = toNumber(summary?.totals.income ?? 0);
    const assigned = toNumber(summary?.totals.assigned ?? 0);
    const spent = toNumber(summary?.totals.spentExpense ?? 0);
    return {
      income,
      assigned,
      spent,
      available: income - assigned,
    };
  }, [summary]);

  async function handleSave(row: BudgetRow) {
    const raw = drafts[row.categoryId] ?? "";
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      setToast({ type: "error", message: "Monto inválido (>= 0)" });
      return;
    }

    setSavingId(row.categoryId);
    try {
      await upsertBudgetAssignment({
        monthId,
        categoryId: row.categoryId,
        amount,
      });
      const s = await getMonthSummary(monthId);
      setSummary(s);
      setDrafts(buildDrafts(categories, s));
      setToast({ type: "success", message: "Asignación guardada" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo guardar",
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
              Presupuesto del mes
            </h1>
            <p className="text-sm text-zinc-600">
              Define asignaciones por categoría y revisa disponible vs gasto.
            </p>
          </div>

          <MonthSelect
            monthId={monthId}
            months={months}
            onChange={setMonthId}
            disabled={months.length === 0}
          />
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Ingresos</div>
            <div className="text-lg font-semibold text-zinc-900">
              {money(totals.income)}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Asignado</div>
            <div className="text-lg font-semibold text-zinc-900">
              {money(totals.assigned)}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Disponible para asignar</div>
            <div
              className={`text-lg font-semibold ${
                totals.available < 0 ? "text-rose-700" : "text-zinc-900"
              }`}
            >
              {money(totals.available)}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-600">Movimientos</div>
            <div className="text-lg font-semibold text-zinc-900">
              {money(totals.spent)}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  Asignado vs Gastado por grupo
                </div>
                <div className="text-xs text-zinc-600">
                  Vista rápida del balance por grupo
                </div>
              </div>
              <div className="text-xs text-zinc-600">
                {groupChart.items.length} grupos
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {groupChart.items.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No hay datos para graficar.
              </div>
            ) : (
              <div className="space-y-3">
                {groupChart.items.map((g) => {
                  const assignedPct = Math.min(
                    100,
                    (g.assigned / groupChart.max) * 100,
                  );
                  const spentPct = Math.min(
                    100,
                    (g.spent / groupChart.max) * 100,
                  );
                  return (
                    <div key={g.name}>
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
                        <span className="font-medium text-zinc-700">
                          {g.name}
                        </span>
                        <span>
                          Asignado {money(g.assigned)} · Gastado {money(g.spent)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-zinc-100">
                          <div
                            className="h-2 rounded-full bg-zinc-900"
                            style={{ width: `${assignedPct}%` }}
                          />
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${spentPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-zinc-900" />
                    Asignado
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-4 rounded-full bg-emerald-500" />
                    Gastado
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="h-6" />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  {monthLabel ? `Mes · ${monthLabel}` : "Mes"}
                </div>
                <div className="text-xs text-zinc-600">
                  POST /budget-assignments
                </div>
              </div>
              <div className="text-xs text-zinc-600">
                {rows.length} categorías
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-sm text-zinc-600">Cargando…</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No hay categorías para este mes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr className="border-b border-zinc-100">
                      <th className="py-2 pr-3">Categoría</th>
                      <th className="py-2 pr-3">Asignado</th>
                      <th className="py-2 pr-3">Gastado</th>
                      <th className="py-2 pr-3">Disponible</th>
                      <th className="py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRows.map((group) => (
                      <Fragment key={group.name}>
                        <tr>
                          <td
                            className="bg-zinc-50 py-2 pr-3 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                            colSpan={5}
                          >
                            {group.name}
                          </td>
                        </tr>
                        {group.rows.map((row) => {
                          const draft = drafts[row.categoryId] ?? "";
                          const draftNumber = Number(draft);
                          const isValid =
                            Number.isFinite(draftNumber) && draftNumber >= 0;
                          const isDirty =
                            isValid &&
                            Math.abs(draftNumber - row.assigned) > 0.0001;
                          const isEditable = row.kind === "EXPENSE";

                          return (
                            <tr
                              key={row.categoryId}
                              className="border-b border-zinc-50"
                            >
                              <td className="py-3 pr-3 text-zinc-900">
                                <div className="flex items-center gap-2">
                                  <span>{row.categoryName}</span>
                                  {row.kind === "TRACKING" ? (
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                                      Tracking
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-3 pr-3">
                                <input
                                  className="h-9 w-32 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
                                  inputMode="decimal"
                                  value={draft}
                                  onChange={(e) =>
                                    setDrafts((d) => ({
                                      ...d,
                                      [row.categoryId]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && isEditable && isDirty) {
                                      handleSave(row);
                                    }
                                  }}
                                  disabled={!isEditable || savingId === row.categoryId}
                                />
                              </td>
                              <td className="py-3 pr-3 text-zinc-700">
                                {money(row.spent)}
                              </td>
                              <td
                                className={`py-3 pr-3 ${
                                  row.available < 0
                                    ? "text-rose-700"
                                    : "text-zinc-700"
                                }`}
                              >
                                {money(row.available)}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  className="h-9 rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
                                  onClick={() => handleSave(row)}
                                  disabled={
                                    !isEditable ||
                                    !isDirty ||
                                    savingId === row.categoryId
                                  }
                                >
                                  {savingId === row.categoryId
                                    ? "Guardando…"
                                    : "Guardar"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
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
