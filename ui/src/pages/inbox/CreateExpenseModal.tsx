import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import type { Category, PaymentMethod } from "../../api/types";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CreateExpenseModal({
  open,
  monthId,
  categories,
  paymentMethods,
  onClose,
  onCreate,
}: {
  open: boolean;
  monthId: string;
  categories: Record<string, Category[]>; // { "Hogar": [..], "Comida": [..] }
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onCreate: (payload: {
    monthId: string;
    date: string;
    amount: number;
    description: string;
    paymentMethodId: string;
    categoryId?: string;
  }) => Promise<void>;
}) {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>(""); // opcional
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectablePaymentMethods = useMemo(
    () => paymentMethods.filter((m) => m.isActive),
    [paymentMethods],
  );

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setAmount("");
    setDescription("");
    setPaymentMethodId(selectablePaymentMethods[0]?.id ?? "");
    setCategoryId("");
    setError(null);
  }, [open, selectablePaymentMethods]);

  const amountNumber = useMemo(() => Number(amount), [amount]);

  const canSubmit =
    monthId &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    description.trim().length >= 2 &&
    String(paymentMethodId).length > 0 &&
    !saving;

  async function submit() {
    setError(null);
    if (!canSubmit) {
      setError("Revisa fecha, monto, descripción y método de pago.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        monthId,
        date,
        amount: amountNumber,
        description: description.trim(),
        paymentMethodId,
        categoryId: categoryId || undefined, // si viene vacío, no se manda
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear el gasto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Agregar gasto" onClose={onClose}>
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
          <label className="mb-1 block text-xs text-zinc-600">Descripción</label>
          <input
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            placeholder="Café"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Monto</label>
          <input
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            inputMode="decimal"
            placeholder="250"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Método de pago</label>
          <select
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
          >
            {selectablePaymentMethods.length === 0 ? (
              <option value="">Sin métodos disponibles</option>
            ) : (
              selectablePaymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">
            Categoría (opcional)
          </label>
          <select
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Dejar en “No identificado”</option>
            {Object.entries(categories)
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
