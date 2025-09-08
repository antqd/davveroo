import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#8884d8','#82ca9d','#ffc658','#ff7f50','#00bcd4','#a1887f','#8bc34a']

export default function TopSellersAdmin() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7)) // YYYY-MM

  useEffect(() => {
    apiGet('/top-sellers')
      .then(d => setItems(d.items || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  const total = useMemo(() => items.reduce((s,i)=>s+Number(i.value||0),0), [items])

  function addRow() {
    setItems(p => [...p, { label: '', value: 0 }])
  }
  function update(i, key, val) {
    const copy = [...items]
    copy[i] = { ...copy[i], [key]: key==='value' ? Number(val) : val }
    setItems(copy)
  }
  async function save() {
    setErr(null)
    try {
      await apiPost('/top-sellers', { items, month }, { 'x-admin-token': token })
      alert('Salvato!')
    } catch (e) {
      setErr(e.message)
    }
  }

  if (!token) {
    return <div className="card text-red-600">Token mancante. Aggiungi <code>?token=Expo2026@@</code> alla URL.</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Top Sellers – Admin</h1>

      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm">Mese</label>
          <input className="input" type="month" value={month} onChange={e=>setMonth(e.target.value)} />
          <button className="btn" onClick={addRow}>+ Aggiungi riga</button>
          <button className="btn primary" onClick={save}>Salva</button>
        </div>

        {loading && <p>Caricamento…</p>}
        {err && <p className="text-red-600">{err}</p>}

        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Voce</th>
                <th className="th" style={{width:140}}>Valore</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="td">
                    <input className="input w-full" value={it.label} onChange={e=>update(i,'label',e.target.value)} />
                  </td>
                  <td className="td">
                    <input className="input w-32" type="number" min="0" value={it.value} onChange={e=>update(i,'value',e.target.value)} />
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td className="td" colSpan={2}>Nessun dato</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Anteprima (percentuali)</h2>
        <div style={{width:'100%', height:320}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={items} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} label>
                {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v)=>[v, 'Valore']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500">Totale: {total}</p>
      </div>
    </div>
  )
}