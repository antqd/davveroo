import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../lib/api'

export default function Admin() {
  // Crea cliente
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [agentId, setAgentId] = useState('')
  const [registeredBy, setRegisteredBy] = useState('')

  // Acquisto
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [status, setStatus] = useState('pending')
  const [amount, setAmount] = useState('')

  // Supporto
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    apiGet('/products').then(d => setProducts(d.items || [])).catch(() => {})
    apiGet('/customers').then(d => setCustomers(d.items || [])).catch(() => {})
  }, [])

  function note(ok, text){ ok ? setMsg(text) : setErr(text); setTimeout(()=>{setMsg(null);setErr(null)}, 4000) }

  async function createCustomer(e){
    e.preventDefault()
    try {
      const body = {
        full_name: fullName,
        email: email || null,
        agent_id: agentId ? Number(agentId) : null,
        registered_by_customer_id: registeredBy ? Number(registeredBy) : null
      }
      const r = await apiPost('/customers', body)
      note(true, `Cliente creato (id ${r.id})`)
      setFullName(''); setEmail(''); setAgentId(''); setRegisteredBy('')
      const d = await apiGet('/customers'); setCustomers(d.items || [])
    } catch (e) { note(false, e.message) }
  }

  async function createPurchase(e){
    e.preventDefault()
    try {
      const body = {
        customer_id: Number(customerId),
        product_id: Number(productId),
        status,
        amount: amount ? Number(amount) : null
      }
      const r = await apiPost('/purchases', body)
      note(true, `Acquisto registrato (id ${r.id})`)
      setCustomerId(''); setProductId(''); setStatus('pending'); setAmount('')
    } catch (e) { note(false, e.message) }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin</h1>

      {msg && <div className="p-3 rounded bg-green-50 text-green-700">{msg}</div>}
      {err && <div className="p-3 rounded bg-red-50 text-red-700">{err}</div>}

      {/* CREA CLIENTE */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Crea cliente</h2>
        <form className="grid gap-3" onSubmit={createCustomer}>
          <input className="input" placeholder="Nome completo *" value={fullName} onChange={e=>setFullName(e.target.value)} required />
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="ID agente (opz.)" value={agentId} onChange={e=>setAgentId(e.target.value)} />
          <select className="input" value={registeredBy} onChange={e=>setRegisteredBy(e.target.value)}>
            <option value="">Registrato da (cliente) — opzionale</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.id} — {c.full_name}</option>)}
          </select>
          <button className="btn" type="submit">Crea</button>
        </form>
      </div>

      {/* REGISTRA ACQUISTO */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Registra acquisto/contratto</h2>
        <form className="grid gap-3" onSubmit={createPurchase}>
          <select className="input" value={customerId} onChange={e=>setCustomerId(e.target.value)} required>
            <option value="">Cliente *</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.id} — {c.full_name}</option>)}
          </select>

          <select className="input" value={productId} onChange={e=>setProductId(e.target.value)} required>
            <option value="">Prodotto *</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="pending">pending</option>
            <option value="active">active (sblocca referral)</option>
            <option value="cancelled">cancelled</option>
          </select>

          <input className="input" placeholder="Importo (opz.)" value={amount} onChange={e=>setAmount(e.target.value)} />

          <button className="btn" type="submit">Salva acquisto</button>
        </form>
      </div>
    </div>
  )
}