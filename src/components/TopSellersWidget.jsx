// src/components/TopSellers.jsx
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { apiGet } from '../lib/api'
import { itemsArray } from '../lib/apiUtils'

const COLORS = [
  '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#a855f7',
  '#0ea5e9', '#10b981', '#f97316', '#e11d48', '#64748b'
]

function prettyPct(n) {
  if (!isFinite(n)) return '0%'
  if (n === 0) return '0%'
  return (Math.round(n * 10) / 10).toFixed(n < 10 ? 1 : 0) + '%'
}

export default function TopSellers() {
  const [rows, setRows]   = useState([])
  const [loading, setLoad] = useState(true)
  const [err, setErr]      = useState(null)

  useEffect(() => {
    let alive = true
    setLoad(true); setErr(null)
    apiGet('/top-sellers')
      .then(d => {
        if (!d || d.ok === false) throw new Error(d?.error || 'server_error')
        if (alive) setRows(itemsArray(d))
      })
      .catch(e => alive && setErr(e.message || String(e)))
      .finally(() => alive && setLoad(false))
    return () => { alive = false }
  }, [])

  const { data, total } = useMemo(() => {
    const items = rows.map((r, i) => ({
      name: r.label || r.agent_name || r.name || r.agent || `#${i+1}`,
      value: Number(
        r.value ?? r.total ?? r.count ?? r.amount ?? r.totale ?? 0
      ),
      color: COLORS[i % COLORS.length]
    }))
    return {
      data: items,
      total: items.reduce((s, x) => s + (x.value || 0), 0)
    }
  }, [rows])

  return (
    <div className="card border-slate-200 bg-white p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Top Sellers del mese
          </h2>
          <p className="text-sm text-slate-600">
            Distribuzione aggiornata dei migliori venditori Davveroo.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
          Totale {total}
        </span>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-slate-500">Caricamento dei dati…</p>
      )}
      {err && (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 break-all">
          Errore: {err}
        </p>
      )}

      {!loading && !err && data.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          Nessun dato disponibile per questo mese. Aggiungi voci dalla sezione
          admin per popolare il grafico.
        </p>
      )}

      {!loading && !err && data.length > 0 && (
        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          {/* Chart */}
          <div className="relative h-72 rounded-3xl border border-slate-200 bg-blue-50 p-4 shadow-inner shadow-blue-100">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={3}
                  isAnimationActive={false}
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, p) => [`${v}`, p?.payload?.name]}
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.4)",
                    color: "#0f172a",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/70 via-transparent to-transparent" />
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {data.map((x, i) => {
              const pct = total > 0 ? (x.value * 100) / total : 0
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: x.color }}
                        aria-hidden
                      />
                      <span className="font-medium">{x.name}</span>
                    </div>
                    <div className="text-sm tabular-nums text-slate-700">
                      <span className="mr-3">{x.value}</span>
                      <span className="text-slate-500">{prettyPct(pct)}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(100, pct))}%`,
                        background: x.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="pt-2 text-sm text-slate-500">
              Totale:{" "}
              <span className="font-medium text-slate-900 tabular-nums">
                {total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
