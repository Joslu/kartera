import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import type { PaymentMethod } from "../../api/types";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CreateTransferModal({
  open,
  monthId,
  paymentMethods,
  onClose,
  onCreate,
}: {
  open: boolean;
  monthId: string;
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onCreate: (payload: {
    monthId: string;
    date: string;
    amount: number;
    fromPaymentMethodId: string;
    toPaymentMethodId: string;
    description?: string;
    note?: string;
  }) => Promise<void>;
}) {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState<string>("");
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(
    () => paymentMethods.filter((m) => m.isActive && m.type !== "CREDIT"),
    [paymentMethods],
  );

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setAmount("");
    setDescription("");
    setFromId(selectable[0]?.id ?? "");
    setToId(selectable[1]?.id ?? selectable[0]?.id ?? "");
    setError(null);
  }, [open, selectable]);

  const amountNumber = useMemo(() => Number(amount), [amount]);

  const canSubmit =
    monthId &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    fromId &&
    toId &&
    fromId !== toId &&
    !saving;

  async function submit() {
    setError(null);
    if (!canSubmit) {
      setError("Revisa fecha, monto y cuentas.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        monthId,
        date,
        amount: amountNumber,
        fromPaymentMethodId: fromId,
        toPaymentMethodId: toId,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear la transferencia");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Transferencia" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-600">Fecha</label>
          <input
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Monto</label>
          <input
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            inputMode="decimal"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Desde</label>
          <select
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            {selectable.length === 0 ? (
              <option value="">Sin cuentas disponibles</option>
            ) : (
              selectable.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Hacia</label>
          <select
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            {selectable.length === 0 ? (
              <option value="">Sin cuentas disponibles</option>
            ) : (
              selectable.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">
            Descripción (opcional)
          </label>
          <input
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            placeholder="Transferencia"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error ? <div className="text-xs text-rose-700">{error}</div> : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm hover:bg-zinc-50"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="h-9 rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
            onClick={submit}
            disabled={!canSubmit}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
