import { formatMonthName } from "../../utils/format";

export type UISummary = {
  income: number;
  expenses: number;
  net: number;
  unidentifiedSpent: number;
  monthLabel: string;
};

export function mapSummaryToUI(s: any): UISummary {
  const income = Number(s?.totals?.income ?? 0);
  const expenses = Number(s?.totals?.spentExpense ?? 0);
  const net = income - expenses;

  const noIdent = (s?.categories ?? []).find(
    (c: any) => String(c?.categoryName ?? "").toLowerCase() === "no identificado"
  );
  const unidentifiedSpent = Number(noIdent?.spent ?? 0);

  const monthLabel = s?.month
    ? formatMonthName(Number(s.month.year), Number(s.month.month))
    : "";

  return { income, expenses, net, unidentifiedSpent, monthLabel };
}
