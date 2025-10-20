import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiAuth, apiBusinesses } from "../lib/api";
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
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const wantsSeller = roles.seller;
  const LOYALTY_ERR_KEY = "davveroo_loyalty_setup_err";

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
      const wantsBiz = selected.includes("seller");
      const res = await apiAuth.register({
        name,
        email,
        password,
        roles: selected,
      });
      if (!res?.token || !res?.user) throw new Error("register_failed");
      setToken(res.token);
      setUser(res.user);

      if (wantsBiz && businessName.trim()) {
        try {
          await apiBusinesses.save({
            name: businessName.trim(),
            contact_email:
              businessEmail && businessEmail.trim()
                ? businessEmail.trim()
                : undefined,
            contact_phone:
              businessPhone && businessPhone.trim()
                ? businessPhone.trim()
                : undefined,
            description:
              businessDescription && businessDescription.trim()
                ? businessDescription.trim()
                : undefined,
          });
          try {
            localStorage.removeItem(LOYALTY_ERR_KEY);
          } catch (_storageErr) {}
        } catch (bizErr) {
          console.error("business_setup_failed", bizErr);
          try {
            localStorage.setItem(
              LOYALTY_ERR_KEY,
              bizErr?.message || "Impossibile configurare l'attività"
            );
          } catch (_storageErr) {}
        }
      }

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
          {wantsSeller && (
            <div className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-700">
              <div>
                <h3 className="text-sm font-semibold text-blue-700">
                  Dettagli della tua attività
                </h3>
                <p className="text-xs text-blue-600/80">
                  Queste informazioni alimentano la dashboard crediti dedicata
                  ai tuoi clienti.
                </p>
              </div>
              <input
                className="input"
                placeholder="Nome attività"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required={wantsSeller}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  type="email"
                  placeholder="Email attività (opzionale)"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Telefono attività (opzionale)"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>
              <textarea
                className="input min-h-[100px]"
                placeholder="Descrizione o regole del programma fedeltà (opzionale)"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
              />
            </div>
          )}
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
