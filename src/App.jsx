import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, isLoggedIn, clearAuth } from "./lib/auth";
import { ToastProvider } from "./components/Toast";

const navClasses = ({ isActive }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");

export default function App() {
  const hasTopSellers = !!localStorage.getItem("ts_token");
  const nav = useNavigate();
  const logged = isLoggedIn();
  const user = getUser();
  const roles = user?.roles || [];

  function out() {
    clearAuth();
    nav("/login", { replace: true });
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
            <span className="font-semibold text-slate-900">Davveroo</span>
            <nav className="ml-auto flex gap-2 items-center">
              {!logged && (
                <>
                  <NavLink className={navClasses} to="/login">
                    Login
                  </NavLink>
                  <NavLink className={navClasses} to="/register">
                    Registrati
                  </NavLink>
                </>
              )}
              {logged && (
                <>
                  {(roles.includes("admin") || roles.includes("seller")) && (
                    <NavLink className={navClasses} to="/dashboard">
                      Dashboard
                    </NavLink>
                  )}
                  <NavLink className={navClasses} to="/account">
                    Account
                  </NavLink>
                  {roles.includes("admin") && (
                    <>
                      <NavLink className={navClasses} to="/admin">
                        Admin
                      </NavLink>
                      <NavLink className={navClasses} to="/topsellersadmin">
                        Top Sellers admin
                      </NavLink>
                    </>
                  )}
                  {hasTopSellers && (
                    <NavLink className={navClasses} to="/top-sellers-admin">
                      Top Sellers
                    </NavLink>
                  )}
                  <button onClick={out} className={navClasses}>
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
