import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
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
  // 1) token: querystring > localStorage
  const [params] = useSearchParams();
  const qsToken = (params.get("token") || "").trim();
  const [token, setToken] = useState(qsToken || getAdminToken());

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Se arriva da query, persistilo una volta
  useEffect(() => {
    if (qsToken && qsToken !== getAdminToken()) setAdminToken(qsToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsToken]);

  // fetch iniziale (non serve token per GET pubblica; se un domani la proteggi, aggiungi header qui)
  useEffect(() => {
    setLoading(true);
    setErr(null);
    apiGet("/api/top-sellers")
      .then((d) => setItems(d.items || []))
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
      // salvo token per le prossime volte
      setAdminToken(token);
      await apiPost(
        "/api/top-sellers",
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

  // ===== Gate molto semplice =====
  if (!token) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-3">Top Sellers – Admin</h1>
          <p className="text-sm text-gray-600 mb-4">
            Inserisci il token amministratore per accedere.
          </p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              name="token"
              type="password"
              className="input w-full"
              placeholder="Token (es. Expo2026@@)"
              autoFocus
              required
            />
            <button className="btn primary w-full" type="submit">
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Top Sellers – Admin</h1>
        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm">Mese</label>
          <input
            className="input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button className="btn" onClick={addRow}>
            + Aggiungi riga
          </button>
          <button className="btn primary" onClick={save}>
            Salva
          </button>
        </div>

        {loading && <p>Caricamento…</p>}
        {err && <p className="text-red-600 break-all">{err}</p>}

        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Voce</th>
                <th className="th" style={{ width: 140 }}>
                  Valore
                </th>
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
                  <td className="td" colSpan={2}>
                    Nessun dato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Anteprima (percentuali)</h2>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                innerRadius={60}
                outerRadius={100}
                label
              >
                {items.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n, p) => [v, p?.payload?.label || "Valore"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500">Totale: {total}</p>
      </div>
    </div>
  );
}
