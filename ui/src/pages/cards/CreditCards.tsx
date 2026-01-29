import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { Toast } from "../../components/Toast";
import {
  getCreditCardCycle,
  getCreditCardSummary,
  getPaymentMethodBalances,
} from "../../api/endpoints";
import { formatDate, money } from "../../utils/format";

type CardSummary = {
  id: string;
  paymentMethodId: string;
  paymentMethodName: string;
  cutoffDay: number;
  dueDay?: number | null;
  paymentCategoryName?: string | null;
  cycleStart: string;
  cycleEnd: string;
  paymentWindowStart?: string | null;
  paymentWindowEnd?: string | null;
  isInPaymentWindow?: boolean;
  spent: number;
  paid: number;
  debt: number;
};

type CardCycle = {
  cardId: string;
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
};

type DebitBalance = {
  id: string;
  name: string;
  income: number;
  expense: number;
  balance: number;
};

export default function CreditCards() {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleMap, setCycleMap] = useState<Record<string, CardCycle>>({});
  const [cycleLoadingId, setCycleLoadingId] = useState<string | null>(null);
  const [cycleMode, setCycleMode] = useState<"current" | "previous">("current");
  const [debitBalances, setDebitBalances] = useState<DebitBalance[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [items, balances] = await Promise.all([
          getCreditCardSummary(cycleMode),
          getPaymentMethodBalances(),
        ]);
        setCards(items);
        setDebitBalances(balances);
        setCycleMap({});
      } catch (e: any) {
        setToast({
          type: "error",
          message: e?.message ?? "No se pudieron cargar tarjetas",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [cycleMode]);

  async function toggleCycle(cardId: string) {
    if (cycleMap[cardId]) {
      setCycleMap((current) => {
        const next = { ...current };
        delete next[cardId];
        return next;
      });
      return;
    }
    setCycleLoadingId(cardId);
    try {
      const res = await getCreditCardCycle(cardId, cycleMode);
      setCycleMap((current) => ({
        ...current,
        [cardId]: {
          cardId,
          cycleStart: res.cycleStart,
          cycleEnd: res.cycleEnd,
          items: res.items ?? [],
        },
      }));
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo cargar el detalle",
      });
    } finally {
      setCycleLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Tarjetas</h1>
          <p className="text-sm text-zinc-600">
            Deuda actual del ciclo segun fecha de corte.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            className={`h-8 rounded-full px-3 text-xs ${
              cycleMode === "current"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
            onClick={() => setCycleMode("current")}
          >
            Ciclo actual
          </button>
          <button
            className={`h-8 rounded-full px-3 text-xs ${
              cycleMode === "previous"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
            onClick={() => setCycleMode("previous")}
          >
            Ciclo anterior
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  Estado de tarjetas
                </div>
                <div className="text-xs text-zinc-600">
                  GET /credit-cards/summary
                </div>
              </div>
              <div className="text-xs text-zinc-600">
                {cards.length} tarjetas
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-sm text-zinc-600">Cargando…</div>
            ) : cards.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No hay tarjetas configuradas.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-900">
                        {c.paymentMethodName}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.isInPaymentWindow ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                            Periodo de pago
                          </span>
                        ) : null}
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                          Corte {c.cutoffDay}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      Ciclo {formatDate(c.cycleStart)} - {formatDate(c.cycleEnd)}
                    </div>
                    {typeof c.dueDay === "number" ? (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        Pago +{c.dueDay} dias
                      </div>
                    ) : null}
                    {c.paymentWindowStart && c.paymentWindowEnd ? (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        Pago {formatDate(c.paymentWindowStart)} -{" "}
                        {formatDate(c.paymentWindowEnd)}
                      </div>
                    ) : null}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-zinc-50 px-2 py-2">
                        <div className="text-zinc-500">Gasto</div>
                        <div className="text-zinc-900">{money(c.spent)}</div>
                      </div>
                      <div className="rounded-md bg-zinc-50 px-2 py-2">
                        <div className="text-zinc-500">Pagos</div>
                        <div className="text-zinc-900">{money(c.paid)}</div>
                      </div>
                      <div
                        className={`rounded-md px-2 py-2 ${
                          c.debt > 0 ? "bg-rose-50" : "bg-zinc-50"
                        }`}
                      >
                        <div
                          className={c.debt > 0 ? "text-rose-700" : "text-zinc-500"}
                        >
                          Deuda
                        </div>
                        <div
                          className={c.debt > 0 ? "text-rose-800" : "text-zinc-900"}
                        >
                          {money(c.debt)}
                        </div>
                      </div>
                    </div>
                    {c.paymentCategoryName ? (
                      <div className="mt-3 text-xs text-zinc-500">
                        Categoria pago: {c.paymentCategoryName}
                      </div>
                    ) : null}
                    <div className="mt-3">
                      <button
                        className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 hover:bg-zinc-50"
                        onClick={() => toggleCycle(c.id)}
                        disabled={cycleLoadingId === c.id}
                      >
                        {cycleMap[c.id] ? "Ocultar detalle" : "Ver detalle"}
                      </button>
                    </div>
                    {cycleMap[c.id] ? (
                      <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 p-3">
                        <div className="mb-2 text-xs text-zinc-600">
                          Detalle {formatDate(cycleMap[c.id].cycleStart)} -{" "}
                          {formatDate(cycleMap[c.id].cycleEnd)}
                        </div>
                        {cycleMap[c.id].items.length === 0 ? (
                          <div className="text-xs text-zinc-500">
                            No hay movimientos en el ciclo.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {cycleMap[c.id].items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className="text-zinc-700">
                                  {formatDate(item.date)} · {item.description}
                                  {item.categoryName
                                    ? ` · ${item.categoryName}`
                                    : ""}
                                </div>
                                <div
                                  className={
                                    item.kind === "PAYMENT"
                                      ? "text-emerald-700"
                                      : "text-zinc-900"
                                  }
                                >
                                  {item.kind === "PAYMENT" ? "-" : ""}
                                  {money(item.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    Debito
                  </div>
                  <div className="text-xs text-zinc-600">
                    Ingresos menos gastos
                  </div>
                </div>
                <div className="text-xs text-zinc-600">
                  {debitBalances.length} cuentas
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-sm text-zinc-600">Cargando…</div>
              ) : debitBalances.length === 0 ? (
                <div className="text-sm text-zinc-600">
                  No hay cuentas de debito.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {debitBalances.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-zinc-900">
                        {d.name}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-md bg-zinc-50 px-2 py-2">
                          <div className="text-zinc-500">Ingresos</div>
                          <div className="text-zinc-900">{money(d.income)}</div>
                        </div>
                        <div className="rounded-md bg-zinc-50 px-2 py-2">
                          <div className="text-zinc-500">Gastos</div>
                          <div className="text-zinc-900">{money(d.expense)}</div>
                        </div>
                        <div className="rounded-md bg-zinc-50 px-2 py-2">
                          <div className="text-zinc-500">Saldo</div>
                          <div className="text-zinc-900">{money(d.balance)}</div>
                        </div>
                      </div>
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
