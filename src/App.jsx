import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, isLoggedIn, clearAuth } from "./lib/auth";
import { ToastProvider } from "./components/Toast";

const navClasses = ({ isActive }) =>
  [
    "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
    isActive
      ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 text-white shadow-lg shadow-blue-200/60"
      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600",
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
      <div className="relative min-h-screen overflow-hidden text-slate-900">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-32 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute -bottom-44 right-1/4 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-md">
            <div className="container flex h-16 items-center gap-6">
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-wide text-slate-900">
                  Davveroo
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-blue-500/70">
                  Referral Excellence Program
                </span>
              </div>

              <nav className="ml-auto flex items-center gap-2">
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
                    <button
                      onClick={out}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-600"
                    >
                      Logout
                    </button>
                  </>
                )}
              </nav>
            </div>
          </header>

          <main className="container flex-1 py-12">
            <Outlet />
          </main>

          <footer className="border-t border-white/60 bg-white/80 py-6 backdrop-blur-md">
            <div className="container flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
              <p>
                © {new Date().getFullYear()} Davveroo. Cresci con la forza delle
                relazioni autentiche.
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Backend sincronizzato su davveroo_clean
              </p>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
