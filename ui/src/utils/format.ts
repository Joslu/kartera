export function money(value: unknown) {
  const n =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(value: unknown) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00`);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const dateOnly = raw.slice(0, 10);
    const d = new Date(`${dateOnly}T00:00:00`);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatMonthName(year: number, month: number) {
  const d = new Date(year, month - 1, 1); // backend 1-12
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(d);
}
