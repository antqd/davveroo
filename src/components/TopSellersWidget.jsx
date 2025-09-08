// src/components/TopSellers.jsx
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { apiGet } from '../lib/api'

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
        if (alive) setRows(Array.isArray(d.items) ? d.items : [])
      })
      .catch(e => alive && setErr(e.message || String(e)))
      .finally(() => alive && setLoad(false))
    return () => { alive = false }
  }, [])

  const { data, total } = useMemo(() => {
    const items = rows.map((r, i) => ({
      name: r.label || r.agent_name || `#${i+1}`,
      value: Number(r.value || 0),
      color: COLORS[i % COLORS.length]
    }))
    return {
      data: items,
      total: items.reduce((s, x) => s + (x.value || 0), 0)
    }
  }, [rows])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Top Sellers del mese</h2>
      </div>

      {loading && <p>Caricamento…</p>}
      {err && (
        <p className="text-red-600 text-sm break-all">
          Errore: {err}
        </p>
      )}

      {!loading && !err && data.length === 0 && (
        <p className="text-sm text-gray-500">Nessun dato disponibile per questo mese.</p>
      )}

      {!loading && !err && data.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, p) => [`${v}`, p?.payload?.name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute -mt-40 ml-6 md:hidden text-sm text-gray-600">
              {/* spazio mobile per non coprire */}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {data.map((x, i) => {
              const pct = total > 0 ? (x.value * 100) / total : 0
              return (
                <div key={i} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded"
                      style={{ backgroundColor: x.color }}
                      aria-hidden
                    />
                    <span className="font-medium">{x.name}</span>
                  </div>
                  <div className="text-sm tabular-nums text-gray-700">
                    <span className="mr-3">{x.value}</span>
                    <span className="text-gray-500">{prettyPct(pct)}</span>
                  </div>
                </div>
              )
            })}
            <div className="pt-2 text-sm text-gray-500">
              Totale: <span className="font-medium tabular-nums">{total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}