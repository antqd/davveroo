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
    app.get(
      "/dashboard",
      requireAuth,
      requireRoles(["seller", "admin"]),
      async function (req, res) {
        try {
          const actor = await resolveActor(req);

          // filtro opzionale admin
          let where = "1=1";
          const params = [];

          if (actor.isSeller) {
            // clienti assegnati al mio agente
            where = "c.agent_id = ?";
            params.push(actor.agentId || -1);
          } else if (actor.isAdmin) {
            const agentId = req.query.agent_id
              ? Number(req.query.agent_id)
              : null;
            if (agentId) {
              where = "c.agent_id = ?";
              params.push(agentId);
            }
          }

          const sql =
            "SELECT c.id, c.full_name AS cliente, " +
            "       rb.full_name AS registrato_da, " +
            "       a.display_name AS agente_in_carica, " +
            "       (SELECT GROUP_CONCAT(DISTINCT p2.name ORDER BY p2.name SEPARATOR ', ') " +
            "          FROM purchases pu2 " +
            "          JOIN products p2 ON p2.id = pu2.product_id " +
            "         WHERE pu2.customer_id = c.id AND pu2.status='active') AS prodotti_acquistati, " +
            "       (SELECT COUNT(*) FROM referrals r WHERE r.referrer_customer_id = c.id) AS amici_aggiunti, " +
            "       ROUND((SELECT IFNULL(SUM(r.promised_credit_cents),0) FROM referrals r WHERE r.referrer_customer_id = c.id AND r.status='unlocked')/100, 2) AS credito " +
            "FROM customers c " +
            "LEFT JOIN customers rb ON rb.id = c.registered_by_customer_id " +
            "LEFT JOIN agents a ON a.id = c.agent_id " +
            "WHERE " +
            where +
            " " +
            "ORDER BY c.created_at DESC LIMIT 200";

          const rows = await query(sql, params);
          res.json({ ok: true, items: rows });
        } catch (e) {
          res
            .status(500)
            .json({ ok: false, error: "server_error", message: e.message });
        }
      }
    );
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
