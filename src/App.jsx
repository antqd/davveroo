import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import TopSellersAdmin from "./pages/TopSellersAdmin";

// helper: classi dei link con stato attivo
const navClasses = ({ isActive }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-700 hover:bg-slate-100",
  ].join(" ");

// guard: controlla il token in query (?token=...) o salvato in localStorage
function TokenGate({ children }) {
  const { search } = useLocation();
  const qs = new URLSearchParams(search);

  const required = import.meta.env.VITE_TOP_SELLERS_TOKEN || "davveroo"; // fallback semplice
  const inQuery = qs.get("token");
  const cached = localStorage.getItem("ts_token");

  // se arriva in query e valido, salvalo
  if (inQuery && inQuery === required) {
    localStorage.setItem("ts_token", inQuery);
  }

  const ok = (inQuery && inQuery === required) || (cached && cached === required);

  if (!ok) return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header / nav */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <span className="font-semibold text-slate-900">Davveroo</span>
          <nav className="ml-auto flex gap-2">
            <NavLink className={navClasses} to="/dashboard">
              Dashboard Agente
            </NavLink>
            <NavLink className={navClasses} to="/admin">
              Admin
            </NavLink>
            <NavLink className={navClasses} to="/account">
              Account Cliente
            </NavLink>
            {/* opzionale: mostra il link solo se già autenticato */}
            {localStorage.getItem("ts_token") && (
              <NavLink className={navClasses} to="/top-sellers-admin">
                Top Sellers
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* routes */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />

          {/* pagina protetta via token (?token=...) */}
          <Route
            path="/top-sellers-admin"
            element={
              <TokenGate>
                <TopSellersAdmin />
              </TokenGate>
            }
          />
          {/* >>> ALTRA ROTTA alias, punta alla stessa pagina */}
          <Route
            path="/topsellersadmin"
            element={
              <TokenGate>
                <TopSellersAdmin />
              </TokenGate>
            }
          />

          {/* catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
