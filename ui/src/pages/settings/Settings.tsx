import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { Toast } from "../../components/Toast";
import {
  createCategory,
  createMonth,
  deleteMonth,
  getCategories,
  getCategoryGroups,
  getMonths,
  deleteCategory,
  createCategoryGroup,
  deleteCategoryGroup,
  getPaymentMethods,
  createPaymentMethod,
  patchPaymentMethod,
  deletePaymentMethod,
  getCreditCards,
  createCreditCard,
  patchCreditCard,
  deleteCreditCard,
} from "../../api/endpoints";
import type {
  Category,
  CategoryGroup,
  CreditCard,
  PaymentMethod,
  PaymentMethodType,
} from "../../api/types";
import { formatMonthName } from "../../utils/format";

type FormState = {
  name: string;
  groupId: string;
  kind: "EXPENSE" | "TRACKING";
};

export default function Settings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [months, setMonths] = useState<
    Array<{ id: string; year: number; month: number; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupSaving, setGroupSaving] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [groupDeleteMode, setGroupDeleteMode] = useState(false);
  const [monthForm, setMonthForm] = useState<{ year: string; month: string }>({
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1),
  });
  const [form, setForm] = useState<FormState>({
    name: "",
    groupId: "",
    kind: "EXPENSE",
  });
  const [groupForm, setGroupForm] = useState<{ name: string }>({
    name: "",
  });
  const [pmForm, setPmForm] = useState<{
    name: string;
    type: PaymentMethodType;
    sortOrder: string;
  }>({
    name: "",
    type: "CASH",
    sortOrder: "0",
  });
  const [pmSaving, setPmSaving] = useState(false);
  const [cardForm, setCardForm] = useState<{
    paymentMethodId: string;
    cutoffDay: string;
    dueDay: string;
    paymentCategoryId: string;
  }>({
    paymentMethodId: "",
    cutoffDay: "20",
    dueDay: "",
    paymentCategoryId: "",
  });
  const [cardSaving, setCardSaving] = useState(false);
  const [cardDrafts, setCardDrafts] = useState<
    Record<string, { cutoffDay: string; dueDay: string; paymentCategoryId: string }>
  >({});
  const [cardSavingId, setCardSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const groupedCategories = useMemo(() => {
    const map: Record<string, Category[]> = {};
    for (const c of categories) {
      const key = c.groupName || "Sin grupo";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [categories]);

  const trackingCategories = useMemo(() => {
    return categories
      .filter((c) => c.kind === "TRACKING")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cats, gs, pms, cards, ms] = await Promise.all([
          getCategories(),
          getCategoryGroups(),
          getPaymentMethods(),
          getCreditCards(),
          getMonths(),
        ]);
        setCategories(cats);
        setGroups(gs);
        setPaymentMethods(pms);
        setCreditCards(cards);
        setMonths(ms);
        if (gs.length > 0 && !form.groupId) {
          setForm((current) => ({ ...current, groupId: gs[0].id }));
        }
        if (pms.length > 0 && !cardForm.paymentMethodId) {
          const used = new Set(cards.map((c) => c.paymentMethodId));
          const firstCredit = pms.find(
            (p) => p.type === "CREDIT" && !used.has(p.id),
          );
          if (firstCredit) {
            setCardForm((current) => ({ ...current, paymentMethodId: firstCredit.id }));
          }
        }
      } catch (e: any) {
        setToast({
          type: "error",
          message: e?.message ?? "No se pudo cargar settings",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Nombre requerido" });
      return;
    }
    if (!form.groupId) {
      setToast({ type: "error", message: "Selecciona un grupo" });
      return;
    }
    setSaving(true);
    try {
      await createCategory({
        name: form.name.trim(),
        groupId: form.groupId,
        kind: form.kind,
      });
      const cats = await getCategories();
      setCategories(cats);
      setForm((current) => ({ ...current, name: "" }));
      setToast({ type: "success", message: "Categoría creada" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo crear categoría",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateGroup() {
    if (!groupForm.name.trim()) {
      setToast({ type: "error", message: "Nombre requerido" });
      return;
    }
    setGroupSaving(true);
    try {
      await createCategoryGroup({ name: groupForm.name.trim() });
      const gs = await getCategoryGroups();
      setGroups(gs);
      if (!form.groupId && gs.length > 0) {
        setForm((current) => ({ ...current, groupId: gs[0].id }));
      }
      setGroupForm({ name: "" });
      setToast({ type: "success", message: "Grupo creado" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo crear grupo",
      });
    } finally {
      setGroupSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
      const cats = await getCategories();
      setCategories(cats);
      setToast({ type: "success", message: "Categoría eliminada" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo eliminar",
      });
    }
  }

  async function handleDeleteGroup(group: CategoryGroup) {
    if (!confirm(`¿Eliminar el grupo "${group.name}"?`)) return;
    try {
      await deleteCategoryGroup(group.id);
      const gs = await getCategoryGroups();
      setGroups(gs);
      const cats = await getCategories();
      setCategories(cats);
      setForm((current) => {
        if (current.groupId !== group.id) return current;
        return { ...current, groupId: gs[0]?.id ?? "" };
      });
      setToast({ type: "success", message: "Grupo eliminado" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo eliminar",
      });
    }
  }

  async function handleCreateMonth() {
    const year = Number(monthForm.year);
    const month = Number(monthForm.month);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setToast({ type: "error", message: "Año inválido" });
      return;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setToast({ type: "error", message: "Mes inválido" });
      return;
    }
    try {
      await createMonth({ year, month });
      const ms = await getMonths();
      setMonths(ms);
      setToast({ type: "success", message: "Mes creado" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo crear el mes",
      });
    }
  }

  async function handleDeleteMonth(monthRow: {
    id: string;
    year: number;
    month: number;
  }) {
    const label = formatMonthName(monthRow.year, monthRow.month);
    if (
      !confirm(
        `¿Eliminar el mes ${label}? Esto borrará ingresos, transacciones y asignaciones.`,
      )
    )
      return;
    try {
      await deleteMonth(monthRow.id);
      const ms = await getMonths();
      setMonths(ms);
      setToast({ type: "success", message: "Mes eliminado" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo eliminar el mes",
      });
    }
  }

  async function refreshPaymentMethods() {
    const pms = await getPaymentMethods();
    setPaymentMethods(pms);
  }

  async function refreshCreditCards() {
    const cards = await getCreditCards();
    setCreditCards(cards);
  }

  async function handleCreatePaymentMethod() {
    if (!pmForm.name.trim()) {
      setToast({ type: "error", message: "Nombre requerido" });
      return;
    }
    const sortOrder = Number(pmForm.sortOrder);
    setPmSaving(true);
    try {
      await createPaymentMethod({
        name: pmForm.name.trim(),
        type: pmForm.type,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      });
      await refreshPaymentMethods();
      setPmForm({ name: "", type: pmForm.type, sortOrder: "0" });
      setToast({ type: "success", message: "Metodo de pago creado" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo crear metodo de pago",
      });
    } finally {
      setPmSaving(false);
    }
  }

  async function handleTogglePaymentMethod(pm: PaymentMethod) {
    try {
      await patchPaymentMethod(pm.id, { isActive: !pm.isActive });
      await refreshPaymentMethods();
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo actualizar metodo",
      });
    }
  }

  async function handleDeletePaymentMethod(pm: PaymentMethod) {
    if (!confirm(`¿Eliminar el metodo "${pm.name}"?`)) return;
    try {
      await deletePaymentMethod(pm.id);
      await refreshPaymentMethods();
      setToast({ type: "success", message: "Metodo eliminado" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo eliminar metodo",
      });
    }
  }

  async function handleCreateCreditCard() {
    const cutoffDay = Number(cardForm.cutoffDay);
    const dueDay = cardForm.dueDay ? Number(cardForm.dueDay) : null;
    if (!cardForm.paymentMethodId) {
      setToast({ type: "error", message: "Selecciona un metodo de credito" });
      return;
    }
    if (!Number.isInteger(cutoffDay) || cutoffDay < 1 || cutoffDay > 31) {
      setToast({ type: "error", message: "Corte invalido (1-31)" });
      return;
    }
    if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
      setToast({ type: "error", message: "Dias despues invalidos (1-31)" });
      return;
    }
    setCardSaving(true);
    try {
      await createCreditCard({
        paymentMethodId: cardForm.paymentMethodId,
        cutoffDay,
        dueDay,
        paymentCategoryId: cardForm.paymentCategoryId || null,
      });
      await refreshCreditCards();
      setCardForm((current) => ({ ...current, cutoffDay: "20", dueDay: "", paymentCategoryId: "" }));
      setToast({ type: "success", message: "Tarjeta creada" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo crear tarjeta",
      });
    } finally {
      setCardSaving(false);
    }
  }

  function updateCardDraft(card: CreditCard, patch: { cutoffDay?: string; dueDay?: string; paymentCategoryId?: string }) {
    setCardDrafts((current) => ({
      ...current,
      [card.id]: {
        cutoffDay: patch.cutoffDay ?? current[card.id]?.cutoffDay ?? String(card.cutoffDay),
        dueDay: patch.dueDay ?? current[card.id]?.dueDay ?? String(card.dueDay ?? ""),
        paymentCategoryId:
          patch.paymentCategoryId ?? current[card.id]?.paymentCategoryId ?? String(card.paymentCategoryId ?? ""),
      },
    }));
  }

  async function handleSaveCreditCard(card: CreditCard) {
    const draft = cardDrafts[card.id];
    if (!draft) return;
    const cutoffDay = Number(draft.cutoffDay);
    const dueDay = draft.dueDay ? Number(draft.dueDay) : null;
    if (!Number.isInteger(cutoffDay) || cutoffDay < 1 || cutoffDay > 31) {
      setToast({ type: "error", message: "Corte invalido (1-31)" });
      return;
    }
    if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
      setToast({ type: "error", message: "Dias despues invalidos (1-31)" });
      return;
    }
    setCardSavingId(card.id);
    try {
      await patchCreditCard(card.id, {
        cutoffDay,
        dueDay,
        paymentCategoryId: draft.paymentCategoryId || null,
      });
      await refreshCreditCards();
      setToast({ type: "success", message: "Tarjeta actualizada" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo actualizar tarjeta",
      });
    } finally {
      setCardSavingId(null);
    }
  }

  async function handleDeleteCreditCard(card: CreditCard) {
    if (!confirm(`¿Eliminar la tarjeta "${card.paymentMethod?.name ?? "Tarjeta"}"?`)) return;
    try {
      await deleteCreditCard(card.id);
      await refreshCreditCards();
      setToast({ type: "success", message: "Tarjeta eliminada" });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "No se pudo eliminar tarjeta",
      });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-600">
            Administra categorías y grupos disponibles.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="text-sm font-medium text-zinc-900">
                  Nuevo grupo
                </div>
                <div className="text-xs text-zinc-600">
                  POST /category-groups
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-600">
                      Nombre
                    </label>
                    <input
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      value={groupForm.name}
                      onChange={(e) =>
                        setGroupForm({ name: e.target.value })
                      }
                      placeholder="Ej. Hogar"
                    />
                  </div>

                  <button
                    className="h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
                    onClick={handleCreateGroup}
                    disabled={groupSaving}
                  >
                    {groupSaving ? "Guardando…" : "Crear grupo"}
                  </button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-sm font-medium text-zinc-900">
                  Nueva categoría
                </div>
                <div className="text-xs text-zinc-600">POST /categories</div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-600">
                      Nombre
                    </label>
                    <input
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      value={form.name}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ej. Supermercado"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-zinc-600">
                      Grupo
                    </label>
                    <select
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      value={form.groupId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          groupId: e.target.value,
                        }))
                      }
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-zinc-600">
                      Tipo
                    </label>
                    <select
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      value={form.kind}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          kind: e.target.value as FormState["kind"],
                        }))
                      }
                    >
                      <option value="EXPENSE">EXPENSE</option>
                      <option value="TRACKING">TRACKING</option>
                    </select>
                  </div>

                  <button
                    className="h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
                    onClick={handleCreate}
                    disabled={saving}
                  >
                    {saving ? "Guardando…" : "Crear categoría"}
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    Categorías por grupo
                  </div>
                  <div className="text-xs text-zinc-600">
                    {loading ? "Cargando…" : `${categories.length} categorías`}
                  </div>
                </div>
                <div className="text-xs text-zinc-600">
                  {groups.length} grupos
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-sm text-zinc-600">Cargando…</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                      >
                        <span>{g.name}</span>
                        {groupDeleteMode ? (
                          <button
                            className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] text-rose-800"
                            onClick={() => handleDeleteGroup(g)}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {Object.entries(groupedCategories).map(
                      ([groupName, items]) => (
                        <div key={groupName}>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {groupName}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {items.map((c) => (
                              <div
                                key={c.id}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-zinc-900">
                                    {c.name}
                                  </span>
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                                    {c.kind}
                                  </span>
                                </div>
                                {deleteMode ? (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      className="h-7 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs text-rose-700 hover:bg-rose-100"
                                      onClick={() => handleDelete(c)}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-8 items-center gap-2 rounded-md bg-rose-600 px-3 text-xs text-white hover:bg-rose-500"
                        onClick={() =>
                          setGroupDeleteMode((current) => !current)
                        }
                        aria-label="Eliminar grupos"
                      >
                        <span>Eliminar grupos</span>
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
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M6 6l1 14h10l1-14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                      <button
                        className="flex h-8 items-center gap-2 rounded-md bg-rose-600 px-3 text-xs text-white hover:bg-rose-500"
                        onClick={() => setDeleteMode((current) => !current)}
                        aria-label="Eliminar categorías"
                      >
                        <span>Eliminar categorías</span>
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
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M6 6l1 14h10l1-14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-zinc-900">
                Nuevo metodo de pago
              </div>
              <div className="text-xs text-zinc-600">POST /payment-methods</div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Nombre
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    value={pmForm.name}
                    onChange={(e) =>
                      setPmForm((current) => ({ ...current, name: e.target.value }))
                    }
                    placeholder="Ej. Debito BBVA"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Tipo
                  </label>
                  <select
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    value={pmForm.type}
                    onChange={(e) =>
                      setPmForm((current) => ({
                        ...current,
                        type: e.target.value as PaymentMethodType,
                      }))
                    }
                  >
                    <option value="CASH">CASH</option>
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Orden
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    inputMode="numeric"
                    value={pmForm.sortOrder}
                    onChange={(e) =>
                      setPmForm((current) => ({ ...current, sortOrder: e.target.value }))
                    }
                  />
                </div>
                <button
                  className="h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
                  onClick={handleCreatePaymentMethod}
                  disabled={pmSaving}
                >
                  {pmSaving ? "Guardando…" : "Crear metodo"}
                </button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    Metodos de pago
                  </div>
                  <div className="text-xs text-zinc-600">
                    {paymentMethods.length} metodos
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {paymentMethods.length === 0 ? (
                <div className="text-sm text-zinc-600">No hay metodos.</div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="text-zinc-900">{pm.name}</div>
                        <div className="text-xs text-zinc-500">
                          {pm.type} · {pm.isActive ? "Activo" : "Inactivo"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 hover:bg-zinc-50"
                          onClick={() => handleTogglePaymentMethod(pm)}
                        >
                          {pm.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="h-8 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs text-rose-700 hover:bg-rose-100"
                          onClick={() => handleDeletePaymentMethod(pm)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-zinc-900">
                Nueva tarjeta de credito
              </div>
              <div className="text-xs text-zinc-600">POST /credit-cards</div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Metodo de pago (CREDIT)
                  </label>
                  <select
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    value={cardForm.paymentMethodId}
                    onChange={(e) =>
                      setCardForm((current) => ({
                        ...current,
                        paymentMethodId: e.target.value,
                      }))
                    }
                  >
                    {(() => {
                      const used = new Set(creditCards.map((c) => c.paymentMethodId));
                      const options = paymentMethods.filter(
                        (pm) => pm.type === "CREDIT" && !used.has(pm.id),
                      );
                      if (options.length === 0) {
                        return <option value="">Sin metodos disponibles</option>;
                      }
                      return options.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Dia de corte
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    inputMode="numeric"
                    value={cardForm.cutoffDay}
                    onChange={(e) =>
                      setCardForm((current) => ({ ...current, cutoffDay: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Dias despues del corte (opcional)
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    inputMode="numeric"
                    value={cardForm.dueDay}
                    onChange={(e) =>
                      setCardForm((current) => ({ ...current, dueDay: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-600">
                    Categoria de pago (TRACKING)
                  </label>
                  <select
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    value={cardForm.paymentCategoryId}
                    onChange={(e) =>
                      setCardForm((current) => ({
                        ...current,
                        paymentCategoryId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Sin categoria</option>
                    {trackingCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
                  onClick={handleCreateCreditCard}
                  disabled={cardSaving}
                >
                  {cardSaving ? "Guardando…" : "Crear tarjeta"}
                </button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    Tarjetas de credito
                  </div>
                  <div className="text-xs text-zinc-600">
                    {creditCards.length} tarjetas
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {creditCards.length === 0 ? (
                <div className="text-sm text-zinc-600">No hay tarjetas.</div>
              ) : (
                <div className="space-y-3">
                  {creditCards.map((card) => {
                    const draft = cardDrafts[card.id];
                    const cutoffDay = draft?.cutoffDay ?? String(card.cutoffDay);
                    const dueDay = draft?.dueDay ?? String(card.dueDay ?? "");
                    const paymentCategoryId =
                      draft?.paymentCategoryId ?? String(card.paymentCategoryId ?? "");
                    return (
                      <div
                        key={card.id}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-zinc-900">
                            {card.paymentMethod?.name ?? "Tarjeta"}
                          </div>
                          <button
                            className="h-8 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs text-rose-700 hover:bg-rose-100"
                            onClick={() => handleDeleteCreditCard(card)}
                          >
                            Eliminar
                          </button>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs text-zinc-600">
                              Corte
                            </label>
                            <input
                              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200"
                              inputMode="numeric"
                              value={cutoffDay}
                              onChange={(e) =>
                                updateCardDraft(card, { cutoffDay: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-600">
                              Dias despues
                            </label>
                            <input
                              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200"
                              inputMode="numeric"
                              value={dueDay}
                              onChange={(e) =>
                                updateCardDraft(card, { dueDay: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-600">
                              Categoria pago
                            </label>
                            <select
                              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200"
                              value={paymentCategoryId}
                              onChange={(e) =>
                                updateCardDraft(card, {
                                  paymentCategoryId: e.target.value,
                                })
                              }
                            >
                              <option value="">Sin categoria</option>
                              {trackingCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            className="h-8 rounded-md bg-zinc-900 px-3 text-xs text-white hover:bg-zinc-800 disabled:opacity-60"
                            onClick={() => handleSaveCreditCard(card)}
                            disabled={cardSavingId === card.id}
                          >
                            {cardSavingId === card.id ? "Guardando…" : "Guardar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    Meses
                  </div>
                  <div className="text-xs text-zinc-600">
                    Crear y eliminar meses completos
                  </div>
                </div>
                <div className="text-xs text-zinc-600">
                  {months.length} meses
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-600">
                      Año
                    </label>
                    <input
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      inputMode="numeric"
                      value={monthForm.year}
                      onChange={(e) =>
                        setMonthForm((current) => ({
                          ...current,
                          year: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-600">
                      Mes
                    </label>
                    <input
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      inputMode="numeric"
                      value={monthForm.month}
                      onChange={(e) =>
                        setMonthForm((current) => ({
                          ...current,
                          month: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <button
                    className="h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800"
                    onClick={handleCreateMonth}
                  >
                    Crear mes
                  </button>
                </div>

                <div className="space-y-2">
                  {months.length === 0 ? (
                    <div className="text-sm text-zinc-600">
                      No hay meses creados.
                    </div>
                  ) : (
                    months.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                      >
                        <div className="text-zinc-900">
                          {formatMonthName(m.year, m.month)}
                        </div>
                        <button
                          className="h-8 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs text-rose-700 hover:bg-rose-100"
                          onClick={() => handleDeleteMonth(m)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
