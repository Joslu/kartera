import { formatMonthName } from "../../utils/format";

export function MonthSelect({
  monthId,
  months,
  onChange,
  disabled,
}: {
  monthId: string;
  months: Array<{ id: string; year: number; month: number }>;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-[220px]">
      <div className="mb-1 text-xs text-zinc-600">Mes</div>
      <select
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
        value={monthId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {months.map((m) => (
          <option key={m.id} value={m.id}>
            {formatMonthName(m.year, m.month)}
          </option>
        ))}
      </select>
    </div>
  );
}
