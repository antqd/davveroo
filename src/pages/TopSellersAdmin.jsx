import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import { itemsArray } from "../lib/apiUtils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from "../lib/adminAuth";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#0ea5e9",
  "#10b981",
];

export default function TopSellersAdmin() {
  const [params] = useSearchParams();
  const qsToken = (params.get("token") || "").trim();
  const [token, setToken] = useState(qsToken || getAdminToken());

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (qsToken && qsToken !== getAdminToken()) setAdminToken(qsToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsToken]);

  // 👇 QUI: path SENZA "/api"
  useEffect(() => {
    setLoading(true);
    setErr(null);
    apiGet("/top-sellers")
      .then((d) => setItems(itemsArray(d)))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.value || 0), 0),
    [items]
  );

  function addRow() {
    setItems((p) => [...p, { label: "", value: 0 }]);
  }
  function update(i, key, val) {
    const copy = [...items];
    copy[i] = { ...copy[i], [key]: key === "value" ? Number(val) : val };
    setItems(copy);
  }

  async function save() {
    setErr(null);
    try {
      if (!token) throw new Error("Token mancante");
      setAdminToken(token);
      // 👇 QUI: path SENZA "/api"
      await apiPost(
        "/top-sellers",
        { items, month },
        { "x-admin-token": token }
      );
      alert("Salvato!");
    } catch (e) {
      setErr(e.message);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const t =
      new FormData(e.currentTarget).get("token")?.toString().trim() || "";
    setToken(t);
    setAdminToken(t);
  }

  function handleLogout() {
    clearAdminToken();
    setToken("");
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card border-slate-200 bg-white p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-500/80">
            Accesso protetto
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Top Sellers – Admin
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Inserisci il token amministratore per gestire la classifica mensile
            dei migliori venditori.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              name="token"
              type="password"
              className="input w-full"
              placeholder="Token (es. Expo2026@@)"
              autoFocus
              required
            />
            <button
              className="btn btn-primary w-full justify-center"
              type="submit"
            >
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="card border-slate-200 bg-gradient-to-br from-white via-amber-50/40 to-white p-8 shadow-xl shadow-amber-100/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 text-slate-700">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-500/80">
              Top Sellers – Admin
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Dati leadership mensile
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Aggiorna le performance dei migliori venditori, condividi il
              ranking con il team e monitora il totale dei valori generati.
            </p>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Voci {items.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Totale {total || 0}
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-white/90 px-6 py-6 text-right shadow-inner shadow-amber-100">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Mese in lavorazione
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-900 tabular-nums">
              {month}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Ricorda: il token admin resta salvato localmente per accessi
              rapidi.
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Gestione classifica
            </h2>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Modifica le voci e salva per aggiornare la dashboard pubblica
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button className="btn btn-ghost" onClick={addRow}>
              + Aggiungi riga
            </button>
            <button className="btn btn-primary" onClick={save}>
              Salva
            </button>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          {loading && (
            <p className="text-sm text-slate-500">Caricamento dei dati…</p>
          )}
          {err && (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 break-all">
              Errore: {err}
            </p>
          )}
          <div className="mt-4 overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Voce</th>
                  <th className="th">Valore</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="td">
                      <input
                        className="input w-full"
                        value={it.label}
                        onChange={(e) => update(i, "label", e.target.value)}
                        placeholder="Es. Team Nord"
                      />
                    </td>
                    <td className="td">
                      <input
                        className="input w-32"
                        type="number"
                        min="0"
                        value={it.value}
                        onChange={(e) => update(i, "value", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td className="td text-center text-slate-500" colSpan={2}>
                      Nessun dato. Aggiungi almeno una riga per iniziare.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Anteprima percentuale
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Visualizza l&apos;impatto di ciascun venditore sul totale corrente.
        </p>
        <div className="mt-6 w-full" style={{ height: 340 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                label
              >
                {items.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n, p) => [v, p?.payload?.label || "Valore"]}
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.4)",
                  color: "#0f172a",
                }}
              />
              <Legend wrapperStyle={{ color: "#475569" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Totale valori registrati:{" "}
          <span className="font-semibold text-slate-900">{total}</span>
        </p>
      </div>
    </div>
  );
}
