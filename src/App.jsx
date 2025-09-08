import { NavLink, Outlet } from "react-router-dom";

const navClasses = ({ isActive }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");

export default function App() {
  const hasTopSellers = !!localStorage.getItem("ts_token");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <span className="font-semibold text-slate-900">Davveroo</span>
          <nav className="ml-auto flex gap-2">
            <NavLink className={navClasses} to="/dashboard">Dashboard Agente</NavLink>
            <NavLink className={navClasses} to="/admin">Admin</NavLink>
            <NavLink className={navClasses} to="/account">Account Cliente</NavLink>
            {hasTopSellers && (
              <NavLink className={navClasses} to="/top-sellers-admin">
                Top Sellers
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
