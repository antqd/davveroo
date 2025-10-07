import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { apiAuth } from "../lib/api";
import { setToken, setUser } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState({
    customer: true,
    seller: false,
    admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function toggle(r) {
    setRoles((v) => ({ ...v, [r]: !v[r] }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const selected = Object.entries(roles)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await apiAuth.login(email, password, selected);
      if (!res?.token || !res?.user) throw new Error("login_failed");
      setToken(res.token);
      setUser(res.user);
      const redirect =
        state?.from ||
        (res.user.roles.includes("admin") || res.user.roles.includes("seller")
          ? "/dashboard"
          : "/account");
      nav(redirect, { replace: true });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl gap-8 md:grid md:grid-cols-[1.1fr_0.9fr] md:items-center">
      <div className="space-y-6 text-slate-600">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-500/80">
          Bentornato
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900">
          Accedi al quartier generale delle relazioni Davveroo
        </h1>
        <p className="text-slate-600">
          Monitora clienti, referral e performance in un’unica piattaforma.
          Scegli i ruoli che ti rappresentano e rientra subito nell’azione.
        </p>
        <ul className="grid gap-3 text-sm text-slate-600/90">
          <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-lg text-blue-500">⚡</span>
            Accesso rapido a dashboard e credito clienti.
          </li>
          <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-lg text-blue-500">🤝</span>
            Condividi ruoli e responsabilità in team misti admin/seller.
          </li>
          <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-lg text-blue-500">🔐</span>
            Sicurezza avanzata con token personalizzati per gli amministratori.
          </li>
        </ul>
      </div>

      <div className="mt-10 md:mt-0">
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Accedi</h2>
          <p className="mt-2 text-sm text-slate-600">
            Inserisci le tue credenziali ed entra nel tuo spazio operativo.
          </p>
          {err && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 break-all">
              {err}
            </p>
          )}
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Seleziona i tuoi ruoli
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm hover:border-blue-300 hover:text-blue-600">
                  <input
                    type="checkbox"
                    checked={roles.customer}
                    onChange={() => toggle("customer")}
                  />
                  Cliente
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm hover:border-blue-300 hover:text-blue-600">
                  <input
                    type="checkbox"
                    checked={roles.seller}
                    onChange={() => toggle("seller")}
                  />
                  Agente/Venditore
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm hover:border-blue-300 hover:text-blue-600">
                  <input
                    type="checkbox"
                    checked={roles.admin}
                    onChange={() => toggle("admin")}
                  />
                  Admin
                </label>
              </div>
            </div>
            <button
              className="btn btn-primary w-full justify-center"
              type="submit"
              disabled={loading}
            >
              {loading ? "Accesso…" : "Entra"}
            </button>
          </form>
          <div className="mt-6 text-sm text-slate-600">
            Non hai un account?{" "}
            <Link to="/register" className="font-semibold text-blue-600">
              Registrati
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
