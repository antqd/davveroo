import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { apiAuth } from '../lib/api'
import { setToken, setUser } from '../lib/auth'

export default function Login() {
  const nav = useNavigate()
  const { state } = useLocation()
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
      const res = await apiAuth.login(email, password, selected)
      // Expect backend to return { token, user: { id, name, email, roles: [] } }
      if (!res?.token || !res?.user) throw new Error('login_failed')
      setToken(res.token)
      setUser(res.user)
      const redirect = state?.from || (res.user.roles.includes('admin') || res.user.roles.includes('seller') ? '/dashboard' : '/account')
      nav(redirect, { replace: true })
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Accedi</h1>
        {err && <p className="text-red-600 mb-3 break-all">{err}</p>}
        <form className="space-y-3" onSubmit={submit}>
          <input className="input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <div>
            <div className="text-sm text-gray-600 mb-2">Che tipo sei?</div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={roles.customer} onChange={()=>toggle('customer')} /> Cliente</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={roles.seller} onChange={()=>toggle('seller')} /> Agente/Venditore</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={roles.admin} onChange={()=>toggle('admin')} /> Admin</label>
            </div>
          </div>
          <button className="btn primary w-full" type="submit" disabled={loading}>{loading ? 'Accesso…' : 'Entra'}</button>
        </form>
        <div className="mt-3 text-sm text-gray-600">
          Non hai un account? <Link to="/register" className="text-blue-600">Registrati</Link>
        </div>
      </div>
    </div>
  )
}

