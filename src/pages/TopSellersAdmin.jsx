import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../lib/api'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const LS_KEY = 'tops_token'

export default function TopSellersAdmin() {
  const [token, setToken] = useState(localStorage.getItem(LS_KEY) || '')
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [items, setItems] = useState([{ agent_name:'', value:0 }])
  const [remote, setRemote] = useState(null)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    apiGet(`/api/top-sellers?month=${month}`).then(d => setRemote(d)).catch(()=>{})
  }, [month])

  const total = useMemo(()=> items.reduce((s,i)=> s + Number(i.value||0), 0), [items])

  function useToken() {
    if (token.trim()==='') return false
    localStorage.setItem(LS_KEY, token.trim())
    setToken(token.trim())
    return true
  }

  function addRow(){ setItems([...items, { agent_name:'', value:0 }]) }
  function setRow(i, patch){ const next=[...items]; next[i] = {...next[i], ...patch}; setItems(next) }
  function delRow(i){ setItems(items.filter((_,idx)=> idx!==i)) }

  async function save(e){
    e.preventDefault()
    const clean = items
      .map(x => ({ agent_name: x.agent_name.trim(), value: Number(x.value||0) }))
      .filter(x => x.agent_name && x.value>0)
    if (!clean.length) { setErr('Nessun elemento valido'); return }
    try{
      const r = await apiPost('/api/top-sellers/set', { month_key: month, items: clean }, { 'x-admin-token': token })
      setMsg(`Salvato (${r.saved}) per ${r.month_key}`)
      setErr(null)
      const d = await apiGet(`/api/top-sellers?month=${month}`); setRemote(d)
    }catch(e){ setErr(e.message); setMsg(null) }
  }

  const chartData = (remote?.items || []).map(i => ({ name: `${i.name} (${i.pct}%)`, value: i.value }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Top Seller – Admin</h1>

      {!token ? (
        <div className="card">
          <div className="flex gap-2 items-end">
            <input className="input" placeholder="Token" value={token} onChange={e=>setToken(e.target.value)} />
            <button className="btn" onClick={useToken}>Entra</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Usa il token condiviso.</p>
        </div>
      ) : (
        <>
          {msg && <div className="p-3 rounded bg-green-50 text-green-700">{msg}</div>}
          {err && <div className="p-3 rounded bg-red-50 text-red-700">{err}</div>}

          <div className="card">
            <form className="space-y-4" onSubmit={save}>
              <div className="flex gap-3 items-center">
                <label className="w-36 text-sm">Mese</label>
                <input type="month" className="input w-52" value={month} onChange={e=>setMonth(e.target.value)} />
              </div>

              <div className="space-y-2">
                {items.map((row,i)=>(
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input className="input col-span-7" placeholder="Nome agente"
                      value={row.agent_name} onChange={e=>setRow(i,{agent_name:e.target.value})}/>
                    <input className="input col-span-3" placeholder="Valore" type="number" min="0"
                      value={row.value} onChange={e=>setRow(i,{value:e.target.value})}/>
                    <button type="button" className="btn col-span-2" onClick={()=>delRow(i)}>Rimuovi</button>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <button type="button" className="btn" onClick={addRow}>+ Aggiungi</button>
                  <div>Totale: <b>{total}</b></div>
                </div>
              </div>

              <button className="btn" type="submit">Salva mese</button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Anteprima {remote?.month_key || month}</h2>
            {remote?.items?.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" outerRadius="90%">
                      {chartData.map((_,i)=>(<Cell key={i} />))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
            </div>
            ) : (<p className="text-gray-500">Nessun dato per questo mese.</p>)}
          </div>
        </>
      )}
    </div>
  )
}