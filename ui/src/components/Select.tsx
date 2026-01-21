import type { ReactNode } from "react";

export function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}
