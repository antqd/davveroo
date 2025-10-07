import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiAuth } from "../lib/api";
import { setToken, setUser } from "../lib/auth";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
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
      const res = await apiAuth.register({
        name,
        email,
        password,
        roles: selected,
      });
      if (!res?.token || !res?.user) throw new Error("register_failed");
      setToken(res.token);
      setUser(res.user);
      const next =
        res.user.roles.includes("admin") || res.user.roles.includes("seller")
          ? "/dashboard"
          : "/account";
      nav(next, { replace: true });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl gap-10 md:grid md:grid-cols-[0.95fr_1.05fr] md:items-center">
      <div className="order-last mt-10 space-y-4 text-slate-600 md:order-first md:mt-0">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-500/80">
          Nuovo in Davveroo?
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900">
          Costruisci relazioni che generano vero valore
        </h1>
        <p className="text-slate-600">
          Registrati in pochi istanti, scegli i ruoli che ricopri e dai il via
          al tuo network di referral. Ogni amico invitato porta valore
          condiviso.
        </p>
        <div className="grid gap-3 text-sm text-slate-600/90">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-lg text-blue-500">🎯</span>
            Personalizza l’esperienza in base al tuo ruolo operativo.
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-lg text-blue-500">📈</span>
            Traccia referral, credito e performance in tempo reale.
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-lg text-blue-500">💡</span>
            Attiva i Top Sellers con strumenti dedicati al tuo team.
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Crea il tuo account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Completa i dati e accedi subito al mondo Davveroo.
        </p>
        {err && (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 break-all">
            {err}
          </p>
        )}
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input
            className="input"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Scegli i ruoli che ti rappresentano
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
            {loading ? "Registrazione…" : "Crea account"}
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-600">
          Hai già un account?{" "}
          <Link to="/login" className="font-semibold text-blue-600">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}
