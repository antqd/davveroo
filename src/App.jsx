import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Account from './pages/Account'
import TopSellersAdmin from './pages/TopSellersAdmin'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* nav semplice */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <span className="font-semibold">Davveroo</span>
          <nav className="ml-auto flex gap-2">
            <NavLink className="btn" to="/dashboard">Dashboard Agente</NavLink>
            <NavLink className="btn" to="/admin">Admin</NavLink>
            <NavLink className="btn" to="/account">Account Cliente</NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />

          {/* pagina protetta via token query (?token=...) */}
          <Route path="/top-sellers-admin" element={<TopSellersAdmin />} />

          {/* catch-all: porta sempre alla dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}