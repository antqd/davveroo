import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import TopSellersWidget from "../components/TopSellersWidget";

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    apiGet("/dashboard")
      .then((d) => {
        if (!alive) return;
        const items = Array.isArray(d?.items) ? d.items : [];
        setRows(items);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Errore di caricamento");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Agente</h1>

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
                {!rows.length && (
                  <tr>
                    <td className="td" colSpan={6}>
                      Nessun dato disponibile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">Top Sellers del mese</h2>
      <div className="card mb-6">
        <TopSellersWidget />
      </div>

      <p className="text-sm text-gray-500">
        *Qui l’agente vede clienti, amici aggiunti e credito generato.
      </p>
    </div>
  );
}
