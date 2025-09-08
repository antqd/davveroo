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
import TopSellersWidget from "../components/TopSellersWidget";

// ...

// ---------- Widget Top Seller ----------
function TopSellersCard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    apiGet("/top-sellers")
      .then((d) => setData(d))
      .catch((e) => setErr(e.message));
  }, []);

  if (err || !data || !data.items?.length) return null;

  const chartData = data.items.map((i) => ({
    name: `${i.name} (${i.pct}%)`,
    value: i.value,
  }));
}

// ---------- Dashboard Agente ----------
export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    apiGet("/dashboard")
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
      <h2 className="text-xl font-semibold mb-2">Top Sellers del mese</h2>
      <div className="card mb-6">
        <TopSellersWidget />
      </div>
    </div>
  );
}
