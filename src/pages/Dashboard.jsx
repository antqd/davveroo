import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---------- Widget Top Seller ----------
function TopSellersCard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    apiGet("/api/top-sellers")
      .then((d) => setData(d))
      .catch((e) => setErr(e.message));
  }, []);

  if (err || !data || !data.items?.length) return null;

  const chartData = data.items.map((i) => ({
    name: `${i.name} (${i.pct}%)`,
    value: i.value,
  }));

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Top seller {data.month_key}</h2>
        <span className="text-sm text-gray-500">Totale: {data.total}</span>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius="90%"
            >
              {chartData.map((_, i) => (
                <Cell key={i} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- Dashboard Agente ----------
export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    apiGet("/api/dashboard")
      .then((d) => setRows(d.items || []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Agente</h1>

      {/* Widget Top Seller */}
      <TopSellersCard />

      <div className="card">
        {loading && <p>Caricamento…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Cliente</th>
                  <th className="th">Registrato da</th>
                  <th className="th">Agente</th>
                  <th className="th">Prodotti acquistati</th>
                  <th className="th">Amici aggiunti</th>
                  <th className="th">Credito (€)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="td">{r.cliente}</td>
                    <td className="td">{r.registrato_da ?? "-"}</td>
                    <td className="td">{r.agente_in_carica ?? "-"}</td>
                    <td className="td">{r.prodotti_acquistati ?? "-"}</td>
                    <td className="td">{r.amici_aggiunti}</td>
                    <td className="td">
                      {typeof r.credito === "number"
                        ? r.credito.toFixed(2)
                        : r.credito ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        *Qui l’agente vede clienti, amici aggiunti e credito generato.
      </p>
    </div>
  );
}
