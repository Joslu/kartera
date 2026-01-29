import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import InboxUnidentified from "./pages/inbox/InboxUnidentified";
import MonthTransactions from "./pages/transactions/MonthTransactions";
import MonthBudgets from "./pages/budgets/MonthBudgets";
import Settings from "./pages/settings/Settings";
import MonthSummary from "./pages/summary/MonthSummary";
import AboutPage from "./pages/about/AboutPage";
import CreditCards from "./pages/cards/CreditCards";

export default function App() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-sm ${
      isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
    }`;

  return (
    <div>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <NavLink className={tabClass} to="/inbox">
              Inbox
            </NavLink>
            <NavLink className={tabClass} to="/summary">
              Resumen
            </NavLink>
            <NavLink className={tabClass} to="/budgets">
              Presupuesto
            </NavLink>
            <NavLink className={tabClass} to="/transactions">
              Transacciones
            </NavLink>
            <NavLink className={tabClass} to="/cards">
              Tarjetas
            </NavLink>
            <NavLink className={tabClass} to="/settings">
              Settings
            </NavLink>
            <NavLink className={tabClass} to="/about">
              About
            </NavLink>
          </div>
          <div className="text-sm font-semibold text-zinc-900">Kartera</div>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="/inbox" element={<InboxUnidentified />} />
        <Route path="/summary" element={<MonthSummary />} />
        <Route path="/transactions" element={<MonthTransactions />} />
        <Route path="/cards" element={<CreditCards />} />
        <Route path="/budgets" element={<MonthBudgets />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </div>
  );
}
