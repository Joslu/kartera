import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import type { Category } from "../../api/types";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Ajusta esta lista si tu backend usa otros valores.
// IMPORTANTE: el value debe coincidir con tu enum del backend.
const PAYMENT_METHODS = ['CREDIT_BANAMEX', 'CREDIT_NUBANK', 'DEBIT_BBVA', 'CASH'] as const;

export function CreateExpenseModal({
  open,
  monthId,
  categories,
  onClose,
  onCreate,
}: {
  open: boolean;
  monthId: string;
  categories: Record<string, Category[]>; // { "Hogar": [..], "Comida": [..] }
  onClose: () => void;
  onCreate: (payload: {
    monthId: string;
    date: string;
    amount: number;
    description: string;
    paymentMethod: string;
    categoryId?: string;
  }) => Promise<void>;
}) {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [categoryId, setCategoryId] = useState<string>(""); // opcional
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setAmount("");
    setDescription("");
    setPaymentMethod("CASH");
    setCategoryId("");
    setError(null);
  }, [open]);

  const amountNumber = useMemo(() => Number(amount), [amount]);

  const canSubmit =
    monthId &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    description.trim().length >= 2 &&
    String(paymentMethod).length > 0 &&
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
        paymentMethod,
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
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-zinc-500">
            Si tu backend usa otros valores, ajusta <code>PAYMENT_METHODS</code>.
          </div>
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
