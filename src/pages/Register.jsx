import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiAuth } from '../lib/api'
import { setToken, setUser } from '../lib/auth'

export default function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState({ customer: true, seller: false, admin: false })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  function toggle(r) { setRoles(v => ({ ...v, [r]: !v[r] })) }

  async function submit(e){
    e.preventDefault()
    setErr(null); setLoading(true)
    try {
      const selected = Object.entries(roles).filter(([,v])=>v).map(([k])=>k)
      const res = await apiAuth.register({ name, email, password, roles: selected })
      if (!res?.token || !res?.user) throw new Error('register_failed')
      setToken(res.token)
      setUser(res.user)
      const next = (res.user.roles.includes('admin') || res.user.roles.includes('seller')) ? '/dashboard' : '/account'
      nav(next, { replace: true })
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Registrati</h1>
        {err && <p className="text-red-600 mb-3 break-all">{err}</p>}
        <form className="space-y-3" onSubmit={submit}>
          <input className="input w-full" placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <div>
            <div className="text-sm text-gray-600 mb-2">Seleziona i ruoli</div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={roles.customer} onChange={()=>toggle('customer')} /> Cliente</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={roles.seller} onChange={()=>toggle('seller')} /> Agente/Venditore</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={roles.admin} onChange={()=>toggle('admin')} /> Admin</label>
            </div>
          </div>
          <button className="btn primary w-full" type="submit" disabled={loading}>{loading ? 'Registrazione…' : 'Crea account'}</button>
        </form>
        <div className="mt-3 text-sm text-gray-600">
          Hai già un account? <Link to="/login" className="text-blue-600">Accedi</Link>
        </div>
      </div>
    </div>
  )
}

