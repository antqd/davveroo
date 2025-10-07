import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";
import { itemsArray } from "../lib/apiUtils";
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
        setRows(itemsArray(d));
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

  function reload() {
    setLoading(true);
    setErr(null);
    apiGet("/dashboard")
      .then((d) => setRows(itemsArray(d)))
      .catch((e) => setErr(e?.message || "Errore di caricamento"))
      .finally(() => setLoading(false));
  }

  const stats = useMemo(() => {
    const products = new Set();
    let totalFriends = 0;
    let totalCredit = 0;
    rows.forEach((r) => {
      totalFriends += Number(r.amici_aggiunti || 0);
      const creditValue =
        typeof r.credito === "number"
          ? r.credito
          : Number.parseFloat(r.credito) || 0;
      totalCredit += creditValue;
      String(r.prodotti_acquistati || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((name) => products.add(name));
    });
    return {
      totalCustomers: rows.length,
      totalFriends,
      totalCredit,
      productCount: products.size,
    };
  }, [rows]);

  const totalCreditDisplay = Number.isFinite(stats.totalCredit)
    ? stats.totalCredit.toFixed(2)
    : "0.00";

  return (
    <div className="space-y-10">
      <div className="card border-slate-200 bg-gradient-to-br from-white via-sky-50/40 to-white p-8 shadow-xl shadow-sky-100/40">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4 text-slate-700">
            <p className="text-xs uppercase tracking-[0.4em] text-sky-500/80">
              Dashboard agente
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Performance referral in tempo reale
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Analizza i clienti che stai seguendo, monitora gli amici portati
              a bordo e controlla subito il credito generato dal programma
              Davveroo.
            </p>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Clienti {stats.totalCustomers}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Amici {stats.totalFriends}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Prodotti {stats.productCount}
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Credito medio
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">
                {stats.totalCustomers
                  ? `${(stats.totalCredit / stats.totalCustomers).toFixed(2)} €`
                  : "0.00 €"}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-500">
                Credito totale
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {totalCreditDisplay} €
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                Amici coinvolti
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {stats.totalFriends}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Clienti in gestione
            </h2>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Ultimo aggiornamento in tempo reale
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={reload}
              disabled={loading}
            >
              Aggiorna
            </button>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          {loading && (
            <p className="text-sm text-slate-500">Caricamento dei dati…</p>
          )}
          {err && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Errore: {err}
            </p>
          )}
          {!loading && !err && (
            <div className="overflow-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Cliente</th>
                    <th className="th">Registrato da</th>
                    <th className="th">Agente</th>
                    <th className="th">Prodotti</th>
                    <th className="th">Amici</th>
                    <th className="th">Credito (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td">{r.cliente}</td>
                      <td className="td">{r.registrato_da ?? "-"}</td>
                      <td className="td">{r.agente_in_carica ?? "-"}</td>
                      <td className="td">
                        {r.prodotti_acquistati ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-wide text-slate-600 shadow-sm">
                            {r.prodotti_acquistati}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="td tabular-nums">
                        {r.amici_aggiunti ?? 0}
                      </td>
                      <td className="td tabular-nums">
                        {typeof r.credito === "number"
                          ? r.credito.toFixed(2)
                          : (Number.parseFloat(r.credito) || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td className="td text-center text-slate-500" colSpan={6}>
                        Nessun dato disponibile. Aggiungi nuovi clienti o
                        aggiorna i referral per vedere qui i risultati.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Top Sellers del mese
        </h2>
        <TopSellersWidget />
      </div>
    </div>
  );
}
